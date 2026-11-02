"""Cut a seamless music loop from a track with an intro and a fade-out (Creative agent tool).

Usage: python3 tools/make-loop.py IN_FILE OUT_WAV [--bars-min 16]

How it works:
1. Find the beats (librosa) and the steady middle of the track (skips the quiet intro and the
   fade at the end, judged by loudness).
2. Try every loop that starts and ends on a beat, is a whole number of 4-beat bars long and at
   least --bars-min bars, and score how alike the music sounds just after the start and just
   after the end (chroma + timbre). The best match becomes the loop.
3. Blend the last 60 ms of the loop with the 60 ms just before its start, so playback from the
   end back to the start has no click.

Writes a stereo WAV at the input's sample rate and prints the loop start, end and length.
Needs: pip install librosa soundfile
"""
import argparse

import librosa
import numpy as np
import soundfile as sf

XFADE_S = 0.06
MATCH_BEATS = 8  # compare two bars of music after each candidate point


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--bars-min", type=int, default=16)
    a = ap.parse_args()

    stereo, sr = librosa.load(a.src, sr=None, mono=False)
    if stereo.ndim == 1:
        stereo = np.vstack([stereo, stereo])
    mono = librosa.to_mono(stereo)

    _, beats = librosa.beat.beat_track(y=mono, sr=sr, units="samples")
    hop = 512
    feats = np.vstack([
        librosa.feature.chroma_cqt(y=mono, sr=sr, hop_length=hop),
        librosa.util.normalize(librosa.feature.mfcc(y=mono, sr=sr, hop_length=hop, n_mfcc=13), axis=1),
    ])
    sync = librosa.util.sync(feats, beats // hop, aggregate=np.median)  # one column per beat

    # Steady middle: beats whose loudness is within 6 dB of the track's typical body level.
    rms = librosa.feature.rms(y=mono, frame_length=2048, hop_length=hop)[0]
    level = 20 * np.log10(np.array([rms[min(b // hop, len(rms) - 1)] for b in beats]) + 1e-9)
    body = np.percentile(level, 60)
    steady = np.where(level > body - 6)[0]
    lo, hi = steady[0] + 4, steady[-1] - MATCH_BEATS - 4

    best = None
    for i in range(lo, hi):
        for j in range(i + 4 * a.bars_min, hi + 1, 4):
            d = np.linalg.norm(sync[:, i:i + MATCH_BEATS] - sync[:, j:j + MATCH_BEATS])
            if best is None or d < best[0]:
                best = (d, i, j)
    if best is None:
        raise SystemExit("track too short for a loop of that many bars")
    _, i, j = best
    s, e = int(beats[i]), int(beats[j])
    x = int(XFADE_S * sr)
    loop = stereo[:, s:e].copy()
    ramp = np.linspace(0, 1, x)
    loop[:, -x:] = loop[:, -x:] * (1 - ramp) + stereo[:, s - x:s] * ramp
    sf.write(a.out, loop.T, sr)
    bars = (j - i) // 4
    print(f"loop {s / sr:.2f}s to {e / sr:.2f}s, {(e - s) / sr:.2f}s, {bars} bars, match distance {best[0]:.2f}")


if __name__ == "__main__":
    main()
