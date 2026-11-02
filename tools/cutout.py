"""Cut building art out of its background for the game (Creative agent tool).

Usage: python3 tools/cutout.py OUT_DIR IN_FILE [IN_FILE ...]

For each input: remove the background (rembg, u2net model), drop faint leftovers such as
shadows and drawn plot lines, trim to the visible building, pad to a square and save a
512 x 512 transparent PNG named after the input (extension .png).
"""
import sys
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

SIZE = 512
PAD = 0.04  # breathing room around the building, as a share of the square


def cut(session, src: Path, out_dir: Path) -> Path:
    im = Image.open(src).convert("RGB")
    rgba = remove(im, session=session, post_process_mask=True)
    alpha = rgba.getchannel("A").point(lambda a: 0 if a < 40 else a)  # drop faint shadow/line remnants
    rgba.putalpha(alpha)
    box = alpha.getbbox()
    if box is None:
        raise SystemExit(f"{src}: nothing left after background removal")
    rgba = rgba.crop(box)
    w, h = rgba.size
    side = int(max(w, h) * (1 + 2 * PAD))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    # Sit the building on the bottom of the square so it stands on its plot.
    canvas.paste(rgba, ((side - w) // 2, side - h - int(side * PAD)), rgba)
    out = out_dir / (src.stem + ".png")
    canvas.resize((SIZE, SIZE), Image.LANCZOS).save(out)
    return out


def main() -> None:
    out_dir = Path(sys.argv[1])
    out_dir.mkdir(parents=True, exist_ok=True)
    session = new_session("u2net")
    for f in sys.argv[2:]:
        print(cut(session, Path(f), out_dir))


if __name__ == "__main__":
    main()
