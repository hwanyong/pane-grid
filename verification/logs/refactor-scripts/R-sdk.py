#!/usr/bin/env python3 -I
# R-sdk.py: headless claude(stream-json) 에 SDK control request 를 보내는 작은 driver.
# 사용: python3 -I R-sdk.py <REPO> <HOME> <PROJ> <debug log> <steps.json>
#   steps.json: [{"req": {...control request 본문...}} | {"sleep": 초} | {"user": "프롬프트 글"} | {"mark": "이름"}]
#   각 req 의 응답(control_response) 을 stdout 에 한 줄 JSON 으로 낸다: {"i": 차례, "subtype": ..., "resp": ...}
import json, os, subprocess, sys, threading, time, queue

repo, home, proj, dlog, steps_path = sys.argv[1:6]
steps = json.load(open(steps_path))
env = {k: v for k, v in os.environ.items() if k not in ('CLAUDE_CONFIG_DIR', 'CLAUDECODE')}
env.update(HOME=home, DISABLE_AUTOUPDATER='1', LANG='en_US.UTF-8')
cmd = ['claude', '-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose',
       '--setting-sources', 'project', '--strict-mcp-config', '--model', 'haiku',
       '--debug-file', dlog]
# REPO 자리는 쉼표로 나눈 plugin 폴더 목록이다(앞에서부터 --plugin-dir 차례).
for d in repo.split(','):
    cmd += ['--plugin-dir', d]
p = subprocess.Popen(cmd, cwd=proj, env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
responses = {}
others = queue.Queue()
lock = threading.Condition()

def reader():
    for line in p.stdout:
        try:
            msg = json.loads(line)
        except Exception:
            continue
        if msg.get('type') == 'control_response':
            r = msg.get('response', {})
            with lock:
                responses[r.get('request_id')] = r
                lock.notify_all()
        else:
            others.put(msg)

threading.Thread(target=reader, daemon=True).start()
n = 0

def send(obj):
    p.stdin.write(json.dumps(obj) + '\n')
    p.stdin.flush()

def request(body, wait=30):
    global n
    n += 1
    rid = f'r{n}'
    send({'type': 'control_request', 'request_id': rid, 'request': body})
    end = time.time() + wait
    with lock:
        while rid not in responses and time.time() < end:
            lock.wait(0.2)
    return responses.get(rid)

pending = []
for i, step in enumerate(steps):
    if 'sleep' in step:
        time.sleep(step['sleep'])
    elif 'shell' in step:
        # 시나리오 중간에 밖에서 파일을 고치는 일(다른 세션이 쓴 것과 같은 효과). 환경 변수 H 는 격리 HOME.
        subprocess.run(step['shell'], shell=True, env={**os.environ, 'H': home, 'PROJ': proj})
    elif 'mark' in step:
        print(json.dumps({'i': i, 'mark': step['mark']}), flush=True)
    elif 'user' in step:
        send({'type': 'user', 'message': {'role': 'user', 'content': step['user']}})
        # 결과 메시지(type=result)까지 기다린다
        end = time.time() + step.get('wait', 90)
        while time.time() < end:
            try:
                m = others.get(timeout=0.5)
            except queue.Empty:
                continue
            if m.get('type') == 'result':
                print(json.dumps({'i': i, 'user': step['user'], 'result': m.get('result')}, ensure_ascii=False), flush=True)
                break
    elif 'req' in step:
        if step.get('nowait'):
            n += 1
            rid = f'r{n}'
            send({'type': 'control_request', 'request_id': rid, 'request': step['req']})
            pending.append((i, rid, step['req'].get('subtype')))
            continue
        r = request(step['req'], step.get('wait', 30))
        out = {'i': i, 'subtype': step['req'].get('subtype'), 'resp': r}
        print(json.dumps(out, ensure_ascii=False), flush=True)

# nowait 로 보낸 요청의 응답
time.sleep(1)
for i, rid, sub in pending:
    with lock:
        end = time.time() + 30
        while rid not in responses and time.time() < end:
            lock.wait(0.2)
    print(json.dumps({'i': i, 'subtype': sub, 'resp': responses.get(rid)}, ensure_ascii=False), flush=True)
p.stdin.close()
try:
    p.wait(timeout=20)
except subprocess.TimeoutExpired:
    p.kill()
err = p.stderr.read()
if err.strip():
    print(json.dumps({'stderr': err[-2000:]}), flush=True)
