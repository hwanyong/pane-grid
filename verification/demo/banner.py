"""README 맨 위의 배너 · GitHub social preview · plugin 아이콘을 그린다.

사용법: <venv>/bin/python verification/demo/banner.py
record.py 가 남긴 docs/images/grid-three-mods.png 를 화면 사진으로 쓴다. 먼저 record.py overview 를 실행한다.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

import render

REPO = Path(__file__).resolve().parents[2]
IMAGES = REPO / 'docs' / 'images'
SCREEN = IMAGES / 'grid-three-mods.png'

TITLE = 'Join the Pane Grid ecosystem'
SUBTITLE = 'Make your Claude Code mod draw in a grid cell.'
COMMAND = '/pane-grid:add-pane-grid-cell'
GRID_LINE = (70, 74, 84)
CELL_FILL = (34, 37, 44)
MUTED = (160, 160, 160)


def font(size, is_bold=False):
    return ImageFont.truetype(render.MENLO, size, index=1 if is_bold else 0)


def paste_screen(image, box):
    """화면 사진을 box(왼쪽, 위, 너비, 높이) 에 맞춰 위쪽부터 잘라 붙인다. 오른쪽 grid pane 이 보이도록 오른쪽에 맞춘다."""
    left, top, width, height = box
    screen = Image.open(SCREEN).convert('RGB')
    scale = height / screen.height * 1.25
    resized = screen.resize((round(screen.width * scale), round(screen.height * scale)), Image.Resampling.LANCZOS)
    crop_left = max(resized.width - width, 0)
    image.paste(resized.crop((crop_left, 0, crop_left + width, height)), (left, top))
    ImageDraw.Draw(image).rounded_rectangle((left - 2, top - 2, left + width + 1, top + height + 1), radius=10, outline=render.ACCENT, width=3)


def draw_command(draw, left, top, scale):
    text_font = font(round(28 * scale), True)
    width = draw.textlength(COMMAND, font=text_font)
    pad = round(20 * scale)
    height = round(60 * scale)
    draw.rounded_rectangle((left, top, left + width + 2 * pad, top + height), radius=round(12 * scale), fill=render.ACCENT)
    draw.text((left + pad, top + height / 2), COMMAND, font=text_font, fill=(20, 20, 20), anchor='lm')


def banner(size, screen_box, text_left, text_top, scale):
    """글은 왼쪽, 화면 사진은 screen_box 에 둔다. scale 은 1600px 배너의 글자 크기에 곱하는 값이다."""
    image = Image.new('RGB', size, render.CAPTION_BACKGROUND)
    draw = ImageDraw.Draw(image)
    lines = (
        ('pane-grid', font(round(30 * scale), True), render.ACCENT, 50),
        (TITLE, font(round(44 * scale), True), render.CAPTION_TEXT, 74),
        (SUBTITLE, font(round(26 * scale)), MUTED, 60),
    )
    top = text_top
    for text, text_font, fill, step in lines:
        draw.text((text_left, top), text, font=text_font, fill=fill)
        top += round(step * scale)
    draw_command(draw, text_left, top + round(10 * scale), scale)
    draw.text((text_left, top + round(95 * scale)), 'A Claude Code mod: tmux-style grid for Claude Code panes', font=font(round(20 * scale)), fill=MUTED)
    paste_screen(image, screen_box)
    return image


def icon():
    """512px 정사각형. 테두리 둥근 칸 세 개(왼쪽 하나, 오른쪽 위아래 둘)."""
    image = Image.new('RGB', (512, 512), render.CAPTION_BACKGROUND)
    draw = ImageDraw.Draw(image)
    cells = ((56, 56, 236, 456), (276, 56, 456, 236), (276, 276, 456, 456))
    for index, box in enumerate(cells):
        draw.rounded_rectangle(box, radius=28, fill=CELL_FILL, outline=render.ACCENT if index == 0 else GRID_LINE, width=12)
    return image


def main():
    banner((1600, 520), (900, 50, 650, 420), 70, 70, 1.0).save(IMAGES / 'banner.png', optimize=True)
    banner((1280, 640), (700, 60, 540, 520), 50, 170, 0.74).save(IMAGES / 'social-preview.png', optimize=True)
    icon().save(REPO / '.claude-plugin' / 'icon.png', optimize=True)
    for path in (IMAGES / 'banner.png', IMAGES / 'social-preview.png', REPO / '.claude-plugin' / 'icon.png'):
        print(path.relative_to(REPO), Image.open(path).size, path.stat().st_size)


if __name__ == '__main__':
    main()
