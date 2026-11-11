#!/usr/bin/env python3 -I
# gen.py: R 묶음 SDK steps 를 만든다. python3 -I gen.py 로 이 폴더에 f54.json · f51.json · f47.json 을 쓴다.
import json, os
D = os.path.dirname(os.path.abspath(__file__))

def render(surf, cid, c, r, inst='grid-main', title='main'):
    return {"req": {"subtype": "ui_render", "surface": surf, "client_id": cid, "component": "Pane", "instance_id": inst,
                    "props": {"title": title, "isFocused": False, "bodyColumns": c, "placement": "dock", "scroll": {"offset": 0, "bodyRows": r}, "view": {}}}}

def measure(c, r, inst='grid-main', tab='main'):
    return {"req": {"subtype": "ui_message", "plugin": "pane-grid", "component": "Pane", "instance_id": inst, "client": f"measure:{tab}",
                    "module": "hooks/measure.tsx", "data": {"columns": c, "rows": r}}}

START = [{"req": {"subtype": "initialize"}}, {"sleep": 3}]

# F54: 크기가 다른 두 surface(desktop 100x40 · mobile 50x30)가 같은 grid 탭을 번갈아 그린다.
s = START + [
    {"req": {"subtype": "ui_attach", "surface": "desktop", "client_id": "d1", "viewport": {"columns": 100, "rows": 40}}},
    {"req": {"subtype": "ui_attach", "surface": "mobile", "client_id": "m1", "viewport": {"columns": 50, "rows": 30}}}]
for k in range(3):
    s += [{"mark": f"round {k+1}: desktop 100x40 render + measure"}, render("desktop", "d1", 100, 40), measure(100, 40), {"sleep": 1.5},
          {"mark": f"round {k+1}: mobile 50x30 render"}, render("mobile", "m1", 50, 30), {"sleep": 1.5}]
s += [{"mark": "wheel from mobile at col30 row8 (last render: mobile)"},
      {"req": {"subtype": "ui_scroll", "surface": "mobile", "component": "Pane", "instance_id": "grid-main", "offset": 0, "body_rows": 30,
               "content_rows": 30, "by": 1, "pointer": {"column": 30, "row": 8}}},
      {"sleep": 1},
      {"mark": "render mobile then desktop to read scroll rows"}, render("mobile", "m1", 50, 30), render("desktop", "d1", 100, 40), measure(100, 40), {"sleep": 1},
      {"mark": "mobile render, then divider drag from desktop to at=70 (isFinal)"}, render("mobile", "m1", 50, 30), {"sleep": 1},
      {"req": {"subtype": "ui_message", "plugin": "pane-grid", "component": "Pane", "instance_id": "grid-main", "client": "divider:r:0",
               "module": "hooks/divider.tsx", "data": {"at": 70, "isFinal": True}}},
      {"sleep": 1.5},
      {"mark": "render desktop after drag"}, render("desktop", "d1", 100, 40), {"sleep": 1}]
json.dump(s, open(f'{D}/f54.json', 'w'), indent=0)

# F51: 탭 t2(c2|c3) 를 desktop 에 그린 뒤 밖에서 프로젝트 파일의 t2 를 t3 으로 바꾸고, t2 의 활성이 아닌 칸 c3 의 activate 를 보낸다.
RENAME = ("python3 -I -c 'import json,glob,os; p=glob.glob(os.environ[\"H\"]+\"/.claude/pane-grid/projects/*/layout.json\")[0]; "
          "d=json.load(open(p)); d[\"tabs\"][1][\"name\"]=\"t3\"; open(p,\"w\").write(json.dumps(d))'")
panes = {"req": {"subtype": "ui_panes"}}
s = START + [
    {"req": {"subtype": "ui_attach", "surface": "desktop", "client_id": "d1", "viewport": {"columns": 100, "rows": 40}}},
    {"mark": "panes at start"}, panes,
    {"mark": "render grid-t2 on desktop + measure"}, render("desktop", "d1", 100, 40, 'grid-t2', 't2'), measure(100, 40, 'grid-t2', 't2'), {"sleep": 1.5},
    {"mark": "another session renames t2 to t3 in the project file"}, {"shell": RENAME}, {"sleep": 1.5},
    {"mark": "activate c3 in grid-t2"},
    {"req": {"subtype": "ui_message", "plugin": "pane-grid", "component": "Pane", "instance_id": "grid-t2", "client": "activate:c3",
             "module": "hooks/activate.tsx", "data": {"activate": True}}},
    {"sleep": 0.5},
    {"mark": "panes right after"}, panes,
    {"sleep": 3},
    {"mark": "panes 3 s later"}, panes]
json.dump(s, open(f'{D}/f51.json', 'w'), indent=0)

# F47: /clear 로 layout state 를 비운 뒤 render(뒤 콜백 ensureLayout) · watchShown(1초 주기) · hotkey 누름(runAction)이
# 겹쳐 ensureLayout 을 부르게 한다. 사본의 loadFile 에 3초 지연(patch.py delay47)을 넣어 진행 중인 load 를 길게 둔다.
s = START + [
    {"sleep": 4},
    {"req": {"subtype": "ui_attach", "surface": "desktop", "client_id": "d1", "viewport": {"columns": 100, "rows": 40}}},
    {"mark": "before /clear"}, panes,
    {"mark": "/clear"}, {"user": "/clear", "wait": 60},
    {"mark": "render grid-main right after /clear"}, render("desktop", "d1", 100, 40),
    {"sleep": 8},
    {"mark": "panes 8 s later"}, panes]
json.dump(s, open(f'{D}/f47.json', 'w'), indent=0)
