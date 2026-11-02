# Audio direction (draft v0.1)

Status: **draft v0.1**, 1 Nov 2026. Prompts that apply it:
[assets/prompts/ELEVENLABS_PROMPTS.md](../assets/prompts/ELEVENLABS_PROMPTS.md).

## 1. The sound in one sentence

The voice of the boat comes first: a lead singer, a chorus answering, hand claps and drums, a clay
pot struck like a drum. Behind it, a cinematic orchestra opens out the feeling, the way a film score
would, without drowning the human sound.

## 2. Grounding (research pack, docs/research/AGE_V_RESEARCH_PACK.md)

- Pearling music centred on a lead singer (*nahham*), a chorus, clapping and percussion: drums, small
  finger cymbals and a clay pot (*jahl*) used as a drum. Songs often start slowly, build to a fast peak
  and settle. Rhythms carry Bedouin, East African, Persian and Indian influences (sources S5, S6).
- So on the boat: voice and percussion only. Strings, brass and melodic instruments belong to the
  score layer, not to the scene.
- We do not imitate or sample real fijiri recordings or living performers. The score is "inspired by"
  the structure (call and response, slow build, clapped polyrhythm), not a copy.

## 3. Instrument palette

| Layer | Instruments |
| --- | --- |
| Scene (diegetic) | Male lead voice, male chorus (wordless or vocables), hand claps, double-headed drums, frame drum, clay pot percussion, small finger cymbals, creaking wood, rope, sea |
| Score | Low strings, cello solo, warm French horns, soft timpani, a reed or ney-like breathy flute used sparingly, harp for pearl and reward moments |
| Interface | Wood taps, soft brass chimes, a pearl "ting" (glass-like, short), paper and cloth |

## 4. Rules

- **No lyrics in AI-generated music.** Use wordless vocals and vocables only. AI-written Arabic lyrics
  risk errors and unintended religious or political content. Any sung words later come from a human
  writer and performer.
- **The main theme is human-composed** (ownership; AI-only music is unlikely to be protected by
  copyright). Eleven Music output is temp and bed material and a brief for the composer.
- **Suno never ships.** Reference sketches only.
- Loudness: interface sounds quieter than music; nothing harsh at high frequencies on phone speakers.
  Target integrated loudness around -16 LUFS for music beds, peaks under -1 dBTP (to verify in the mix).
- Files: OGG (Vorbis) for the web build, plus WAV masters kept in the repository's asset store.
- Loops: cut from the steady middle of a generated track with `python3 tools/make-loop.py IN OUT.wav --bars-min 24`,
  then two-pass loudnorm to -16 LUFS. Check the seam by ear before integrating.
- Ramadan and other regional calendar moments: tone and pacing to be developed with the advisory board
  (GDD section 19); nothing in the slice depends on it.

## 5. Slice audio list

| ID | Item | Source |
| --- | --- | --- |
| MUS-01 | Main theme sketch (temp, brief for composer) | Google Gemini (Lyria); final score by a human composer |
| MUS-02 | Town bed (loop) | Google Gemini (Lyria); final score by a human composer |
| MUS-03 | The great dive (tension, loop) | Google Gemini (Lyria); final score by a human composer |
| MUS-04 | Homecoming (celebration) | Google Gemini (Lyria); final score by a human composer |
| MUS-05 | Collapse preview (sorrowful, short) | Google Gemini (Lyria); final score by a human composer |
| AMB-01..03 | Shore town day, on the pearl banks, souq | ElevenLabs Sound Effects (loop) |
| SFX-01..30 | Interface, building, sea, fight, reward | ElevenLabs Sound Effects |
| VO-01 | Rawi voice (designed) and first-session lines in English | ElevenLabs Voice Design + TTS |

## 6. Theme brief for the composer (one page, for later)

A proud, warm, slightly melancholy theme that can be sung by one voice on a boat and also carried
by an orchestra. Four bars that a crew could clap to. A falling phrase that returns at the collapse.
A rising answer that returns at every age change. Tempo around 84 to 96 bpm. It must work as a
ten-second stinger, a two-minute main title and a quiet loop.
