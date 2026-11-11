"""docs/images/*.svg 를 만들고 Chrome headless 로 같은 이름의 .png 를 렌더링한다.

실행: python3 docs/images/build.py   (저장소 루트에서)
그림의 사실 근거는 docs/direction.md §2 · §4.1 이다. 근거가 바뀌면 이 파일의 문자열을 고치고 다시 실행한다.
"""

import html
import pathlib
import subprocess
import tempfile

OUT = pathlib.Path(__file__).resolve().parent
CHROME = "/Users/uhd/.claude/jobs/2d2d4469/tmp/scratch/bp/base-nopng/chrome"
SANS = "Apple SD Gothic Neo, sans-serif"
MONO = "Menlo, monospace"

GRAY = "#4b5563"
LINE = "#9ca3af"
ENGINE_FILL = "#f3f4f6"
WORKER_FILL = "#eff6ff"
WORKER_LINE = "#3b82f6"
GRID_FILL = "#ecfdf5"
GRID_LINE = "#059669"
FAIL = "#dc2626"
FAIL_FILL = "#fef2f2"


def esc(text):
    return html.escape(text, quote=False)


def text(x, y, body, size=15, weight="normal", color="#111827", anchor="start", mono=False):
    family = MONO if mono else SANS
    return (
        f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" font-weight="{weight}" '
        f'fill="{color}" text-anchor="{anchor}" paint-order="stroke" stroke="#ffffff" stroke-width="4" '
        f'stroke-linejoin="round">{esc(body)}</text>'
    )


def lines(x, y, rows, size=14, gap=21, **kw):
    return "".join(text(x, y + i * gap, row, size=size, **kw) for i, row in enumerate(rows))


def box(x, y, w, h, fill, stroke, radius=8, dash=None):
    dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" '
        f'stroke="{stroke}" stroke-width="1.5"{dash_attr}/>'
    )


def arrow(x1, y1, x2, y2, color=GRAY, dash=None, marker="arrow"):
    dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
    return (
        f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.8"'
        f'{dash_attr} marker-end="url(#{marker})"/>'
    )


def fail_mark(x, y, label):
    return (
        f'<circle cx="{x}" cy="{y}" r="13" fill="{FAIL}"/>'
        + f'<text x="{x}" y="{y + 5}" font-family="{SANS}" font-size="14" font-weight="bold" fill="#ffffff" '
        + f'text-anchor="middle">{esc(label.lstrip("✕"))}</text>'
    )


DEFS = f"""<defs>
<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
<path d="M0,0 L10,5 L0,10 z" fill="{GRAY}"/></marker>
<marker id="arrow-fail" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
<path d="M0,0 L10,5 L0,10 z" fill="{FAIL}"/></marker>
</defs>"""


def svg(width, height, body):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}"><rect width="100%" height="100%" fill="#ffffff"/>{DEFS}{body}</svg>'
    )


