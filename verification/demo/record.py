"""README 의 화면을 실제 Claude Code 세션에서 녹화한다.

사용법:
  DEMO_ROOT=<빈 폴더> PANE_GRID_MODS=<규약 mod 폴더>:<규약 mod 폴더>:... \
    <venv>/bin/python verification/demo/record.py [장면 이름 ...]

venv 에는 pillow 와 fonttools 를 설치한다. tmux 와 로그인된 claude 가 필요하다.
PANE_GRID_MODS 에는 usage-gauge · uhd-kanban(skill-kanban 저장소의 plugins/uhd-kanban) · pending-questions 폴더를 적는다.

세션은 DEMO_ROOT/home 을 HOME 으로 쓰므로 사용자의 설정 · 플러그인 · ~/.claude/pane-grid/layout.json 을 읽지 않는다.
로그인은 키체인 폴더만 링크해 가져온다. 응답은 --append-system-prompt-file 의 대본으로 고정한다.
pane-grid 와 규약 mod 세 개 · hotkey · 클릭 · 질문 추출은 실제로 동작한다.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

import render

REPO = Path(__file__).resolve().parents[2]
OUTPUT = REPO / 'docs' / 'images'
ROOT = Path(os.environ['DEMO_ROOT'])
MODS = [Path(path) for path in os.environ.get('PANE_GRID_MODS', '').split(':') if path]
HOME = ROOT / 'home'
PROJECT = HOME / 'billing-api'
LAYOUT_FILE = HOME / '.claude' / 'pane-grid' / 'layout.json'
QUESTION_FILES = HOME / '.claude' / 'pending-questions'
SCRIPT_FILE = HOME / 'scene-script.txt'
WIDTH = 160
HEIGHT = 44
SOCKET = 'pg-demo'
MAX_ATTEMPTS = 3
# 화면에 나오면 그 녹화를 버리는 mod 의 오류 문구. render.FORBIDDEN 은 pending-questions 저장소와 같은 파일이라 여기 따로 둔다.
MOD_ERRORS = re.compile(r'command failed|Cannot read|draws nothing here|not loaded after|hook skipped|: reloaded \(')
TMUX_CONF = """set -g mouse on
set -g status off
set -g focus-events on
set -g default-terminal "xterm-256color"
set -ga terminal-overrides ",*:Tc"
"""

PREAMBLE = """You are in a scripted screen recording. Reply with exactly the scripted text and nothing else. Use no tools unless the script says so. Never add a question that is not in the script.
"""

RELEASE_SCRIPT = """When the message contains "billing release", reply with:

The release notes are ready. Three things need your call before I ship:

