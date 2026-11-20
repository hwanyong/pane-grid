"""k38 검증 장치: `hovers:` 를 선언한 칸이 비활성일 때 activate Client 가 제목 1행만 덮는지 실제 세션으로 확인한다.

사용: python3 -I k38harness.py <명령> [인자]
  start <A|B> [nohovers]   A: flow-probe → pane-grid, B: pane-grid → flow-probe. nohovers: `hovers:` 를 그리지 않는 사본을 싣는다(깨 보기)
  shot <이름>               화면을 $OUT/<이름>.txt 로 남기고 출력한다
  move <x> <y>             SGR motion(버튼 없음) ESC[<35;x;yM
  click <x> <y>            왼쪽 버튼 누름 · 뗌
  wheel <x> <y> <up|down> [n]
  drag <x1> <y1> <x2> <y2> [steps]   누른 채 움직여(ESC[<32;x;yM) 놓는다
  key <tmux 키>...
  cmd <slash 명령>
  layout                    배치 파일의 칸 · 활성 · 크기를 출력한다
  grep <패턴>               debug log 에서 찾는다
  stop                      세션을 끝내고 debug log 를 $OUT 으로 옮긴다
  cleanup                   배치 디렉터리를 지운다
"""
import hashlib, json, os, re, shutil, subprocess, sys, time

K = os.path.dirname(os.path.abspath(__file__))
HOME = os.path.expanduser('~')
# 신뢰 확인을 이미 받았고 배치 파일이 없는 디렉터리(pane-grid-matcher 장치의 시험 디렉터리). k37 장치와 같다.
PROJ = f'{HOME}/.claude/scratch/pane-grid-matcher/vproj'
GRID = f'{HOME}/LOCAL/01-01_Projects/plugin-pane-grid/.claude/worktrees/k38-hovers'
PROBE = f'{K}/flow-probe'
PROBE_NOHOVERS = f'{K}/flow-probe-nohovers'
OUT = f'{K}/out'
STATE = f'{K}/out/state.json'
TMUX = 'pgk38'
W, H = 260, 40
# 설치된 다른 mod 를 끈다(k37 장치와 같은 목록). 선택지 · 칸에 섞이지 않게 한다.
OFF = ['uhd-kanban@skill-kanban', 'inbox@inbox', 'flightdeck@claude-flightdeck', 'md-preview@claude-code-mods',
       'terminal-browser@terminal-browser', 'vmq-view@vmq', 'image-view@claude-image-view', 'token-optimizer@alexgreensh-token-optimizer',
       'usage-gauge@usage-gauge']


def layout_dir():
    project = os.path.realpath(PROJ)
    digest = hashlib.sha256(project.encode()).hexdigest()[:16]
    base = re.sub(r'[^A-Za-z0-9._-]+', '-', project.split('/')[-1])
    return f'{HOME}/.claude/pane-grid/projects/{base}-{digest}'


def write_layout():
    root = {'kind': 'row', 'children': [
        {'node': {'kind': 'cell', 'id': 'c1', 'plugin': 'flow-probe'}, 'size': 40},
        {'node': {'kind': 'cell', 'id': 'c2', 'plugin': 'flow-probe.scroll'}, 'size': 30},
        {'node': {'kind': 'cell', 'id': 'c3'}, 'size': 30}]}
    d = layout_dir()
    shutil.rmtree(d, ignore_errors=True)
    os.makedirs(d)
    with open(f'{d}/layout.json', 'w') as f:
        json.dump({'version': 1, 'project': os.path.realpath(PROJ), 'tabs': [{'name': 'main', 'root': root, 'active': 'c3'}]}, f, indent=2)


def make_nohovers():
    shutil.rmtree(PROBE_NOHOVERS, ignore_errors=True)
    shutil.copytree(PROBE, PROBE_NOHOVERS)
    path = f'{PROBE_NOHOVERS}/hooks/register.tsx'
    text = open(path).read()
    assert text.count('const DECLARES_HOVERS = true') == 1
    open(path, 'w').write(text.replace('const DECLARES_HOVERS = true', 'const DECLARES_HOVERS = false'))


def tmux(*args):
    return subprocess.run(['tmux', *args], capture_output=True, text=True).stdout


def screen():
    return tmux('capture-pane', '-p', '-t', TMUX)


def send_hex(text):
    tmux('send-keys', '-t', TMUX, '-H', *[f'{b:02x}' for b in text.encode()])


