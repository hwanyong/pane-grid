"""docs/images/*.svg 를 만들고 Chrome headless 로 같은 이름의 .png 를 렌더링한다.

실행: python3 docs/images/build.py   (저장소 루트에서)
그림의 사실 근거는 docs/direction.md §2 · §4.1 이다. 근거가 바뀌면 이 파일의 문자열을 고치고 다시 실행한다.
"""

import html
import pathlib
import subprocess
import sys
import tempfile

OUT = pathlib.Path(__file__).resolve().parent
CHROME = "/Users/uhd/.claude/jobs/2d2d4469/tmp/scratch/bp/tgt-fail/chrome"
SANS = "Apple SD Gothic Neo, sans-serif"
# 여러 줄 글자의 줄 간격. lines() 와 note() · callout() 의 상자 높이가 함께 쓴다.
ROW_GAP = 21

GRAY = "#4b5563"
LINE = "#9ca3af"
ENGINE_FILL = "#f3f4f6"
WORKER_FILL = "#eff6ff"
WORKER_LINE = "#3b82f6"
GRID_FILL = "#ecfdf5"
GRID_LINE = "#059669"
FAIL = "#dc2626"
FAIL_FILL = "#fef2f2"
WHITE = "#ffffff"
TEXT = "#111827"
DIVIDER = "#e5e7eb"


def esc(text):
    return html.escape(text, quote=False)


def text(x, y, body, size=15, weight="normal", color=TEXT, anchor="start"):
    return (
        f'<text x="{x}" y="{y}" font-family="{SANS}" font-size="{size}" font-weight="{weight}" '
        f'fill="{color}" text-anchor="{anchor}" paint-order="stroke" stroke="{WHITE}" stroke-width="4" '
        f'stroke-linejoin="round">{esc(body)}</text>'
    )


def lines(x, y, rows, size=14, gap=ROW_GAP, **kw):
    return "".join(text(x, y + i * gap, row, size=size, **kw) for i, row in enumerate(rows))


def box(x, y, w, h, fill, stroke, radius=8, dash=None):
    dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" '
        f'stroke="{stroke}" stroke-width="1.5"{dash_attr}/>'
    )


def arrow(x1, y1, x2, y2, dash=None):
    dash_attr = f' stroke-dasharray="{dash}"' if dash else ""
    return (
        f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{GRAY}" stroke-width="1.8"'
        f'{dash_attr} marker-end="url(#arrow)"/>'
    )


def fail_mark(x, y, label):
    return (
        f'<circle cx="{x}" cy="{y}" r="13" fill="{FAIL}"/>'
        + f'<text x="{x}" y="{y + 5}" font-family="{SANS}" font-size="14" font-weight="bold" fill="{WHITE}" '
        + f'text-anchor="middle">{esc(label.lstrip("✕"))}</text>'
    )


DEFS = f"""<defs>
<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
<path d="M0,0 L10,5 L0,10 z" fill="{GRAY}"/></marker>
</defs>"""


def svg(width, height, body):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}"><rect width="100%" height="100%" fill="{WHITE}"/>{DEFS}{body}</svg>'
    )


# structure() 의 왼쪽 상자에서 한 줄이 차지하는 높이. lines() 는 ROW_GAP 으로 그리므로 상자 아래 여백이 줄 수만큼 1 씩 커진다
# (k10 F74 2단계. 맞추면 그림이 바뀌므로 그대로 두었다).
ROW_PITCH = 22


# 그림 문서와 그 크기(Chrome 창 크기로도 쓴다)를 돌려준다.
def structure():
    width = 1420
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
        h = 44 + len(rows) * ROW_PITCH
        parts.append(box(64, y, 592, h, WHITE, LINE))
        parts.append(text(80, y + 26, title, size=16, weight="bold"))
        parts.append(lines(80, y + 50, rows))
        y += h + 16
    parts.append(box(64, y, 592, 74, WHITE, LINE, dash="6 4"))
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
        h = 46 + len(rows) * ROW_PITCH
        parts.append(arrow(722, y + h / 2, 768, y + h / 2))
        parts.append(box(770, y, 610, h, fill, stroke))
        parts.append(text(788, y + 27, "worker · " + title, size=15, weight="bold"))
        parts.append(lines(788, y + 51, rows))
        bus_bottom = y + h / 2
        y += h + 22
    parts.append(f'<line x1="720" y1="110" x2="720" y2="{bus_bottom}" stroke="{GRAY}" stroke-width="2"/>')
    legend = [
        "$ 호출 · 이벤트: worker 마다 MessagePort 1개.",
        "오가는 것은 순수 데이터뿐이고 함수는 넘어가지 않는다.",
        "worker 끼리는 직접 호출 · import · 메모리 공유가 없다.",
        "순서와 index 는 R1c 실행의 next.trace 와 debug log 에서 읽었다.",
    ]
    parts.append(lines(770, y + 10, legend, color=GRAY))
    # 높이는 가장 아래의 것(엔진 상자 또는 오른쪽 설명)에서 41 아래다. 내용이 늘면 그림이 함께 커진다.
    height = max(engine_bottom, y + 10 + len(legend) * ROW_GAP) + 41
    return svg(width, height, "".join(parts)), width, height


