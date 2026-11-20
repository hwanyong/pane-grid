"""k37 검증 장치: 칸 주인 키를 member id 로 넓힌 pane-grid 를 실제 세션으로 확인한다.

사용: python3 -I k37harness.py run <scenario> | cleanup
scenario: A · B · A-nooffer · B-nooffer
  A: member(usage-gauge 0.4.1 설치본 · flow-probe) → pane-grid. B: pane-grid → member.
  -nooffer: flow-probe 대신 `offer:` Box 를 그리지 않는 사본 flow-probe-nooffer 를 싣는다(깨 보기).
결과: $K/out/<scenario>/ 에 화면 캡처 · debug log · result.json
"""
import hashlib, json, os, re, shutil, subprocess, sys, time

K = os.path.dirname(os.path.abspath(__file__))
HOME = os.path.expanduser('~')
# 신뢰 확인을 이미 받았고 배치 파일이 없는 디렉터리(pane-grid-matcher 장치의 시험 디렉터리)
PROJ = f'{HOME}/.claude/scratch/pane-grid-matcher/vproj'
GRID = f'{HOME}/LOCAL/01-01_Projects/plugin-pane-grid/.claude/worktrees/k37-member-id'
OLD_MEMBER = f'{HOME}/.claude/plugins/cache/usage-gauge/usage-gauge/0.4.1'
TMUX = 'pgk37'
W, H = 260, 70
# 설치된 다른 mod 를 끈다. 선택지에 섞이지 않게 한다. usage-gauge 는 --plugin-dir 로 싣는다.
OFF = ['uhd-kanban@skill-kanban', 'inbox@inbox', 'flightdeck@claude-flightdeck', 'md-preview@claude-code-mods',
       'terminal-browser@terminal-browser', 'vmq-view@vmq', 'image-view@claude-image-view', 'token-optimizer@alexgreensh-token-optimizer']
MEMBER_IDS = ('usage-gauge', 'flow-probe', 'flow-probe.b')
HINTS = ('is not loaded', 'draws nothing here')


def real_proj():
    return os.path.realpath(PROJ)


def layout_dir():
    project = real_proj()
    digest = hashlib.sha256(project.encode()).hexdigest()[:16]
    base = re.sub(r'[^A-Za-z0-9._-]+', '-', project.split('/')[-1])
    return f'{HOME}/.claude/pane-grid/projects/{base}-{digest}'


def write_layout():
    # 기존 배치 파일 꼴: 칸의 plugin 필드에 plugin 이름(usage-gauge)을 적은 파일
    root = {'kind': 'row', 'children': [
        {'node': {'kind': 'cell', 'id': 'c1', 'plugin': 'usage-gauge'}, 'size': 34},
        {'node': {'kind': 'cell', 'id': 'c2'}, 'size': 33},
        {'node': {'kind': 'cell', 'id': 'c3'}, 'size': 33}]}
    d = layout_dir()
    shutil.rmtree(d, ignore_errors=True)
    os.makedirs(d)
    with open(f'{d}/layout.json', 'w') as f:
        json.dump({'version': 1, 'project': real_proj(), 'tabs': [{'name': 'main', 'root': root, 'active': 'c2'}]}, f, indent=2)


def read_cells():
    def walk(node, out):
        if node['kind'] == 'cell':
            out[node['id']] = node.get('plugin')
        else:
            for child in node['children']:
                walk(child['node'], out)
        return out
    with open(f'{layout_dir()}/layout.json') as f:
        return walk(json.load(f)['tabs'][0]['root'], {})


def tmux(*args):
    return subprocess.run(['tmux', *args], capture_output=True, text=True).stdout


def screen():
    return tmux('capture-pane', '-p', '-t', TMUX)


def locate(pattern, text=None):
    for row, line in enumerate((text or screen()).splitlines()):
        m = re.search(pattern, line)
        if m:
            return m.start() + 1, row + 1
    return None


def click(column, row):
    tmux('send-keys', '-t', TMUX, '-l', f'\x1b[<0;{column};{row}M')
    time.sleep(0.3)
    tmux('send-keys', '-t', TMUX, '-l', f'\x1b[<0;{column};{row}m')
    time.sleep(1.0)


def input_row(text=None):
    rows = [i for i, l in enumerate((text or screen()).splitlines()) if l.startswith('❯')]
    return rows[-1] + 1 if rows else None


def clear_prompt():
    row = input_row()
    if row:
        click(4, row)
    for _ in range(12):
        tmux('send-keys', '-t', TMUX, 'BSpace')
    time.sleep(0.5)


def command(text, pause=5):
    clear_prompt()
    tmux('send-keys', '-t', TMUX, '-l', text)
    time.sleep(0.5)
    tmux('send-keys', '-t', TMUX, 'Enter')
    time.sleep(pause)