def structure():
    width, height = 1420, 830
    parts = [text(40, 44, "구조: Claude Code 엔진과 mod 마다 따로 도는 worker", size=22, weight="bold")]

    engine_at = len(parts)
    parts.append("")
    parts.append(text(60, 102, "Claude Code 엔진 (호스트 프로세스)", size=18, weight="bold"))
    sections = [
        ("① ui.render 연쇄", [
            "그리기 요청 1개 = pane 1개 (requestId)",
            "envelope(surface · component · requestId · viewport)는",
            "엔진이 정하고 hook 이 바꾸면 거부된다",
            "순서: @inline(--plugin-dir · CLAUDE_CODE_PLUGIN_DIRS)",
            "→ 설치본 → builtin → core",
            "설치본 순서: enabledPlugins 키 순서 (grid-and-tabs.md 7회차)",
            "next 를 부르지 않고 답하면 그보다 index 가 큰 hook 은 실행되지 않는다",
        ]),
        ("② 반환 트리 검사", [
            "상호작용 요소(Button · Input · Select)는",
            "그 요청 안에서 직접 그린 것과 next(e) 로 받은 것만 허용",
            "어기면 hook 실패 → 엔진이 대신 그린다",
        ]),
        ("③ ui.press 처리", [
            "트리의 Button 은 press: { plugin, handle } 만 갖는다",
            "core 가 handle 로 그린 mod 의 worker 에서 onPress 실행",
            "next() 에 다른 plugin · element 를 넣으면 거부",
        ]),
        ("④ 그리기 요청 생성", [
            "보이는 pane 1개에만 ui.render 요청을 만든다",
            "보이지 않는 pane(isShown false): 요청 없음 ($.ui.invalidate 를 불러도)",
        ]),
    ]
    y = 125
    for title, rows in sections:
        h = 44 + len(rows) * 22
        parts.append(box(64, y, 592, h, "#ffffff", LINE))
        parts.append(text(80, y + 26, title, size=16, weight="bold"))
        parts.append(lines(80, y + 50, rows, mono=False))
        y += h + 16
    parts.append(box(64, y, 592, 74, "#ffffff", LINE, dash="6 4"))
    parts.append(text(80, y + 26, "terminal 표면", size=16, weight="bold"))
    parts.append(text(80, y + 52, "보이는 pane 1개 + 나머지는 탭 (분할 API 없음)", size=14))
    engine_bottom = y + 74 + 20
    parts[engine_at] = box(40, 70, 640, engine_bottom - 70, ENGINE_FILL, GRAY)

    workers = [
        ("연쇄 index 0 · pane-grid@inline", GRID_FILL, GRID_LINE, [
            "ui.render hook: 모든 Pane 요청을 받는다",
            "자기 onPress 함수는 이 worker 안에만 있다",
        ]),
        ("연쇄 index 1 · usage-gauge", WORKER_FILL, WORKER_LINE, ["next(e) 로 넘긴다"]),
        ("연쇄 index 2 · uhd-kanban", WORKER_FILL, WORKER_LINE, ["next(e) 로 넘긴다"]),
        ("연쇄 index 3 · pending-questions", WORKER_FILL, WORKER_LINE, [
            "requestId 'pending-questions' 는 직접 답한다",
        ]),
        ("연쇄 index 4 · filetree (수정 불가 mod)", WORKER_FILL, WORKER_LINE, [
            "requestId 'filetree' 는 next 를 부르지 않고 직접 답한다",
            "onPress 함수는 이 worker 안에만 있다",
        ]),
    ]
    y = 110
    for title, fill, stroke, rows in workers:
        h = 46 + len(rows) * 22
        parts.append(arrow(722, y + h / 2, 768, y + h / 2))
        parts.append(box(770, y, 610, h, fill, stroke))
        parts.append(text(788, y + 27, "worker · " + title, size=15, weight="bold"))
        parts.append(lines(788, y + 51, rows))
        bus_bottom = y + h / 2
        y += h + 22
    parts.append(f'<line x1="720" y1="110" x2="720" y2="{bus_bottom}" stroke="{GRAY}" stroke-width="2"/>')
    parts.append(lines(770, y + 10, [
        "$ 호출 · 이벤트: worker 마다 MessagePort 1개.",
        "오가는 것은 순수 데이터뿐이고 함수는 넘어가지 않는다.",
        "worker 끼리는 직접 호출 · import · 메모리 공유가 없다.",
        "순서와 index 는 R1c 실행의 next.trace 와 debug log 에서 읽었다.",
    ], color=GRAY))
    return svg(width, height, "".join(parts))


LANES = [
    ("표면 (terminal)", 140),
    ("엔진", 470),
    ("pane-grid (index 0)", 800),
    ("중간 mod (index 1 ~ 3)", 1060),
    ("filetree (index 4)", 1320),
]
LANE = {name: x for name, x in LANES}
SURFACE, ENGINE, GRID, MID, TREE = (x for _, x in LANES)
CALLOUT_X = 1460


