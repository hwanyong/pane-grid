#!/usr/bin/env python3 -I
# gen.py: Y 묶음 T93 의 SDK steps 를 만든다(python3 -I gen.py 로 이 폴더에 t93.json 을 쓴다).
# 단계마다 debug log 에 `Ymark: <이름>` 줄을 덧붙여(shell step) log 줄이 어느 단계 뒤에 나왔는지 가른다.
import json, os
D = os.path.dirname(os.path.abspath(__file__))

def render(surf, cid, c, r):
    return {"req": {"subtype": "ui_render", "surface": surf, "client_id": cid, "component": "Pane", "instance_id": "grid-main",
                    "props": {"title": "main", "isFocused": False, "bodyColumns": c, "placement": "dock", "scroll": {"offset": 0, "bodyRows": r}, "view": {}}}}

def mark(name):
    return [{"mark": name}, {"shell": f"echo 'Ymark: {name}' >> \"$H/../logs/sdk.log\""}]

s = [{"req": {"subtype": "initialize"}}, {"sleep": 3}] + mark("after initialize") + [
    {"req": {"subtype": "ui_attach", "surface": "mobile", "client_id": "m1", "viewport": {"columns": 60, "rows": 30}}}]
s += mark("A mobile render 60x30") + [render("mobile", "m1", 60, 30), {"sleep": 2.5}]
s += mark("B mobile render 60x30 again") + [render("mobile", "m1", 60, 30), {"sleep": 2.5}]
s += mark("C mobile render 50x24") + [render("mobile", "m1", 50, 24), {"sleep": 2.5}]
s += mark("D control desktop render 80x30 without measure message") + [
    {"req": {"subtype": "ui_attach", "surface": "desktop", "client_id": "d1", "viewport": {"columns": 80, "rows": 30}}},
    render("desktop", "d1", 80, 30), {"sleep": 2.5}]
s += mark("end")
json.dump(s, open(f'{D}/t93.json', 'w'), indent=0)