def choices_in(text):
    # 빈 칸 선택지: `empty. place a mod here:` 아래 줄들. 활성 칸이면 줄 앞에 hotkey 숫자가 붙는다.
    lines = text.splitlines()
    start = next((i for i, l in enumerate(lines) if 'empty. place a mod here' in l), None)
    if start is None:
        return None
    col = lines[start].index('empty. place a mod here')
    out = []
    for line in lines[start + 1:start + 12]:
        seg = line[max(col - 4, 0):col + 60]
        if 'no grid-ready mod is loaded' in seg:
            out.append({'id': '<none>'})
            break
        m = re.search(r'(?:(\d)\W{1,3})?\b([a-z0-9][a-z0-9_.-]*[a-z0-9])(?: \(move from (c\d+)\))?', seg)
        if not m or m.group(2) not in MEMBER_IDS:
            break
        out.append({'id': m.group(2), 'hotkey': m.group(1), 'from': m.group(3)})
    return out


def bodies_in(text):
    return {name: bool(re.search(name, text)) for name in ('PROBE-A body', 'PROBE-B body', 'usage-gauge is not loaded', 'draws nothing here')}


def press_choice(text, member_id):
    found = next((c for c in (choices_in(text) or []) if c['id'] == member_id and c['hotkey']), None)
    if not found:
        return None
    at = locate(r'q: list', text)
    click(W - 2, at[1])
    tmux('send-keys', '-t', TMUX, found['hotkey'])
    time.sleep(5)
    return found['hotkey']


def snap(out, result, name):
    s = screen()
    open(f'{out}/{name}.txt', 'w').write(s)
    result[name] = {'choices': choices_in(s), 'bodies': bodies_in(s), 'cells': read_cells()}
    return s


def plugin_dirs(scenario):
    probe = f'{K}/plugins/flow-probe-nooffer' if scenario.endswith('-nooffer') else f'{K}/plugins/flow-probe'
    members = [OLD_MEMBER, probe]
    dirs = [*members, GRID] if scenario.startswith('A') else [GRID, *members]
    return [arg for d in dirs for arg in ('--plugin-dir', d)]


def run(scenario):
    out = f'{K}/out/{scenario}'
    shutil.rmtree(out, ignore_errors=True)
    os.makedirs(out)
    write_layout()
    log = f'{out}/debug.log'
    tmux('kill-session', '-t', TMUX)
    settings = json.dumps({'enabledPlugins': {name: False for name in OFF}})
    cmd = ['claude', *plugin_dirs(scenario), '--settings', f"'{settings}'", '--debug-file', log]
    tmux('new-session', '-d', '-s', TMUX, '-x', str(W), '-y', str(H), '-c', PROJ, ' '.join(cmd))
    result = {'scenario': scenario, 'cmd': ' '.join(cmd)}
    for _ in range(30):
        if input_row():
            break
        time.sleep(1)
    time.sleep(8)
    command('/grid select main', 6)
    s1 = snap(out, result, '1-start')
    # 활성 빈 칸 c2 에서 flow-probe.b 의 선택지 Button 을 hotkey 로 누른다(`place:c2:flow-probe.b` 를 해석하는 길)
    result['press_b'] = press_choice(s1, 'flow-probe.b')
    if not result['press_b']:
        command('/grid place flow-probe.b c2', 6)
    snap(out, result, '2-place-b')
    command('/grid place flow-probe c3', 6)
    snap(out, result, '3-place-a')
    # usage-gauge 를 c1 에서 빼고, 빈 c1 의 선택지에서 hotkey 로 다시 놓는다(옛 사본이 선택지로 놓이는가)
    command('/grid place - c1', 6)
    command('/grid select-cell c1', 6)
    s4 = snap(out, result, '4-c1-empty')
    result['press_old'] = press_choice(s4, 'usage-gauge')
    snap(out, result, '5-place-old')
    dbg = open(log, errors='replace').read()
    result['pane_grid_log'] = re.findall(r'\$\.ui\.log \(to debug\): (pane-grid: [^\n]{0,200})', dbg)[-10:]
    result['loaded'] = sorted(set(re.findall(r'hooks module (\S+?)@\S+ loaded', dbg)))
    json.dump(result, open(f'{out}/result.json', 'w'), indent=2, ensure_ascii=False)
    print(json.dumps(result, indent=2, ensure_ascii=False))


def cleanup():
    tmux('kill-session', '-t', TMUX)
    shutil.rmtree(layout_dir(), ignore_errors=True)
    print('removed', layout_dir())


if __name__ == '__main__':
    try:
        cleanup() if sys.argv[1] == 'cleanup' else run(sys.argv[2])
    finally:
        tmux('kill-session', '-t', TMUX)
