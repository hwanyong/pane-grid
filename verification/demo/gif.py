"""record.py 가 남긴 녹화(docs/images/demo-*.png, APNG)를 같은 프레임 · 같은 시간 · 같은 색의 GIF 로 옮긴다.

사용법: <venv>/bin/python verification/demo/gif.py <출력 폴더>
APNG 를 재생하지 않는 사이트에 올릴 때 쓴다. GIF 는 저장소에 넣지 않는다(README 는 APNG 를 쓴다).

render.save_apng 는 프레임을 공유 팔레트(render.PALETTE_COLORS 색)로 줄여 저장한다. 여기서는 그 팔레트 프레임을
다시 양자화하지 않고 그대로 GIF 에 쓴다. RGB 로 풀었다가 render.shared_palette 로 다시 줄이면 이미 줄어든 색이 한 번 더
합쳐진다(2026-11-07, demo-tabs 프레임 5 에서 110색이 89색이 되었고 모든 프레임의 픽셀이 달라졌다).
"""
import sys
from pathlib import Path

from PIL import Image, ImageSequence

REPO = Path(__file__).resolve().parents[2]
IMAGES = REPO / 'docs' / 'images'


def apng_frames(path):
    """(팔레트 모드 Image, 밀리초) 목록을 낸다. 모든 프레임에 첫 프레임의 팔레트를 붙인다."""
    with Image.open(path) as image:
        palette = image.getpalette()
        frames = []
        for frame in ImageSequence.Iterator(image):
            if frame.mode != 'P':
                raise ValueError(f'{path.name}: 팔레트 모드가 아닌 프레임({frame.mode})이 있다. render.save_apng 가 저장한 파일이 아니다')
            indexed = frame.copy()
            indexed.putpalette(palette)
            frames.append((indexed, frame.info['duration']))
        return frames


def save_gif(path, frames):
    images = [image for image, _ in frames]
    images[0].save(
        path,
        format='GIF',
        save_all=True,
        append_images=images[1:],
        duration=[duration for _, duration in frames],
        loop=0,
        optimize=False,
    )


def main(target):
    target.mkdir(parents=True, exist_ok=True)
    for path in sorted(IMAGES.glob('demo-*.png')):
        frames = apng_frames(path)
        output = target / f'{path.stem}.gif'
        save_gif(output, frames)
        total = sum(duration for _, duration in frames) / 1000
        print(f'{output.name}: {len(frames)} frames, {total:.2f}s, {output.stat().st_size} bytes')


if __name__ == '__main__':
    main(Path(sys.argv[1]))
