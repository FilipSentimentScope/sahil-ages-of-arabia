/**
 * The town board: a pointy-top hex map drawn with PixiJS (layout in src/core/hex.ts).
 *
 * - Terrain is painted from map data: each hex is filled with its ground colour, then softly
 *   blurred so neighbouring grounds bleed into each other like paint, with a faint hex grid on
 *   top. Painted terrain tiles (IMAGE_PROMPTS.md) can replace this later without touching rules.
 * - Land outside the open block is greyed out and fenced by a gold line: the player sees where
 *   the town will grow at the next age change [GDD section 15].
 * - Buildings stand centred on their hex at about four fifths of its width, so the ground and
 *   the grid stay visible between them.
 * - The board is tilted (drawn flattened vertically) so the upright building art reads as standing
 *   on the ground, as in the reference games Filip chose (2 Nov). The hex grid shows only while
 *   placing a building; the gold fence always shows the town's edge.
 * - The camera starts framed on the open block. Drag to pan; pinch or the mouse wheel to zoom.
 *
 * Presentation only: the view reads TownState and reports taps; rules stay in src/core.
 */
import { Application, BlurFilter, Container, Graphics, Rectangle, Sprite, Text, type Texture } from 'pixi.js';
import type { LoadedContent, PlacedBuilding, TerrainId, TownState } from '../core';
import { hexAtPoint, hexCentre, hexCorners, hexNeighbours, isOpen, openArea, outputPerHour, storageCap } from '../core';
import { t } from './i18n';

/** Hex size (centre to corner) in world units. The camera scales the world to the screen. */
const S = 40;
const HEX_W = Math.sqrt(3) * S;
/** Vertical squash of the ground: the board seen at a tilt. */
const FLAT = 0.66;

