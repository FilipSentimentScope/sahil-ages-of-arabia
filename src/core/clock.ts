/**
 * Game clock. All timing in the game reads from here, never from Date directly,
 * so the two time modes (Showcase, Playtest) and a future server clock are one setting.
 *
 * Game time advances at `scale` times real time. Changing the scale rebases the
 * clock so game time never jumps.
 */

export type TimeMode = 'showcase' | 'playtest';

export interface ClockSnapshot {
  /** Game time in milliseconds at the moment of the snapshot. */
  game: number;
  /** Real time in milliseconds at the moment of the snapshot. */
  real: number;
  scale: number;
}

export class GameClock {
  private gameOrigin: number;
  private realOrigin: number;
  private scaleValue: number;

  constructor(
    private readonly realNow: () => number,
    scale = 1,
    gameOrigin?: number,
  ) {
    if (!(scale > 0)) throw new Error(`Clock scale must be positive, got ${scale}`);
    this.realOrigin = realNow();
    this.gameOrigin = gameOrigin ?? this.realOrigin;
    this.scaleValue = scale;
  }

  /** Current game time in milliseconds. */
  now(): number {
    return this.gameOrigin + (this.realNow() - this.realOrigin) * this.scaleValue;
  }

  get scale(): number {
    return this.scaleValue;
  }

  /** Change speed without moving game time. */
  setScale(scale: number): void {
    if (!(scale > 0)) throw new Error(`Clock scale must be positive, got ${scale}`);
    const current = this.now();
    this.realOrigin = this.realNow();
    this.gameOrigin = current;
    this.scaleValue = scale;
  }

  snapshot(): ClockSnapshot {
    return { game: this.now(), real: this.realNow(), scale: this.scaleValue };
  }

  /**
   * Rebuild a clock from a saved snapshot. Real time that passed while the game
   * was closed is converted to game time at the saved scale, which is how
   * production while away works.
   */
  static restore(snap: ClockSnapshot, realNow: () => number): GameClock {
    const away = Math.max(0, realNow() - snap.real);
    return new GameClock(realNow, snap.scale, snap.game + away * snap.scale);
  }
}

export const HOUR_MS = 3_600_000;