def state():
    return json.load(open(STATE)) if os.path.exists(STATE) else {}


def start(order, variant=''):
    os.makedirs(OUT, exist_ok=True)
    tmux('kill-session', '-t', TMUX)
    write_layout()
    probe = PROBE
    if variant == 'nohovers':
        make_nohovers()
        probe = PROBE_NOHOVERS
    dirs = [probe, GRID] if order == 'A' else [GRID, probe]
    name = f'{order}{"-" + variant if variant else ""}'
    log = f'{OUT}/{name}-debug.log'
    if os.path.exists(log):
        os.remove(log)
    settings = json.dumps({'enabledPlugins': {item: False for item in OFF}})
    cmd = ['claude', *[arg for d in dirs for arg in ('--plugin-dir', d)], '--settings', f"'{settings}'", '--debug-file', log]
    tmux('new-session', '-d', '-s', TMUX, '-x', str(W), '-y', str(H), '-c', PROJ, ' '.join(cmd))
    json.dump({'name': name, 'log': log, 'cmd': ' '.join(cmd)}, open(STATE, 'w'))
    for _ in range(40):
        text = screen()
        if 'Yes, I trust this folder' in text:
            tmux('send-keys', '-t', TMUX, 'Down')
            time.sleep(0.5)
            tmux('send-keys', '-t', TMUX, 'Enter')
            time.sleep(3)
            continue
        if re.search(r'^❯', text, re.M) and 'No, exit' not in text:
            break
        time.sleep(1)
    time.sleep(6)
    command('/grid select main')
    print(' '.join(cmd))


def command(text):
    tmux('send-keys', '-t', TMUX, '-l', text)
    time.sleep(0.5)
    tmux('send-keys', '-t', TMUX, 'Enter')
    time.sleep(5)


def shot(label):
    text = screen()
    open(f'{OUT}/{state()["name"]}-{label}.txt', 'w').write(text)
    print(text)


def read_layout():
    data = json.load(open(f'{layout_dir()}/layout.json'))
    tab = data['tabs'][0]

    def walk(node, out):
        if node['kind'] == 'cell':
            out.append((node['id'], node.get('plugin')))
        else:
            sizes = [child['size'] for child in node['children']]
            out.append(('sizes', sizes))
            for child in node['children']:
                walk(child['node'], out)
        return out
    return {'active': tab.get('active'), 'zoomed': tab.get('zoomed'), 'cells': walk(tab['root'], [])}


def main():
    verb, *args = sys.argv[1:]
    if verb == 'start':
        return start(*args)
    if verb == 'shot':
        return shot(args[0])
    if verb == 'move':
        x, y = args
        return send_hex(f'\x1b[<35;{x};{y}M') or time.sleep(1.5)
    if verb == 'click':
        x, y = args
        send_hex(f'\x1b[<0;{x};{y}M')
        time.sleep(0.2)
        send_hex(f'\x1b[<0;{x};{y}m')
        return time.sleep(2)
    if verb == 'wheel':
        x, y, way, *n = args
        for _ in range(int(n[0]) if n else 1):
            send_hex(f'\x1b[<{64 if way == "up" else 65};{x};{y}M')
            time.sleep(0.3)
        return time.sleep(1.5)
    if verb == 'drag':
        x1, y1, x2, y2, *steps = [int(a) for a in args]
        count = steps[0] if steps else 6
        send_hex(f'\x1b[<0;{x1};{y1}M')
        time.sleep(0.3)
        for step in range(1, count + 1):
            x = round(x1 + (x2 - x1) * step / count)
            y = round(y1 + (y2 - y1) * step / count)
            send_hex(f'\x1b[<32;{x};{y}M')
            time.sleep(0.3)
        send_hex(f'\x1b[<0;{x2};{y2}m')
        return time.sleep(2)
    if verb == 'key':
        tmux('send-keys', '-t', TMUX, *args)
        return time.sleep(2)
    if verb == 'cmd':
        return command(' '.join(args))
    if verb == 'layout':
        return print(json.dumps(read_layout()))
    if verb == 'grep':
        for line in open(state()['log'], errors='replace'):
            if re.search(args[0], line):
                print(line.rstrip()[:300])
        return None
    if verb == 'stop':
        return tmux('kill-session', '-t', TMUX)
    if verb == 'cleanup':
        tmux('kill-session', '-t', TMUX)
        shutil.rmtree(layout_dir(), ignore_errors=True)
        return print('removed', layout_dir())
    raise SystemExit(__doc__)


main()
