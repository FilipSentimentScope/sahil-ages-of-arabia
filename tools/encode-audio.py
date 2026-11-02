"""Level and encode game audio as MP3 (plays on every browser, including iPhones) (Creative tool).

Usage: python3 tools/encode-audio.py IN OUT.mp3 [--lufs -16] [--kbps 160]

Two-pass loudness normalisation (EBU R128 via ffmpeg loudnorm), true peak under -1 dBTP.
Music beds sit at -18 LUFS, under the voice; voice at -16 LUFS (docs/AUDIO_DIRECTION.md).
"""
import argparse
import json
import subprocess


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--lufs", type=float, default=-16)
    ap.add_argument("--kbps", type=int, default=160)
    a = ap.parse_args()
    target = f"I={a.lufs}:TP=-1:LRA=11"
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", a.src, "-af", f"loudnorm={target}:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True, check=True,
    ).stderr
    m = json.loads(probe[probe.rindex("{"): probe.rindex("}") + 1])
    measured = (
        f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
        f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
    )
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", a.src,
         "-af", f"loudnorm={target}:{measured},aresample=44100", "-c:a", "libmp3lame", "-b:a", f"{a.kbps}k", a.out],
        check=True,
    )
    print(a.out)


if __name__ == "__main__":
    main()
