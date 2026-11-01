# Gate 1 review, round 1 (1 Nov 2026)

Reviewer: Creative agent (with Director). Files from Filip, filed in `assets/art/incoming/` and
`assets/audio/incoming/` (originals untouched); game-ready audio in `assets/audio/processed/`.
In-game size check: [gate1-in-game-size.png](gate1-in-game-size.png).

**Limits of this review.** Images were viewed at full size and at phone size. Audio was measured
(length, loudness, peaks, silences, pacing); we cannot listen to it, so anything that depends on
how it sounds needs Filip's ears.

## Verdict summary

| ID | File | Verdict | Why |
| --- | --- | --- | --- |
| ART-001 | sf_town_keyart_v01.png | **Approve as style reference** | Painterly, warm, clearly the Gulf coast; arish houses, one coral-stone house with a single wind tower, well, palms, nets, boats on the sand, headland. Notes below. |
| ART-001b | sf_town_board_v01.png | **Redo** | The look is right, but the image has its own painted grid (6 by 12, not 6 by 6) that clashes with the game's grid, and half the image is sea. The board needs a square, grid-free painting matching our map. |
| ART-002 | sf_leader_ibn-majid_v01.png / v02.jpg | **Redo the kamal, keep the style** | Dignified and readable at 64 pt (both). v1 has the stronger brushwork; v2 the better 4:5 framing. In both, the kamal is drawn as a large wooden board; a kamal is a small plate on a knotted cord (research pack S8). v2 also hangs the lantern from the kamal's cord, which makes no sense. |
| ART-003 | sf_ui_ornaments_v01.png / v02.png | **Choose v2 look, redo with straight edges** | v2 (sadu diamonds plus gypsum-lattice corners, painted) fits the Art Bible best and reads well at phone width. Its torn paper edges cannot stretch to different panel sizes; v1's clean edges can. |
| MUS-01 | mus_main-theme_sketch_v01 | Accept as temp; listen | 2:04. Builds to its loudest at 1:40 to 1:50, matching the brief's late climax. Mastered hot (-11.3 LUFS, peak +0.7 dBFS, i.e. clipping risk); fixed in the game copy. |
| MUS-03 | mus_great-dive_loop_v01 | Accept; we cut the loop | 2:01, steady level throughout (good for a loop) but it fades out at the end; we will cut a seamless loop section. |
| MUS-04 | mus_homecoming_v01 | Accept | 1:03, consistently loud (LRA 3.9), fits a celebration. |
| MUS-05 | mus_collapse-preview_v01 | **Check by ear** | Brief asked for sparse and sorrowful. Measured level from 0:10 to 0:40 is as loud as the homecoming track (-9 to -12 LUFS short-term), which suggests a full arrangement rather than solo cello and voice. If it sounds full, regenerate. |
| VO-01-01..12 | vo_rawi_01-NN_v01 | Accept; two checks by ear | All 12 present, lengths match the word counts (1.3 to 2.5 words per second, unhurried). Recorded very quietly (about -35 LUFS); line 02 is 8 dB louder than the rest, so it may sound like a different take. Lines 04 and 08 end with speech still fairly loud in the last 80 ms; check the final word is not clipped. |

## Notes on ART-001 (for later rounds, not blocking)
- Several arish roofs read as straw thatch; real arish used palm-frond panels and mats. Ask for "woven
  palm-frond panel walls and frond-mat roofs, no straw thatch".
- Some huts have white plastered walls; most arish were frond throughout.
- Boat types stay generic until a historian confirms them.

## Technical notes
- Image resolution 768 x 1376 (and 928 x 1152): fine for review; production art needs at least
  2x. Which tool made them? We need it for the licence log (Midjourney's native output is usually larger).
- ART-002 v2 is JPEG; please export PNG next time.
- Voice files are 32 kHz mono WAV: fine for dialogue.
- Game copies: music two-pass normalised to -16 LUFS, peaks under -1.5 dBTP; voice to -19 LUFS,
  peaks under -2 dBTP, 0.3 s of silence added at the end. OGG Vorbis.

## Round 2 requests
1. ART-001b board redo (prompt in the prompt doc, section "Round 2").
2. ART-002 portrait with a correct kamal, 4:5, v1 style (Round 2 prompt).
3. ART-003 v2 look with straight, clean edges (Round 2 prompt).
4. MUS-05 regenerate if it sounds full; MUS-02 town bed (Filip sends tomorrow).
5. Re-generate VO-01-02 only if it sounds unlike the others after normalisation.

## Gate 1 decision needed from Filip
Approve the **style direction** now (ART-001, the painterly portrait look, ART-003 v2 look), so the
Scenario style model can be trained as soon as the three round 2 frames come back.
