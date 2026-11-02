/**
 * Rawi's voice and the town music. Browsers only play sound after the player has touched the page,
 * so nothing starts until the first tap. Voice: English only for now (Arabic narration waits for a
 * native writer, see docs/ASSET_INVENTORY.md VO-01).
 */
import townBed from '../../assets/audio/processed/mus_town-bed_loop_v01.ogg';
import vo01 from '../../assets/audio/processed/vo_rawi_01-01_v01.ogg';
import vo02 from '../../assets/audio/processed/vo_rawi_01-02_v01.ogg';
import vo03 from '../../assets/audio/processed/vo_rawi_01-03_v01.ogg';
import vo05 from '../../assets/audio/processed/vo_rawi_01-05_v01.ogg';
import vo06 from '../../assets/audio/processed/vo_rawi_01-06_v01.ogg';
import vo08 from '../../assets/audio/processed/vo_rawi_01-08_v01.ogg';
import vo09 from '../../assets/audio/processed/vo_rawi_01-09_v01.ogg';
import vo11 from '../../assets/audio/processed/vo_rawi_01-11_v01.ogg';

const VOICE: Record<string, string> = {
  '01': vo01, '02': vo02, '03': vo03, '05': vo05, '06': vo06, '08': vo08, '09': vo09, '11': vo11,
};

export class Sound {
  private music: HTMLAudioElement | null = null;
  private voice: HTMLAudioElement | null = null;
  private unlocked = false;

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
      this.music?.pause();
      return;
    }
    if (!this.music) {
      this.music = new Audio(townBed);
      this.music.loop = true;
      this.music.volume = 0.35;
    }
    this.music.play().catch(() => {
      /* blocked: retried on the next tap */
    });
  }

  /** Play a Rawi line by its VO-01 number ("02"), only in English. */
  say(line: string | undefined, langIsEnglish: boolean): void {
    if (!line || !this.voiceOn || !langIsEnglish || !this.unlocked) return;
    const src = VOICE[line];
    if (!src) return;
    this.voice?.pause();
    this.voice = new Audio(src);
    this.voice.volume = 0.9;
    if (this.music) this.music.volume = 0.15; // duck the music under the voice
    this.voice.onended = () => {
      if (this.music) this.music.volume = 0.35;
    };
    this.voice.play().catch(() => {
      /* ignore */
    });
  }
}