def lifecycle():
    width, height = 1960, 1520
    parts = [text(40, 44, "pane 이벤트 순서와 실패 지점 (filetree 의 pane 을 pane-grid 가 다룰 때)", size=22, weight="bold")]
    for name, x in LANES:
        parts.append(box(x - 110, 66, 220, 40, "#ffffff", GRAY))
        parts.append(text(x, 92, name, size=15, weight="bold", anchor="middle"))
        parts.append(f'<line x1="{x}" y1="106" x2="{x}" y2="1440" stroke="{LINE}" stroke-width="1.5" stroke-dasharray="4 4"/>')
    parts.append(f'<line x1="{CALLOUT_X - 20}" y1="66" x2="{CALLOUT_X - 20}" y2="1440" stroke="#e5e7eb" stroke-width="1"/>')
    parts.append(text(CALLOUT_X, 92, "실패 지점 (빨간 번호)", size=16, weight="bold", color=FAIL))

    def call(x1, x2, y, label, dash=None):
        parts.append(arrow(x1, y, x2 - 6 if x2 > x1 else x2 + 6, y, dash=dash))
        parts.append(text(min(x1, x2) + 12, y - 9, label, size=14))

    def note(x, y, rows, w=300, fill="#ffffff", stroke=LINE):
        h = 14 + len(rows) * 21
        parts.append(box(x, y, w, h, fill, stroke, radius=6))
        parts.append(lines(x + 12, y + 22, rows, size=14))

    def callout(mark_x, mark_y, label, rows):
        parts.append(f'<line x1="{mark_x + 13}" y1="{mark_y}" x2="{CALLOUT_X}" y2="{mark_y}" stroke="{FAIL}" stroke-width="1.2" stroke-dasharray="3 3"/>')
        parts.append(fail_mark(mark_x, mark_y, label))
        h = 16 + len(rows) * 21
        parts.append(box(CALLOUT_X, mark_y - 16, 470, h, FAIL_FILL, FAIL, radius=6))
        parts.append(text(CALLOUT_X + 12, mark_y + 5, label + "  " + rows[0], size=14, weight="bold", color=FAIL))
        parts.append(lines(CALLOUT_X + 12, mark_y + 26, rows[1:], size=14))

    call(TREE, ENGINE, 150, "① $.ui.open({ id: 'filetree' })")
    note(ENGINE + 10, 162, ["ui.open 연쇄: index 가 작은 hook 이 제목 변경 · deny 가능"], w=380)

    call(ENGINE, SURFACE, 240, "② 배치: dock · 보이는 pane 1개, 나머지 탭")

    note(ENGINE - 150, 290, ["③ 보이는 pane 에만 ui.render 요청을 만든다"], w=320, fill=ENGINE_FILL, stroke=GRAY)
    callout(ENGINE + 190, 307, "✕5", [
        "보이지 않는 pane 에는 요청이 없다 (R2)",
        "invalidate · 파일 변경에도 render 0회.",
        "보이지 않는 남의 mod 의 새 트리를 받을 수 없다",
    ])

    call(ENGINE, GRID, 400, "④ ui.render { component: 'Pane', requestId: 'filetree' }")
    callout(GRID, 440, "✕1", [
        "requestId 를 바꾼 next() 는 거부",
        "next({ ...e, requestId: 'grid' }) →",
        "changed requestId (the envelope is the engine's)",
    ])

    call(GRID, MID, 530, "⑤ next(e)")
    call(MID, TREE, 560, "next(e)")

    note(TREE - 160, 590, ["⑥ 직접 답한다 (next 를 부르지 않는다)"], w=290, fill=WORKER_FILL, stroke=WORKER_LINE)
    callout(TREE, 650, "✕4", [
        "pane-grid 의 index 가 filetree 보다 크면 호출되지 않는다 (R1b)",
        "설치본을 나중에 설치하면 index 가 filetree 보다 커진다.",
        "연쇄가 ⑥ 에서 끝나 pane-grid 의 로그 0줄",
    ])

    call(TREE, MID, 700, "⑦ 트리 반환", dash="6 4")
    call(MID, GRID, 730, "Button: press { plugin: 'filetree', handle }", dash="6 4")

    note(GRID - 150, 760, [
        "⑧ 이 요청의 next(e) 결과는 그대로 쓸 수 있다",
        "→ 저장해 둔 다른 mod 트리와 나란히 그리기 가능",
    ], w=330, fill=GRID_FILL, stroke=GRID_LINE)
    callout(GRID + 190, 840, "✕2", [
        "다른 요청에서 저장한 남의 Button 은 hook 실패",
        "returned a Button it did not draw (child-a#1);",
        "a render hook may keep the ones next(e) returned",
    ])

    call(GRID, ENGINE, 920, "⑨ 트리 반환 → ② 검사", dash="6 4")
    call(ENGINE, SURFACE, 970, "⑩ 그린다")

    call(SURFACE, ENGINE, 1050, "⑪ Button 누름 → ui.press { plugin, element, requestId }")
    call(ENGINE, GRID, 1120, "⑫ ui.press 연쇄")
    callout(GRID, 1150, "✕3", [
        "plugin 을 바꾼 next() 는 거부",
        "next() passed an argument with a plugin",
        "other than the one that drew the element",
    ])
    parts.append(arrow(ENGINE, 1230, TREE - 6, 1230))
    parts.append(text(ENGINE + 12, 1221, "⑬ core 가 handle 로 filetree worker 의 onPress 를 실행", size=14))

    call(GRID, ENGINE, 1310, "⑭ $.ui.invalidate('ui.render')")
    note(ENGINE - 150, 1330, [
        "⑮ ③ 으로 돌아간다: 보이는 pane 만 다시 render (R3)",
        "보이지 않는 pane 은 다시 ✕5",
    ], w=420, fill=ENGINE_FILL, stroke=GRAY)

    parts.append(lines(40, 1470, [
        "실선 화살표: 호출 · 이벤트. 점선 화살표: 반환. 빨간 번호의 근거와 시험 폴더는 docs/pane-lifecycle.md 의 표에 있다.",
    ], color=GRAY))
    return svg(width, height, "".join(parts))


def render(name, document, width, height):
    svg_path = OUT / f"{name}.svg"
    png_path = OUT / f"{name}.png"
    svg_path.write_text(document, encoding="utf-8")
    with tempfile.TemporaryDirectory() as profile:
        subprocess.run([
            CHROME, "--headless=new", f"--user-data-dir={profile}", "--hide-scrollbars",
            "--force-device-scale-factor=2", f"--window-size={width},{height}",
            f"--screenshot={png_path}", svg_path.as_uri(),
        ], check=True, capture_output=True)
    print(png_path)


render("pane-structure", structure(), 1420, 830)
render("pane-lifecycle", lifecycle(), 1960, 1520)
