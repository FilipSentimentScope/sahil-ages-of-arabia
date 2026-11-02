/**
 * Rawi's voice and the town music.
 *
 * Music (changed 2 Nov evening after Filip heard the loop restart): instead of looping a 68-second
 * cut, the town plays a short playlist of full tracks, each with its own soft opening and ending,
 * with a few seconds of quiet between them, as many games do. With the two tracks we have the cycle
 * is about four minutes; more town tracks (MUS-02b, c, d in the prompt sheet) extend it.
 *
 * Files are MP3 so they play on every browser, iPhones included. Browsers only play sound after
 * the player has touched the page, so nothing starts before the first tap. Voice is English only
 * for now (Arabic narration waits for a native writer, ASSET_INVENTORY VO-01).
 */
import townFull from '../../assets/audio/processed/mus_town-bed_full_v01.mp3';
import mainTheme from '../../assets/audio/processed/mus_main-theme_sketch_v01.mp3';
import vo01 from '../../assets/audio/processed/vo_rawi_01-01_v01.mp3';
import vo02 from '../../assets/audio/processed/vo_rawi_01-02_v01.mp3';
import vo03 from '../../assets/audio/processed/vo_rawi_01-03_v01.mp3';
import vo05 from '../../assets/audio/processed/vo_rawi_01-05_v01.mp3';
import vo06 from '../../assets/audio/processed/vo_rawi_01-06_v01.mp3';
import vo08 from '../../assets/audio/processed/vo_rawi_01-08_v01.mp3';
import vo09 from '../../assets/audio/processed/vo_rawi_01-09_v01.mp3';
import vo11 from '../../assets/audio/processed/vo_rawi_01-11_v01.mp3';

const VOICE: Record<string, string> = {
  '01': vo01, '02': vo02, '03': vo03, '05': vo05, '06': vo06, '08': vo08, '09': vo09, '11': vo11,
};

/** Town playlist, played in turn. Add new town tracks here as they arrive. */
const TOWN_PLAYLIST: string[] = [townFull, mainTheme];
/** Quiet between tracks, in milliseconds. */
const GAP_MS = 6000;
const MUSIC_VOLUME = 0.6;
const DUCKED_VOLUME = 0.2;

export class Sound {
  private music: HTMLAudioElement | null = null;
  private voice: HTMLAudioElement | null = null;
  private unlocked = false;
  private track = 0;
  private gapTimer = 0;

  constructor(
    public voiceOn: boolean,
    public musicOn: boolean,
  ) {
    const unlock = () => {
      this.unlocked = true;
      this.applyMusic();
      window.removeEventListener('pointerdown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    // Quiet when the game is in the background; carry on when it comes back.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.music?.pause();
      else this.applyMusic();
    });
  }

  setMusic(on: boolean): void {
    this.musicOn = on;
    this.applyMusic();
  }

  setVoice(on: boolean): void {
    this.voiceOn = on;
    if (!on) this.voice?.pause();
  }

  private applyMusic(): void {
    if (!this.unlocked) return;
    if (!this.musicOn) {
      window.clearTimeout(this.gapTimer);
      this.music?.pause();
      return;
    }
    if (!this.music) return this.playTrack();
    if (this.music.paused && !this.music.ended) this.music.play().catch(() => undefined);
  }

  private playTrack(): void {
    const el = new Audio(TOWN_PLAYLIST[this.track % TOWN_PLAYLIST.length]);
    el.volume = MUSIC_VOLUME;
    el.addEventListener('ended', () => {
      this.track += 1;
      this.music = null;
      // A few seconds of quiet, then the next track starts on its own soft opening.
      this.gapTimer = window.setTimeout(() => {
        if (this.musicOn && document.visibilityState !== 'hidden') this.playTrack();
      }, GAP_MS);
    });
    this.music = el;
    el.play().catch(() => {
      /* blocked until the next tap */
    });
  }

  /** Play a Rawi line by its VO-01 number ("02"), only in English. Music dips under the voice. */
  say(line: string | undefined, langIsEnglish: boolean): void {
    if (!line || !this.voiceOn || !langIsEnglish || !this.unlocked) return;
    const src = VOICE[line];
    if (!src) return;
    this.voice?.pause();
    this.voice = new Audio(src);
    if (this.music) this.music.volume = DUCKED_VOLUME;
    this.voice.onended = () => {
      if (this.music) this.music.volume = MUSIC_VOLUME;
    };
    this.voice.play().catch(() => undefined);
  }
}