LANES = [
    ("표면 (terminal)", 140),
    ("엔진", 470),
    ("pane-grid (index 0)", 800),
    ("중간 mod (index 1 ~ 3)", 1060),
    ("filetree (index 4)", 1320),
]
SURFACE, ENGINE, GRID, MID, TREE = (x for _, x in LANES)
CALLOUT_X = 1460


# structure() 와 같이 그림 문서와 크기를 돌려준다. 단계의 y 는 앞 단계에서 더해 가며 정하고, 세로선 끝 · 아래 설명 · 높이는
# 마지막 단계의 아래 끝에서 정한다. 단계를 끼우거나 줄을 더해도 그 뒤의 좌표를 고칠 필요가 없다.
def lifecycle():
    width = 1960
    lane_top, lane_head = 66, 40
    parts = [text(40, 44, "pane 이벤트 순서와 실패 지점 (filetree 의 pane 을 pane-grid 가 다룰 때)", size=22, weight="bold")]
    # 세로선은 끝 y 를 알아야 하므로 자리만 잡고 마지막에 채운다(structure() 의 engine_at 과 같다).
    lane_at = []
    for name, x in LANES:
        parts.append(box(x - 110, lane_top, 220, lane_head, WHITE, GRAY))
        parts.append(text(x, 92, name, size=15, weight="bold", anchor="middle"))
        lane_at.append(len(parts))
        parts.append("")
    divider_at = len(parts)
    parts.append("")
    parts.append(text(CALLOUT_X, 92, "실패 지점 (빨간 번호)", size=16, weight="bold", color=FAIL))

    def call(x1, x2, y, label, dash=None):
        parts.append(arrow(x1, y, x2 - 6 if x2 > x1 else x2 + 6, y, dash=dash))
        parts.append(text(min(x1, x2) + 12, y - 9, label, size=14))

    # 상자의 아래 끝을 돌려준다.
    def note(x, y, rows, w=300, fill=WHITE, stroke=LINE):
        h = 14 + len(rows) * ROW_GAP
        parts.append(box(x, y, w, h, fill, stroke, radius=6))
        parts.append(lines(x + 12, y + 22, rows, size=14))
        return y + h

    def callout(mark_x, mark_y, label, rows):
        parts.append(f'<line x1="{mark_x + 13}" y1="{mark_y}" x2="{CALLOUT_X}" y2="{mark_y}" stroke="{FAIL}" stroke-width="1.2" stroke-dasharray="3 3"/>')
        parts.append(fail_mark(mark_x, mark_y, label))
        h = 16 + len(rows) * ROW_GAP
        parts.append(box(CALLOUT_X, mark_y - 16, 470, h, FAIL_FILL, FAIL, radius=6))
        parts.append(text(CALLOUT_X + 12, mark_y + 5, label + "  " + rows[0], size=14, weight="bold", color=FAIL))
        parts.append(lines(CALLOUT_X + 12, mark_y + 26, rows[1:], size=14))

    y = 150
    call(TREE, ENGINE, y, "① $.ui.open({ id: 'filetree' })")
    note(ENGINE + 10, y + 12, ["ui.open 연쇄: index 가 작은 hook 이 제목 변경 · deny 가능"], w=380)

    y += 90
    call(ENGINE, SURFACE, y, "② 배치: dock · 보이는 pane 1개, 나머지 탭")

    y += 50
    note(ENGINE - 150, y, ["③ 보이는 pane 에만 ui.render 요청을 만든다"], w=320, fill=ENGINE_FILL, stroke=GRAY)
    callout(ENGINE + 190, y + 17, "✕5", [
        "보이지 않는 pane 에는 요청이 없다 (R2)",
        "invalidate · 파일 변경에도 render 0회.",
        "보이지 않는 남의 mod 의 새 트리를 받을 수 없다",
    ])

    y += 110
    call(ENGINE, GRID, y, "④ ui.render { component: 'Pane', requestId: 'filetree' }")
    callout(GRID, y + 40, "✕1", [
        "requestId 를 바꾼 next() 는 거부",
        "next({ ...e, requestId: 'grid' }) →",
        "changed requestId (the envelope is the engine's)",
    ])

    y += 130
    call(GRID, MID, y, "⑤ next(e)")
    y += 30
    call(MID, TREE, y, "next(e)")

    y += 30
    note(TREE - 160, y, ["⑥ 직접 답한다 (next 를 부르지 않는다)"], w=290, fill=WORKER_FILL, stroke=WORKER_LINE)
    callout(TREE, y + 60, "✕4", [
        "pane-grid 의 index 가 filetree 보다 크면 호출되지 않는다 (R1b)",
        "설치본을 나중에 설치하면 index 가 filetree 보다 커진다.",
        "연쇄가 ⑥ 에서 끝나 pane-grid 의 로그 0줄",
    ])

    y += 110
    call(TREE, MID, y, "⑦ 트리 반환", dash="6 4")
    y += 30
    call(MID, GRID, y, "Button: press { plugin: 'filetree', handle }", dash="6 4")

    y += 30
    note(GRID - 150, y, [
        "⑧ 이 요청의 next(e) 결과는 그대로 쓸 수 있다",
        "→ 저장해 둔 다른 mod 트리와 나란히 그리기 가능",
    ], w=330, fill=GRID_FILL, stroke=GRID_LINE)
    callout(GRID + 190, y + 80, "✕2", [
        "다른 요청에서 저장한 남의 Button 은 hook 실패",
        "returned a Button it did not draw (child-a#1);",
        "a render hook may keep the ones next(e) returned",
    ])

    y += 160
    call(GRID, ENGINE, y, "⑨ 트리 반환 → ② 검사", dash="6 4")
    y += 50
    call(ENGINE, SURFACE, y, "⑩ 그린다")

    y += 80
    call(SURFACE, ENGINE, y, "⑪ Button 누름 → ui.press { plugin, element, requestId }")
    y += 70
    call(ENGINE, GRID, y, "⑫ ui.press 연쇄")
    callout(GRID, y + 30, "✕3", [
        "plugin 을 바꾼 next() 는 거부",
        "next() passed an argument with a plugin",
        "other than the one that drew the element",
    ])
    y += 110
    call(ENGINE, TREE, y, "⑬ core 가 handle 로 filetree worker 의 onPress 를 실행")

    y += 80
    call(GRID, ENGINE, y, "⑭ $.ui.invalidate('ui.render')")
    bottom = note(ENGINE - 150, y + 20, [
        "⑮ ③ 으로 돌아간다: 보이는 pane 만 다시 render (R3)",
        "보이지 않는 pane 은 다시 ✕5",
    ], w=420, fill=ENGINE_FILL, stroke=GRAY)

    lane_bottom = bottom + 54
    for at, (_, x) in zip(lane_at, LANES):
        parts[at] = f'<line x1="{x}" y1="{lane_top + lane_head}" x2="{x}" y2="{lane_bottom}" stroke="{LINE}" stroke-width="1.5" stroke-dasharray="4 4"/>'
    parts[divider_at] = f'<line x1="{CALLOUT_X - 20}" y1="{lane_top}" x2="{CALLOUT_X - 20}" y2="{lane_bottom}" stroke="{DIVIDER}" stroke-width="1"/>'
    legend_y = lane_bottom + 30
    parts.append(lines(40, legend_y, [
        "실선 화살표: 호출 · 이벤트. 점선 화살표: 반환. 빨간 번호의 근거와 시험 폴더는 docs/pane-lifecycle.md 의 표에 있다.",
    ], color=GRAY))
    height = legend_y + 50
    return svg(width, height, "".join(parts)), width, height


