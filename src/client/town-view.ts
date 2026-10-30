/**
 * Grey-box rendering of the town grid with PixiJS. Shapes and colours are
 * placeholders; final painted art replaces them after Gate 1 (docs/ART_BIBLE.md).
 */
import { Application, Container, Graphics, Text } from 'pixi.js';
import type { LoadedContent, PlacedBuilding, TerrainId, TownState } from '../core';
import { outputPerHour, storageCap } from '../core';
import { t } from './i18n';

const TERRAIN_COLOUR: Record<TerrainId, number> = {
  open: 0xdcc9a0,
  coast: 0x9cc3c9,
  creek: 0x8fb8c2,
  dune: 0xe8d39c,
  sabkha: 0xebe5d6,
  mountain: 0x9a8a78,
  wadi: 0xc8b48a,
};

const RESOURCE_COLOUR: Record<string, number> = {
  food: 0x7f9f5e,
  coin: 0xc79b3f,
  knowledge: 0x6684ad,
  reputation: 0x9d6680,
  none: 0x8e8778,
  water: 0x4d86b8,
};

export interface CellTap {
  x: number;
  y: number;
}

export class TownView {
  private readonly terrainLayer = new Container();
  private readonly buildingLayer = new Container();
  private readonly fillLayer = new Graphics();
  private readonly highlight = new Graphics();
  private cell = 48;
  private ox = 0;
  private oy = 0;
  private builtVersion = -1;

  constructor(
    private readonly app: Application,
    private readonly content: LoadedContent,
    private readonly onTap: (cell: CellTap) => void,
  ) {
    app.stage.addChild(this.terrainLayer, this.highlight, this.buildingLayer, this.fillLayer);
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.on('pointertap', (e) => {
      const gx = Math.floor((e.global.x - this.ox) / this.cell);
      const gy = Math.floor((e.global.y - this.oy) / this.cell);
      this.onTap({ x: gx, y: gy });
    });
  }

  /** Fit the grid to the stage. Call on resize and on language change (labels). */
  layout(s: TownState): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const pad = 12;
    this.cell = Math.floor(Math.min((w - pad * 2) / s.width, (h - pad * 2) / s.height));
    this.ox = Math.floor((w - this.cell * s.width) / 2);
    this.oy = Math.floor((h - this.cell * s.height) / 2);
    this.app.stage.hitArea = this.app.screen;
    this.drawTerrain(s);
    this.builtVersion = -1;
  }

  private drawTerrain(s: TownState): void {
    this.terrainLayer.removeChildren().forEach((c) => c.destroy());
    const g = new Graphics();
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) {
        const terr = s.terrain[y * s.width + x] ?? 'open';
        g.rect(this.ox + x * this.cell, this.oy + y * this.cell, this.cell, this.cell)
          .fill(TERRAIN_COLOUR[terr])
          .stroke({ width: 1, color: 0xb9a57e, alpha: 0.6 });
      }
    }
    this.terrainLayer.addChild(g);
  }

  /** Rebuild building shapes when the layout changes (placement, upgrade, language). */
  sync(s: TownState, version: number): void {
    if (version === this.builtVersion) return;
    this.builtVersion = version;
    this.buildingLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    for (const b of s.buildings) this.buildingLayer.addChild(this.drawBuilding(b));
  }

  private drawBuilding(b: PlacedBuilding): Container {
    const def = this.content.building(b.defId);
    const c = new Container();
    const m = 3;
    const x = this.ox + b.x * this.cell + m;
    const y = this.oy + b.y * this.cell + m;
    const size = this.cell - m * 2;
    const colour = def.tags.includes('water') ? RESOURCE_COLOUR.water : RESOURCE_COLOUR[def.produces ?? 'none'];
    const body = new Graphics()
      .roundRect(x, y, size, size, 6)
      .fill(colour ?? 0x888888)
      // Magenta dashed-look border marks a placeholder asset, per the asset rules in CLAUDE.md.
      .stroke({ width: 1.5, color: 0xb0307a, alpha: 0.7 });
    c.addChild(body);
    const name = new Text({
      text: t(def.nameKey),
      style: { fontSize: Math.max(8, Math.floor(this.cell / 6)), fill: 0xffffff, wordWrap: true, wordWrapWidth: size - 4, align: 'center', breakWords: true },
    });
    name.anchor.set(0.5);
    name.position.set(x + size / 2, y + size / 2 - 2);
    c.addChild(name);
    if (def.firstUpgradeCost > 0 || def.produces) {
      const lvl = new Text({ text: String(b.level), style: { fontSize: Math.max(8, Math.floor(this.cell / 6)), fill: 0xffffff, fontWeight: '700' } });
      lvl.position.set(x + 3, y + 1);
      c.addChild(lvl);
    }
    return c;
  }

  /** Per-frame: storage bars and the placement highlight. */
  frame(s: TownState, selectedDef: string | null, canPlaceAt: (x: number, y: number) => boolean): void {
    this.fillLayer.clear();
    for (const b of s.buildings) {
      const rate = outputPerHour(s, this.content, b);
      if (rate <= 0) continue;
      const cap = storageCap(s, this.content, b);
      const share = cap > 0 ? Math.min(1, b.stored / cap) : 0;
      const m = 3;
      const x = this.ox + b.x * this.cell + m + 4;
      const y = this.oy + (b.y + 1) * this.cell - m - 7;
      const w = this.cell - m * 2 - 8;
      this.fillLayer.roundRect(x, y, w, 4, 2).fill({ color: 0x000000, alpha: 0.25 });
      this.fillLayer.roundRect(x, y, Math.max(1, w * share), 4, 2).fill(share >= 1 ? 0xfff2a8 : 0xffffff);
      if (share >= 1) {
        this.fillLayer.circle(this.ox + (b.x + 1) * this.cell - 9, this.oy + b.y * this.cell + 9, 5).fill(0xfff2a8);
      }
    }
    this.highlight.clear();
    if (!selectedDef) return;
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) {
        if (canPlaceAt(x, y)) {
          this.highlight
            .rect(this.ox + x * this.cell + 2, this.oy + y * this.cell + 2, this.cell - 4, this.cell - 4)
            .fill({ color: 0xffffff, alpha: 0.35 })
            .stroke({ width: 2, color: 0x8a5a2b, alpha: 0.8 });
        }
      }
    }
  }
}