/** Ground colours, warm and low-contrast as in the Art Bible's painted board. */
const TERRAIN_COLOUR: Record<TerrainId, number> = {
  open: 0xdcc596,
  coast: 0xe6d3a6,
  creek: 0x5fa9b3,
  dune: 0xe9bd72,
  sabkha: 0xece4cf,
  mountain: 0x9a8a78,
  wadi: 0xc4a87a,
  sea: 0x3f93a3,
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

/** A building under the mouse (desktop only), with the screen point to show a tooltip at. */
export interface Hover {
  uid: number;
  sx: number;
  sy: number;
}

interface Float {
  text: Text;
  age: number;
}

/** Cheap repeatable hash in [0, 1) for scattering ground details (looks only, not rules). */
function hash(x: number, y: number, k: number): number {
  const v = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

export class TownView {
  private readonly world = new Container();
  /** Ground layers, squashed vertically by FLAT. */
  private readonly ground = new Container();
  private readonly terrainLayer = new Container();
  private readonly gridLayer = new Graphics();
  private readonly highlight = new Graphics();
  private readonly buildingLayer = new Container();
  private readonly fillLayer = new Graphics();
  private readonly floatLayer = new Container();
  private readonly floats: Float[] = [];
  private selectedUid: number | null = null;
  /** Called when the mouse rests on a building, or leaves it (desktop). */
  onHover: (h: Hover | null) => void = () => {};
  private builtVersion = -1;
  private terrainKey = '';
  private buildingArt: Record<string, Texture> = {};

  // Camera: the world point shown at the centre of the screen, and the zoom.
  private camX = 0;
  private camY = 0;
  private zoom = 1;
  private fitZoom = 1;
  private bounds = { x0: 0, y0: 0, x1: 0, y1: 0 };
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private gesture: { startX: number; startY: number; moved: boolean; pinchDist: number } | null = null;

  constructor(
    private readonly app: Application,
    private readonly content: LoadedContent,
    private readonly onTap: (cell: CellTap) => void,
  ) {
    this.ground.addChild(this.terrainLayer, this.gridLayer, this.highlight);
    this.ground.scale.y = FLAT;
    this.gridLayer.visible = false;
    this.world.addChild(this.ground, this.buildingLayer, this.fillLayer, this.floatLayer);
    app.stage.addChild(this.world);
    this.bindInput(app.canvas);
  }

  /** Art per building id; buildings without art keep the grey-box placeholder. */
  setBuildingArt(art: Record<string, Texture>): void {
    this.buildingArt = art;
    this.builtVersion = -1;
  }

  // -------------------------------------------------------------------------
  // Camera

  /** Frame the open block on screen. Call on resize and when the open block grows. */
  layout(s: TownState): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const a = openArea(s);
    const first = hexCentre(a.x, a.y, S);
    const last = hexCentre(a.x + a.size - 1, a.y + a.size - 1, S);
    // Open block extent in world units, including the half-hex shift of odd rows.
    const x0 = first.px - HEX_W / 2;
    const x1 = last.px + HEX_W;
    const y0 = (first.py - S) * FLAT - S; // room above for roofs
    const y1 = (last.py + S) * FLAT;
    // Frame the town in the space the interface leaves free: resources and goals at the top,
    // the next-step bar at the bottom, the action column on the right.
    const pad = { l: 10, r: 80, t: 104, b: 76 };
    this.fitZoom = Math.min((w - pad.l - pad.r) / (x1 - x0), (h - pad.t - pad.b) / (y1 - y0));
    this.zoom = this.fitZoom;
    this.camX = (x0 + x1) / 2 + (pad.r - pad.l) / 2 / this.zoom;
    this.camY = (y0 + y1) / 2 + (pad.b - pad.t) / 2 / this.zoom;
    const end = hexCentre(s.width - 1, s.height - 1, S);
    this.bounds = { x0: -HEX_W / 2, y0: -S * FLAT, x1: end.px + HEX_W, y1: (end.py + S) * FLAT };
    this.applyCamera();
    this.drawTerrain(s);
    this.builtVersion = -1;
  }

  private applyCamera(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    // Zoom out far enough to see the whole map, in up to two and a half times the framing.
    const whole = Math.min(w / (this.bounds.x1 - this.bounds.x0), h / (this.bounds.y1 - this.bounds.y0));
    this.zoom = Math.max(Math.min(whole, this.fitZoom), Math.min(this.zoom, this.fitZoom * 2.5));
    // Keep the screen centre over the map.
    this.camX = Math.max(this.bounds.x0, Math.min(this.bounds.x1, this.camX));
    this.camY = Math.max(this.bounds.y0, Math.min(this.bounds.y1, this.camY));
    this.world.scale.set(this.zoom);
    this.world.position.set(w / 2 - this.camX * this.zoom, h / 2 - this.camY * this.zoom);
  }

  /** Page point (relative to the canvas) of plot (x, y)'s centre. Used by automated tests. */
  screenPointOf(x: number, y: number): { x: number; y: number } {
    const { px, py } = hexCentre(x, y, S);
    return { x: this.world.position.x + px * this.zoom, y: this.world.position.y + py * FLAT * this.zoom };
  }

  /** Show the hex grid (while placing a building). */
  setPlacing(on: boolean): void {
    this.gridLayer.visible = on;
  }

  /** Ring around the building whose panel is open. */
  select(uid: number | null): void {
    this.selectedUid = uid;
  }

  /** Rising, fading text over a plot ("+24 🪙"). Made on events only, never per frame. */
  float(x: number, y: number, text: string): void {
    const { px, py } = hexCentre(x, y, S);
    const label = new Text({
      text,
      resolution: 3,
      style: { fontSize: 15, fontWeight: '800', fill: 0xffffff, stroke: { color: 0x2b2118, width: 4 } },
    });
    label.anchor.set(0.5, 1);
    label.position.set(px, py * FLAT - S * 0.9);
    this.floatLayer.addChild(label);
    this.floats.push({ text: label, age: 0 });
  }

  private toWorld(sx: number, sy: number): { wx: number; wy: number } {
    return { wx: (sx - this.world.position.x) / this.zoom, wy: (sy - this.world.position.y) / this.zoom };
  }

  private zoomAt(sx: number, sy: number, factor: number): void {
    const before = this.toWorld(sx, sy);
    this.zoom *= factor;
    this.applyCamera();
    const after = this.toWorld(sx, sy);
    this.camX += before.wx - after.wx;
    this.camY += before.wy - after.wy;
    this.applyCamera();
  }

  private bindInput(canvas: HTMLCanvasElement): void {
    const local = (e: PointerEvent | WheelEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const pinchDist = () => {
      const [a, b] = [...this.pointers.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    canvas.addEventListener('pointerdown', (e) => {
      const p = local(e);
      canvas.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, p);
      if (this.pointers.size === 1) this.gesture = { startX: p.x, startY: p.y, moved: false, pinchDist: 0 };
      else if (this.gesture) {
        this.gesture.moved = true; // a second finger never ends in a tap
        this.gesture.pinchDist = pinchDist();
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' && this.pointers.size === 0) this.hoverAt(local(e));
      const prev = this.pointers.get(e.pointerId);
      if (!prev || !this.gesture) return;
      const p = local(e);
      this.pointers.set(e.pointerId, p);
      if (this.pointers.size >= 2) {
        const d = pinchDist();
        if (this.gesture.pinchDist > 0 && d > 0) {
          const pts = [...this.pointers.values()];
          const mx = (pts[0]!.x + pts[1]!.x) / 2;
          const my = (pts[0]!.y + pts[1]!.y) / 2;
          this.zoomAt(mx, my, d / this.gesture.pinchDist);
        }
        this.gesture.pinchDist = d;
        return;
      }
      if (Math.hypot(p.x - this.gesture.startX, p.y - this.gesture.startY) > 8) this.gesture.moved = true;
      if (this.gesture.moved) {
        this.camX -= (p.x - prev.x) / this.zoom;
        this.camY -= (p.y - prev.y) / this.zoom;
        this.applyCamera();
      }
    });
    const end = (e: PointerEvent) => {
      if (!this.pointers.has(e.pointerId)) return;
      const p = local(e);
      this.pointers.delete(e.pointerId);
      if (this.pointers.size > 0) return;
      const g = this.gesture;
      this.gesture = null;
      if (g && !g.moved && e.type === 'pointerup') {
        const { wx, wy } = this.toWorld(p.x, p.y);
        this.onTap(hexAtPoint(wx, wy / FLAT, S));
      }
    };
    canvas.addEventListener('pointerleave', () => this.onHover(null));
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const p = local(e);
        this.zoomAt(p.x, p.y, e.deltaY < 0 ? 1.1 : 1 / 1.1);
      },
      { passive: false },
    );
  }

  private hoverTown: TownState | null = null;
  private hoverUid: number | null = null;

  private hoverAt(p: { x: number; y: number }): void {
    const s = this.hoverTown;
    if (!s) return;
    const { wx, wy } = this.toWorld(p.x, p.y);
    const h = hexAtPoint(wx, wy / FLAT, S);
    const b = s.buildings.find((x) => x.x === h.x && x.y === h.y);
    const uid = b ? b.uid : null;
    if (uid === this.hoverUid) return;
    this.hoverUid = uid;
    if (!b) return this.onHover(null);
    const sp = this.screenPointOf(b.x, b.y);
    this.onHover({ uid: b.uid, sx: sp.x, sy: sp.y });
  }

  // -------------------------------------------------------------------------
  // Terrain

  private drawTerrain(s: TownState): void {
    const a = openArea(s);
    const key = `${s.mapId}|${s.width}x${s.height}|${a.x},${a.y},${a.size}|${s.terrain.join('')}`;
    if (key === this.terrainKey) return;
    this.terrainKey = key;
    this.terrainLayer.removeChildren().forEach((c) => c.destroy({ children: true, texture: c instanceof Sprite }));
    const terrainOf = (x: number, y: number): TerrainId => {
      const cx = Math.max(0, Math.min(s.width - 1, x));
      const cy = Math.max(0, Math.min(s.height - 1, y));
      return s.terrain[cy * s.width + cx] ?? 'open';
    };

    // 1. Soft paint: oversized hex fills, blurred together. Two extra rings past the map edge
    //    repeat the edge ground, so the blur does not fade the border to the background.
    const paint = new Graphics();
    for (let y = -2; y < s.height + 2; y++) {
      for (let x = -2; x < s.width + 2; x++) {
        const { px, py } = hexCentre(x, y, S);
        paint.poly(hexCorners(px, py, S * 1.03)).fill(TERRAIN_COLOUR[terrainOf(x, y)]);
      }
    }
    const blurred = new Container();
    blurred.addChild(paint);
    blurred.filters = [new BlurFilter({ strength: S * 0.2, quality: 3 })];
    // The ground never changes between redraws: render the blur once into a texture instead of
    // filtering every frame. The frame is set explicitly (Pixi's automatic bounds clip filtered
    // content that starts at negative coordinates). Resolution 2 stays crisp when zoomed in.
    const pb = paint.getLocalBounds();
    const ground = this.app.renderer.generateTexture({
      target: blurred,
      resolution: 2,
      antialias: true,
      frame: new Rectangle(pb.x, pb.y, pb.width, pb.height),
    });
    paint.destroy();
    blurred.destroy();
    const groundSprite = new Sprite(ground);
    groundSprite.position.set(pb.x, pb.y);
    this.terrainLayer.addChild(groundSprite);

    // 2. Ground details: dune ripples, salt crust, small waves, scattered grit.
    const detail = new Graphics();
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) this.drawDetail(detail, terrainOf(x, y), x, y);
    }
    this.terrainLayer.addChild(detail);

    // 3. Locked land: greyed, as the player cannot build there yet.
    const locked = new Graphics();
    const grid = new Graphics();
    const lockedGrid = new Graphics();
    for (let y = -2; y < s.height + 2; y++) {
      for (let x = -2; x < s.width + 2; x++) {
        const { px, py } = hexCentre(x, y, S);
        const corners = hexCorners(px, py, S);
        const onMap = x >= 0 && y >= 0 && x < s.width && y < s.height;
        if (!onMap) {
          // Past the map edge: dimmed like locked land, without grid lines.
          locked.poly(corners).fill({ color: 0x57524b, alpha: terrainOf(x, y) === 'sea' ? 0.2 : 0.5 });
        } else if (isOpen(s, x, y)) grid.poly(corners); // drawn into gridLayer below, shown while placing
        else {
          // Sea is never buildable, so it is only lightly dimmed; locked land is clearly greyed.
          locked.poly(corners).fill({ color: 0x57524b, alpha: terrainOf(x, y) === 'sea' ? 0.12 : 0.4 });
          lockedGrid.poly(corners);
        }
      }
    }
    lockedGrid.stroke({ width: 1, color: 0x2b2118, alpha: 0.06 });
    grid.stroke({ width: 1.5, color: 0x4a3420, alpha: 0.45 });
    grid.destroy();
    this.gridLayer.clear();
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) {
        if (!isOpen(s, x, y)) continue;
        const { px, py } = hexCentre(x, y, S);
        this.gridLayer.poly(hexCorners(px, py, S));
      }
    }
    this.gridLayer.stroke({ width: 1.5, color: 0x4a3420, alpha: 0.45 });
    this.terrainLayer.addChild(locked, lockedGrid);

    // 4. The town boundary: a gold line along every open edge that faces locked land.
    const fence = new Graphics();
    for (let y = a.y; y < a.y + a.size; y++) {
      for (let x = a.x; x < a.x + a.size; x++) {
        const { px, py } = hexCentre(x, y, S);
        const corners = hexCorners(px, py, S);
        for (const n of hexNeighbours(x, y)) {
          if (isOpen(s, n.x, n.y)) continue;
          // The shared edge is the pair of corners nearest the neighbour's centre.
          const nc = hexCentre(n.x, n.y, S);
          const mx = (px + nc.px) / 2;
          const my = (py + nc.py) / 2;
          const idx = [0, 1, 2, 3, 4, 5]
            .sort((i, j) => Math.hypot(corners[i * 2]! - mx, corners[i * 2 + 1]! - my) - Math.hypot(corners[j * 2]! - mx, corners[j * 2 + 1]! - my))
            .slice(0, 2);
          fence.moveTo(corners[idx[0]! * 2]!, corners[idx[0]! * 2 + 1]!).lineTo(corners[idx[1]! * 2]!, corners[idx[1]! * 2 + 1]!);
        }
      }
    }
    fence.stroke({ width: 4, color: 0x3a2a18, alpha: 0.35, cap: 'round' });
    fence.stroke({ width: 2, color: 0xe2b85c, alpha: 0.95, cap: 'round' });
    this.terrainLayer.addChild(fence);
  }

  private drawDetail(g: Graphics, terr: TerrainId, x: number, y: number): void {
    const { px, py } = hexCentre(x, y, S);
    const r = (k: number) => hash(x, y, k);
    if (terr === 'dune') {
      for (let i = 0; i < 3; i++) {
        const ox = px + (r(i) - 0.5) * S * 0.9;
        const oy = py + (r(i + 7) - 0.5) * S * 0.9;
        g.moveTo(ox - S * 0.32, oy).quadraticCurveTo(ox, oy - S * 0.16, ox + S * 0.32, oy);
      }
      g.stroke({ width: 2.2, color: 0xa87a3a, alpha: 0.5, cap: 'round' });
    } else if (terr === 'sea' || terr === 'creek') {
      for (let i = 0; i < 2; i++) {
        const ox = px + (r(i) - 0.5) * S * 0.9;
        const oy = py + (r(i + 5) - 0.5) * S * 0.8;
        g.moveTo(ox - S * 0.2, oy).quadraticCurveTo(ox - S * 0.1, oy - S * 0.08, ox, oy).quadraticCurveTo(ox + S * 0.1, oy + S * 0.08, ox + S * 0.2, oy);
      }
      g.stroke({ width: 1.6, color: 0xeaf6f2, alpha: terr === 'sea' ? 0.35 : 0.45, cap: 'round' });
    } else if (terr === 'sabkha') {
      for (let i = 0; i < 6; i++) {
        g.circle(px + (r(i) - 0.5) * S * 1.2, py + (r(i + 11) - 0.5) * S * 1.1, 1.5 + r(i + 3) * 2.5);
      }
      g.fill({ color: 0xffffff, alpha: 0.55 });
    } else {
      // Open ground and shore: a little grit so it reads as sand, not a flat fill.
      for (let i = 0; i < 7; i++) {
        g.circle(px + (r(i) - 0.5) * S * 1.3, py + (r(i + 13) - 0.5) * S * 1.2, 0.8 + r(i + 2) * 1.2);
      }
      g.fill({ color: 0x8a6a3e, alpha: 0.25 });
      if (terr === 'coast') {
        g.moveTo(px - S * 0.5, py + S * 0.55).quadraticCurveTo(px, py + S * 0.4, px + S * 0.5, py + S * 0.55);
        g.stroke({ width: 2, color: 0xffffff, alpha: 0.35, cap: 'round' });
      }
    }
  }

  // -------------------------------------------------------------------------
  // Buildings

  /** Rebuild building shapes when the layout changes (placement, upgrade, language). */
  sync(s: TownState, version: number): void {
    this.hoverTown = s;
    if (version === this.builtVersion) return;
    this.builtVersion = version;
    this.drawTerrain(s); // no-op unless the open block or map changed
    this.buildingLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    // Back rows first so buildings lower on the board overlap the ones behind them.
    const ordered = [...s.buildings].sort((a, b) => a.y - b.y || a.x - b.x);
    for (const b of ordered) this.buildingLayer.addChild(this.drawBuilding(b));
  }

  private drawBuilding(b: PlacedBuilding): Container {
    const def = this.content.building(b.defId);
    const { px, py: rawY } = hexCentre(b.x, b.y, S);
    const py = rawY * FLAT;
    const c = new Container();
    const art = this.buildingArt[b.defId];
    // A soft contact shadow on the tilted ground.
    c.addChild(new Graphics().ellipse(px, py + S * 0.2, HEX_W * 0.38, S * 0.2).fill({ color: 0x3a2a18, alpha: 0.2 }));
    if (art) {
      // Centred on its plot at 88% of the hex width; the base sits just below the centre.
      const sprite = new Sprite(art);
      const drawn = HEX_W * 0.88;
      sprite.anchor.set(0.5, 0.94);
      sprite.width = drawn;
      sprite.height = drawn;
      sprite.position.set(px, py + S * 0.42);
      c.addChild(sprite);
    } else {
      const corners = hexCorners(px, rawY, S * 0.72).map((v, i) => (i % 2 ? v * FLAT : v));
      const body = new Graphics()
        .poly(corners)
        .fill(def.tags.includes('water') ? RESOURCE_COLOUR.water! : (RESOURCE_COLOUR[def.produces ?? 'none'] ?? 0x888888))
        // Magenta border marks a placeholder asset, per the asset rules in CLAUDE.md.
        .stroke({ width: 2, color: 0xb0307a, alpha: 0.8 });
      c.addChild(body);
      const name = new Text({
        text: t(def.nameKey),
        resolution: 3,
        style: { fontSize: 10, fill: 0xffffff, wordWrap: true, wordWrapWidth: S * 1.2, align: 'center', breakWords: true },
      });
      name.anchor.set(0.5);
      name.position.set(px, py);
      c.addChild(name);
    }
    if (def.firstUpgradeCost > 0 || def.produces) c.addChild(this.levelBadge(b.level, px - HEX_W * 0.36, py + S * 0.3));
    return c;
  }

  /** Small level number in a dark disc, readable on both painted art and placeholders. */
  private levelBadge(level: number, x: number, y: number): Container {
    const r = 8;
    const badge = new Container();
    badge.addChild(new Graphics().circle(x, y, r).fill({ color: 0x2b2118, alpha: 0.88 }).stroke({ width: 1.2, color: 0xe2b85c, alpha: 0.95 }));
    const lvl = new Text({ text: String(level), resolution: 3, style: { fontSize: 9.5, fill: 0xffffff, fontWeight: '700' } });
    lvl.anchor.set(0.5);
    lvl.position.set(x, y);
    badge.addChild(lvl);
    return badge;
  }

  /** Per-frame: storage bars, "full" markers, the selection ring, placement glow and floating text. */
  frame(s: TownState, selectedDef: string | null, canPlaceAt: (x: number, y: number) => boolean, dtMs = 16): void {
    this.hoverTown = s;
    this.fillLayer.clear();
    for (const b of s.buildings) {
      const { px, py: rawY } = hexCentre(b.x, b.y, S);
      const py = rawY * FLAT;
      if (b.uid === this.selectedUid) {
        this.fillLayer.ellipse(px, py + S * 0.2, HEX_W * 0.48, S * 0.32).stroke({ width: 3, color: 0xffe08a, alpha: 0.95 });
      }
      const rate = outputPerHour(s, this.content, b);
      if (rate <= 0) continue;
      const cap = storageCap(s, this.content, b);
      const share = cap > 0 ? Math.min(1, b.stored / cap) : 0;
      const w = HEX_W * 0.5;
      const x = px - w / 2 + 6;
      const y = py + S * 0.5;
      this.fillLayer.roundRect(x, y, w, 5, 2.5).fill({ color: 0x000000, alpha: 0.35 });
      this.fillLayer.roundRect(x, y, Math.max(1, w * share), 5, 2.5).fill(share >= 1 ? 0xffd75e : 0xffffff);
      if (share >= 1) {
        // A bobbing "ready" marker above a full building.
        const bob = Math.sin(performance.now() / 300 + b.uid) * 2;
        this.fillLayer.circle(px + HEX_W * 0.3, py - S * 0.95 + bob, 7).fill(0xffd75e).stroke({ width: 1.5, color: 0x8a5a2b });
      }
    }
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i]!;
      f.age += dtMs;
      f.text.y -= dtMs * 0.03;
      f.text.alpha = Math.max(0, 1 - f.age / 1400);
      if (f.age > 1400) {
        f.text.destroy();
        this.floats.splice(i, 1);
      }
    }
    this.highlight.clear();
    this.setPlacing(!!selectedDef);
    if (!selectedDef) return;
    const pulse = 0.25 + 0.15 * Math.sin(performance.now() / 250);
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) {
        if (!canPlaceAt(x, y)) continue;
        const { px, py } = hexCentre(x, y, S);
        this.highlight.poly(hexCorners(px, py, S * 0.9)).fill({ color: 0xfff3c4, alpha: pulse }).stroke({ width: 2.5, color: 0xe2b85c, alpha: 0.95 });
      }
    }
  }
}