# SVG 와 PNG 를 임시 이름으로 만들고 Chrome 이 성공한 뒤에만 두 파일을 제 이름으로 옮긴다. Chrome 이 실패하면
# 그 stderr 를 내고 종료 코드 1 로 끝나며, 이전 SVG · PNG 는 그대로 남아 둘이 어긋나지 않는다.
def render(name, document, width, height):
    svg_path = OUT / f"{name}.svg"
    png_path = OUT / f"{name}.png"
    svg_draft = OUT / f"{name}.draft.svg"
    png_draft = OUT / f"{name}.draft.png"
    svg_draft.write_text(document, encoding="utf-8")
    with tempfile.TemporaryDirectory() as profile:
        result = subprocess.run([
            CHROME, "--headless=new", f"--user-data-dir={profile}", "--hide-scrollbars",
            "--force-device-scale-factor=2", f"--window-size={width},{height}",
            f"--screenshot={png_draft}", svg_draft.as_uri(),
        ], capture_output=True, text=True)
    if result.returncode != 0:
        svg_draft.unlink()
        png_draft.unlink(missing_ok=True)
        sys.stderr.write(result.stderr)
        sys.exit(f"{CHROME} exited with {result.returncode} while rendering {svg_path.name}")
    svg_draft.replace(svg_path)
    png_draft.replace(png_path)
    print(png_path)


render("pane-structure", *structure())
render("pane-lifecycle", *lifecycle())