1. Which environment should I deploy to, staging or production? I recommend staging.
2. Which checks should run before the deploy: unit, integration, or lint? I recommend unit and lint.
3. What should the release title be? I suggest "Billing 2.4".
"""

# uhd-kanban 이 그릴 보드. (열 폴더, 순서, id, 종류, 제목)
CARDS = (
    ('6-planned', 10, 1, 'milestone', 'Billing 2.4'),
    ('1-to-do', 10, 2, 'task', 'Add invoice PDF export'),
    ('1-to-do', 20, 3, 'bug', 'Tax rounding on refunds'),
    ('3-in-review', 10, 4, 'task', 'Retry failed webhooks'),
    ('4-done', 10, 5, 'task', 'Split billing service'),
    ('4-done', 20, 6, 'task', 'Currency table cache'),
    ('4-done', 30, 7, 'bug', 'Duplicate receipt emails'),
)
KANBAN_COLUMNS = (
    ('1-to-do', 'to-do', ['task', 'bug', 'decision']),
    ('2-in-progress', 'in-progress', ['task', 'bug', 'decision']),
    ('3-in-review', 'in-review', ['task', 'bug']),
    ('4-done', 'done', ['task', 'bug', 'decision', 'milestone']),
    ('6-planned', 'planned', ['milestone']),
)


def cell(id, plugin=None):
    return {'kind': 'cell', 'id': id, **({'plugin': plugin} if plugin else {})}


def split(kind, *parts):
    """parts 는 (노드, 비율) 쌍이다."""
    return {'kind': kind, 'children': [{'node': node, 'size': size} for node, size in parts]}


def tab(name, root, active):
    return {'name': name, 'root': root, 'active': active}


THREE_MODS = tab('main', split(
    'column',
    (cell('c1', 'pending-questions'), 50),
    (split('row', (cell('c2', 'uhd-kanban'), 60), (cell('c3', 'usage-gauge'), 40)), 50),
), 'c2')


def write_layout(*tabs):
    LAYOUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    LAYOUT_FILE.write_text(json.dumps({'version': 1, 'tabs': list(tabs)}, indent=2))


def write_board():
    """uhd-kanban 의 templates/ 로 `.uhd-kanban/` 을 만든다(`uhd-kanban init` 과 같은 파일). 열은 카드가 있는 다섯 개만 남긴다."""
    board = PROJECT / '.uhd-kanban'
    board.mkdir(parents=True, exist_ok=True)
    templates = next(mod for mod in MODS if mod.name == 'uhd-kanban') / 'skills' / 'uhd-kanban' / 'templates'
    statuses = [status for _, status, _ in KANBAN_COLUMNS]
    template = json.loads((templates / 'config.json').read_text())
    config = {
        'locale': 'en',
        **template,
        'columns': [{'dir': dir, 'status': status, 'types': types} for dir, status, types in KANBAN_COLUMNS],
        'dependencies': {**template['dependencies'], 'resolved': ['done'], 'abandoned': []},
        'run': {**template['run'], 'finish': {kind: status for kind, status in template['run']['finish'].items() if status in statuses}},
    }
    shutil.copyfile(templates / 'profiles.json', board / 'profiles.json')
    (board / 'config.json').write_text(json.dumps(config, indent=2))
    shutil.rmtree(PROJECT / 'kanban', ignore_errors=True)
    for folder, order, id, kind, title in CARDS:
        status = next(status for dir, status, _ in KANBAN_COLUMNS if dir == folder)
        path = PROJECT / 'kanban' / folder / f'{order:04d}-k{id}-{re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")}.md'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            '---\n'
            f'id: {id}\ntype: {kind}\ntitle: {title}\npriority: medium\ntags: []\ndepends_on: []\n'
            + ('' if kind == 'milestone' else 'collection: [1]\n')
            + 'created_at: 2026-11-07T05:56:10Z\nupdated_at: 2026-11-07T05:56:10Z\n'
            f'status_history: [2026-11-07T05:56:10Z {status}]\n'
            '---\n'
        )


def prepare_home():
    (HOME / 'bin').mkdir(parents=True, exist_ok=True)
    (HOME / 'Library').mkdir(exist_ok=True)
    PROJECT.mkdir(exist_ok=True)
    real_library = Path.home() / 'Library'
    for name in ('Keychains', 'Preferences'):
        link = HOME / 'Library' / name
        if not link.is_symlink():
            link.symlink_to(real_library / name)
    state = HOME / '.claude.json'
    if not state.exists():
        state.write_text(json.dumps({
            'hasCompletedOnboarding': True,
            'theme': 'dark',
            'projects': {str(PROJECT): {'hasTrustDialogAccepted': True}},
        }))
    plugin_dirs = ' '.join(f'--plugin-dir {path}' for path in [REPO, *MODS])
    wrapper = HOME / 'bin' / 'claude'
    wrapper.write_text(
        '#!/bin/zsh\n'
        f'exec {shutil.which("claude")} --setting-sources project {plugin_dirs} --strict-mcp-config '
        f'--model haiku --permission-mode acceptEdits --append-system-prompt-file {SCRIPT_FILE} '
        f'--debug-file {ROOT / "debug.log"} "$@"\n'
    )
    wrapper.chmod(0o755)
    (ROOT / 'tmux.conf').write_text(TMUX_CONF)
    write_board()


def tmux(*args, check=True):
    return subprocess.run(
        ['tmux', '-L', SOCKET, *args], check=check, capture_output=True, text=True,
    ).stdout


class Take:
    def __init__(self, name, title, layout, script=''):
        self.name = name
        self.title = title
        self.frames = []
        self.stills = []
        self.events = []
        self.forbidden = set()
        self.caption = ''
        self.key_label = ''
        self.fonts = render.Fonts()
        SCRIPT_FILE.write_text(PREAMBLE + script)
        shutil.rmtree(QUESTION_FILES, ignore_errors=True)
        write_layout(*layout)
        self.first_tab = layout[0]['name']
        tmux('kill-server', check=False)
        env = {
            'HOME': str(HOME),
            'PATH': f'{HOME / "bin"}:{os.environ["PATH"]}',
            'LANG': 'en_US.UTF-8',
            'LC_ALL': 'en_US.UTF-8',
            'COLORTERM': 'truecolor',
            'DISABLE_AUTOUPDATER': '1',
            'PS1': '$ ',
        }
        exports = ' '.join(f"{key}='{value}'" for key, value in env.items())
        tmux(
            '-f', str(ROOT / 'tmux.conf'), 'new-session', '-d', '-s', 'demo',
            '-x', str(WIDTH), '-y', str(HEIGHT), '-c', str(PROJECT),
            f"env -u CLAUDE_CONFIG_DIR {exports} zsh -f",
        )
        time.sleep(0.5)
        tmux('send-keys', '-t', 'demo', 'C-l')
        time.sleep(0.3)

    def ansi(self):
        return tmux('capture-pane', '-e', '-p', '-N', '-t', 'demo')

    def text(self):
        return tmux('capture-pane', '-p', '-t', 'demo')

    def rows(self, ansi=None):
        return render.mask_private(render.parse_screen(ansi or self.ansi(), WIDTH, HEIGHT))

    def image(self, ansi=None, mark=None, mark_width=3):
        rows = self.rows(ansi)
        self.forbidden.update(render.forbidden_text(rows))
        self.forbidden.update(matched.group() for row in rows for matched in MOD_ERRORS.finditer(render.row_text(row)))
        return render.draw_frame(rows, WIDTH, HEIGHT, self.fonts, self.title, self.caption, self.key_label, mark, mark_width)

    def say(self, caption):
        self.caption = caption
        self.events.append(caption)

    def shoot(self, duration):
        self.frames.append((self.image(), duration))

    def hold(self, duration, mark=None):
        """마지막 화면을 멈춰 보여 준다. mark 는 (첫 행 정규식, 마지막 행 정규식 또는 None) 이고 테두리를 두 단계로 키운다."""
        time.sleep(0.2)
        ansi = self.ansi()
        if mark is None:
            self.frames.append((self.image(ansi), duration))
            return
        self.frames.append((self.image(ansi, mark, 2), 140))
        self.frames.append((self.image(ansi, mark, 5), 140))
        self.frames.append((self.image(ansi, mark, 3), max(duration - 280, 100)))

    def still(self, name, mark=None):
        self.stills.append((name, self.image(mark=mark)))

    def type_text(self, text):
        """한 번에 두 글자씩 넣고 프레임을 남긴다."""
        for start in range(0, len(text), 2):
            tmux('send-keys', '-t', 'demo', '-l', '--', text[start:start + 2])
            time.sleep(0.03)
            self.shoot(70)

    def press(self, key, label, pause=0.8, duration=500):
        self.key_label = label
        tmux('send-keys', '-t', 'demo', key)
        time.sleep(pause)
        self.shoot(duration)

    def locate(self, pattern):
        """pattern 이 처음 나오는 화면 칸(1부터 센 열, 행). 없으면 None."""
        for row, line in enumerate(self.text().split('\n')):
            matched = re.search(pattern, line)
            if matched:
                return matched.start() + 1, row + 1
        return None

    def click(self, pattern, label='click', pause=1.0, duration=500):
        """pattern 의 첫 글자를 SGR 마우스 누름 · 뗌으로 클릭한다."""
        located = self.locate(pattern)
        if located is None:
            print(self.text())
            raise TimeoutError(f'{self.name}: nothing to click at {pattern}')
        column, row = located
        self.key_label = label
        tmux('send-keys', '-t', 'demo', '-l', f'\x1b[<0;{column};{row}M\x1b[<0;{column};{row}m')
        time.sleep(pause)
        self.shoot(duration)

    def wheel(self, pattern, times, label='mouse wheel'):
        """pattern 위에서 휠을 아래로 times 번 굴린다. pane-grid 는 포인터 아래의 칸만 스크롤한다."""
        located = self.locate(pattern)
        if located is None:
            print(self.text())
            raise TimeoutError(f'{self.name}: nothing to scroll at {pattern}')
        column, row = located
        self.key_label = label
        for _ in range(times):
            tmux('send-keys', '-t', 'demo', '-l', f'\x1b[<65;{column};{row}M')
            time.sleep(0.25)
            self.shoot(160)

    def focus_grid(self):
        """grid pane 의 hotkey 줄 오른쪽 빈 자리를 클릭해 pane 에 포커스를 준다. hotkey 는 포커스가 pane 에 있을 때만 눌린다.

        `q: list` 글자는 Button 이라 그 자리를 클릭하면 list 가 실행되고 포커스는 prompt 에 남는다.
        """
        located = self.locate(r'q: list')
        if located is None:
            raise TimeoutError(f'{self.name}: no grid pane')
        _, row = located
        self.key_label = 'click the grid pane'
        tmux('send-keys', '-t', 'demo', '-l', f'\x1b[<0;{WIDTH - 2};{row}M\x1b[<0;{WIDTH - 2};{row}m')
        time.sleep(1.0)
        self.shoot(500)

    def focus_prompt(self):
        """입력 줄을 클릭해 포커스를 돌려준다. pane 에 포커스가 있으면 slash 명령의 글자가 hotkey 로 눌린다."""
        located = self.locate(r'^❯')
        if located is None:
            raise TimeoutError(f'{self.name}: no prompt line')
        _, row = located
        tmux('send-keys', '-t', 'demo', '-l', f'\x1b[<0;4;{row}M\x1b[<0;4;{row}m')
        time.sleep(0.5)

    def enter_prompt(self, text):
        self.key_label = ''
        self.type_text(text)
        time.sleep(0.3)
        self.press('Enter', 'Enter', pause=0.4)
        self.key_label = ''

    def grid(self, words, duration=1200):
        """`/grid <words>` 를 입력하고 결과 화면을 보여 준다."""
        self.enter_prompt(f'/grid {words}')
        time.sleep(1.5)
        self.hold(duration)

    def wait_for(self, pattern, timeout=120):
        """pattern 이 화면에 나올 때까지 기다린다. 기다리는 동안의 프레임은 앞 두 장과 마지막 장만 남긴다."""
        started = time.time()
        seen = []
        while time.time() - started < timeout:
            ansi = self.ansi()
            if not seen or seen[-1] != ansi:
                seen.append(ansi)
            if re.search(pattern, self.text()):
                kept = seen[:2] + seen[-1:] if len(seen) > 2 else seen
                for screen in kept:
                    self.frames.append((self.image(screen), 300))
                self.events.append(f'waited {time.time() - started:.0f}s for {pattern}')
                return
            time.sleep(1)
        print(self.text())
        raise TimeoutError(f'{self.name}: {pattern}')

    def start_claude(self):
        """claude 를 띄우고 grid 탭을 보이게 한다. 이 준비는 프레임에 남기지 않는다.

        칸에 놓이지 않은 mod 는 자기 pane 을 열므로 grid 탭이 숨은 탭으로 남을 수 있다. 그때는 /grid select 로 보이게 한다.
        """
        tmux('send-keys', '-t', 'demo', '-l', 'claude')
        tmux('send-keys', '-t', 'demo', 'Enter')
        started = time.time()
        is_selected = False
        while not re.search(r'q: list', self.text()):
            elapsed = time.time() - started
            if not is_selected and elapsed > 15 and re.search(r'^❯', self.text(), re.M):
                tmux('send-keys', '-t', 'demo', '-l', f'/grid select {self.first_tab}')
                tmux('send-keys', '-t', 'demo', 'Enter')
                is_selected = True
            if elapsed > 60:
                print(self.text())
                raise TimeoutError(f'{self.name}: the grid pane did not open')
            time.sleep(1)
        time.sleep(3)

    def finish(self):
        if self.forbidden:
            raise TimeoutError(f'{self.name}: frames contain {sorted(self.forbidden)}')
        OUTPUT.mkdir(parents=True, exist_ok=True)
        render.save_apng(OUTPUT / f'{self.name}.png', self.frames)
        for name, image in self.stills:
            image.save(OUTPUT / f'{name}.png', optimize=True)
        total = sum(duration for _, duration in self.frames) / 1000
        size = (OUTPUT / f'{self.name}.png').stat().st_size
        print(f'{self.name}: {len(self.frames)} frames, {total:.1f}s, {size} bytes')
        for event in self.events:
            print(f'  {event}')
        tmux('kill-server', check=False)


def scene_overview():
    take = Take('demo-overview', 'pane-grid: three mods in one pane', [THREE_MODS], RELEASE_SCRIPT)
    take.start_claude()
    take.say('1. One grid pane holds three mods: questions, a kanban board, rate limits')
    take.hold(2600)
    take.say('2. Claude asks three questions at the end of a response')
    take.enter_prompt('Prepare the billing release.')
    take.wait_for(r'Three things')
    take.say('3. pending-questions draws them in its cell')
    take.wait_for(r'q1\. Which')
    take.hold(2400, (r'c1 pending-questions', None))
    take.still('grid-three-mods')
    take.say('4. The wheel scrolls only the cell under the pointer')
    take.wheel(r'q1\. Which', 8)
    take.hold(1600)
    take.finish()


def scene_split():
    take = Take('demo-split-place', 'pane-grid: split and place', [tab('main', cell('c1'), 'c1')])
    take.start_claude()
    take.say('1. An empty cell lists the grid-ready mods that are loaded')
    take.hold(2200, (r'empty\. place', r'usage-gauge'))
    take.focus_grid()
    take.say('2. A digit places that mod in the active cell')
    take.press('2', '2')
    take.hold(1200)
    take.say('3. v splits the active cell left and right')
    take.press('v', 'v')
    take.hold(1400, (r'empty\. place', r'usage-gauge'))
    take.say('4. The new cell offers the rest. 3 places usage-gauge')
    take.press('3', '3')
    take.hold(1200)
    take.say('5. s splits top and bottom')
    take.press('s', 's')
    take.press('1', '1')
    take.hold(2200)
    take.say('6. A mod lives in one cell. Picking it again moves it')
    take.press('s', 's')
    take.hold(1600, (r'move from', None))
    take.press('2', '2')
    take.hold(2400)
    take.finish()


def scene_arrange():
    take = Take('demo-arrange', 'pane-grid: resize, presets, zoom, swap', [THREE_MODS])
    take.start_claude()
    take.say('1. /grid resize sets the active cell\'s share in percent')
    take.grid('resize 35', 1800)
    take.say('2. /grid layout applies a tmux preset')
    take.grid('layout tiled', 1800)
    take.grid('layout main-vertical', 1800)
    take.focus_grid()
    take.say('3. z zooms the active cell, z again restores the grid')
    take.press('z', 'z', duration=1800)
    take.press('z', 'z', duration=1200)
    take.say('4. o moves to the next cell, w swaps it with the one after')
    take.press('o', 'o', duration=900)
    take.press('w', 'w', duration=1800)
    take.finish()


def scene_tabs():
    take = Take('demo-tabs', 'pane-grid: one pane tab per layout', [THREE_MODS])
    take.start_claude()
    take.focus_grid()
    take.say('1. b breaks the active cell out into a new layout tab')
    take.press('b', 'b', pause=1.5, duration=2000)
    take.say('2. c opens an empty layout tab')
    take.press('c', 'c', pause=1.5, duration=1400)
    take.say('3. Placing a mod there moves it out of the other tab')
    # c 로 연 탭은 숨은 탭으로 열린다(2.1.319). 탭 표시줄의 이름을 클릭해 보이게 하고, 그 grid pane 을 클릭해 포커스를 준다.
    take.click(r'\bw3\b', label='click tab w3', duration=900)
    take.focus_grid()
    take.press('1', '1', duration=2000)
    take.focus_prompt()
    take.say('4. /grid list shows every tab and cell')
    take.grid('list', 2600)
    take.say('5. /grid select shows a tab; the layout is saved to ~/.claude/pane-grid/layout.json')
    take.grid('select main', 2400)
    take.finish()


def scene_return():
    take = Take('demo-return', 'pane-grid: a mod returns to its own pane', [THREE_MODS])
    take.start_claude()
    take.say('1. While placed, uhd-kanban does not open its own pane')
    take.hold(1800, (r'c2 uhd-kanban', None))
    take.say('2. Emptying the cell gives the board its own pane back')
    take.grid('place - c2', 2600)
    take.say('3. Placing it again closes that pane')
    take.grid('place uhd-kanban c2', 2400)
    take.finish()


SCENES = {
    'overview': scene_overview,
    'split': scene_split,
    'arrange': scene_arrange,
    'tabs': scene_tabs,
    'return': scene_return,
}


def main():
    prepare_home()
    names = sys.argv[1:] or list(SCENES)
    for name in names:
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                SCENES[name]()
                break
            except TimeoutError as error:
                print(f'FAILED {name} (attempt {attempt}): {error}')


if __name__ == '__main__':
    main()
