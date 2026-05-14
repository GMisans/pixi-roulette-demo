import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import {
  WHEEL_NUMBERS,
  POCKET_COUNT,
  POCKET_ANGLE,
  getPocketColor,
} from '../utils/constants';
import { easeOutQuart } from '../utils/easing';

const TWO_PI = Math.PI * 2;

// Inner boundary of pocket ring as a fraction of wheel radius.
// Everything inside this radius is the decorative wooden cone.
const INNER_RATIO = 0.60;

export class Wheel extends Container {
  private readonly wheelGraphics: Graphics;
  private readonly labelContainer: Container;

  private spinning = false;
  private spinDuration = 4500;
  private spinElapsed = 0;
  private startAngle = 0;
  private targetAngle = 0;

  currentAngle = 0;

  constructor(radius: number) {
    super();
    this.wheelGraphics = new Graphics();
    this.labelContainer = new Container();
    this.addChild(this.wheelGraphics);
    this.addChild(this.labelContainer);
    this.draw(radius);
  }

  private draw(radius: number): void {
    const g = this.wheelGraphics;
    g.clear();

    const innerR  = radius * INNER_RATIO;

    // ── Outer decorative rim ──────────────────────────────────────────────────
    g.circle(0, 0, radius + 12);
    g.fill({ color: 0x5a3a08 });
    g.circle(0, 0, radius + 10);
    g.fill({ color: 0xc8a020 });   // gold band
    g.circle(0, 0, radius + 7);
    g.fill({ color: 0x6b4910 });   // dark wood
    g.circle(0, 0, radius + 4);
    g.fill({ color: 0xc0940c });   // inner gold band
    g.circle(0, 0, radius + 1);
    g.fill({ color: 0x3a2006 });   // dark shadow before pockets

    // Dark base behind entire pocket ring (visible through fret gaps)
    g.circle(0, 0, radius);
    g.fill({ color: 0x0d0d0d });

    // ── Pocket ring sectors ───────────────────────────────────────────────────
    for (let i = 0; i < POCKET_COUNT; i++) {
      const startA = i * POCKET_ANGLE - Math.PI / 2;
      const endA   = startA + POCKET_ANGLE;
      const color  = getPocketColor(WHEEL_NUMBERS[i]);

      // Annular sector from innerR to radius
      g.moveTo(Math.cos(startA) * innerR,  Math.sin(startA) * innerR);
      g.lineTo(Math.cos(startA) * radius,  Math.sin(startA) * radius);
      g.arc(0, 0, radius, startA, endA, false);
      g.lineTo(Math.cos(endA) * innerR,    Math.sin(endA) * innerR);
      g.arc(0, 0, innerR, endA, startA, true);
      g.closePath();
      g.fill({ color });

      // Shadow strip along inner wall — gives each pocket a sense of depth
      const shadowEdge = innerR + (radius - innerR) * 0.20;
      g.moveTo(Math.cos(startA) * innerR,    Math.sin(startA) * innerR);
      g.lineTo(Math.cos(startA) * shadowEdge, Math.sin(startA) * shadowEdge);
      g.arc(0, 0, shadowEdge, startA, endA, false);
      g.lineTo(Math.cos(endA) * innerR,      Math.sin(endA) * innerR);
      g.arc(0, 0, innerR, endA, startA, true);
      g.closePath();
      g.fill({ color: 0x000000, alpha: 0.42 });
    }

    // ── Fret dividers between pockets ─────────────────────────────────────────
    for (let i = 0; i < POCKET_COUNT; i++) {
      const a = i * POCKET_ANGLE - Math.PI / 2;
      g.moveTo(Math.cos(a) * innerR,  Math.sin(a) * innerR);
      g.lineTo(Math.cos(a) * radius,  Math.sin(a) * radius);
      g.stroke({ color: 0xd4a820, width: 1.8 });
    }

    // Outer pocket ring border
    g.circle(0, 0, radius);
    g.stroke({ color: 0xd4a820, width: 1.0, alpha: 0.6 });

    // Inner pocket ring border (top edge of pocket wall)
    g.circle(0, 0, innerR);
    g.stroke({ color: 0xd4a820, width: 1.2, alpha: 0.5 });

    // ── Separator pins at fret tops ───────────────────────────────────────────
    const pinR     = radius * 0.017;
    const pinTrack = radius * 0.975;
    for (let i = 0; i < POCKET_COUNT; i++) {
      const a = i * POCKET_ANGLE - Math.PI / 2;
      const px = Math.cos(a) * pinTrack;
      const py = Math.sin(a) * pinTrack;
      g.circle(px, py, pinR);
      g.fill({ color: 0x3a2006 });
      g.circle(px, py, pinR * 0.78);
      g.fill({ color: 0xd4a820 });
      g.circle(px, py, pinR * 0.38);
      g.fill({ color: 0xfff4c0 });
    }

    // ── Inner wooden cone ─────────────────────────────────────────────────────
    // Dark ring just inside pocket wall (shadow of inner pocket wall)
    g.circle(0, 0, innerR + radius * 0.010);
    g.fill({ color: 0x100a00 });
    // Concentric bands simulate the lathe-turned cone shape
    g.circle(0, 0, innerR);
    g.fill({ color: 0x3d2408 });
    g.circle(0, 0, innerR * 0.87);
    g.fill({ color: 0x6b4410 });
    g.circle(0, 0, innerR * 0.72);
    g.fill({ color: 0x7a5014 });
    g.circle(0, 0, innerR * 0.56);
    g.fill({ color: 0x5c380e });
    g.circle(0, 0, innerR * 0.38);
    g.fill({ color: 0x7a5014 });
    g.circle(0, 0, innerR * 0.22);
    g.fill({ color: 0x3d2408 });

    // ── Centre hub ────────────────────────────────────────────────────────────
    g.circle(0, 0, radius * 0.090);
    g.fill({ color: 0xc8a020 });
    g.circle(0, 0, radius * 0.064);
    g.fill({ color: 0x3d2408 });
    g.circle(0, 0, radius * 0.038);
    g.fill({ color: 0xd4a820 });
    g.circle(0, 0, radius * 0.016);
    g.fill({ color: 0xfff8d0 });

    this.drawLabels(radius);
  }

  private drawLabels(radius: number): void {
    this.labelContainer.removeChildren();

    const innerR  = radius * INNER_RATIO;
    const labelR  = innerR + (radius - innerR) * 0.54;   // just above pocket midpoint
    const pocketH = radius - innerR;

    const style = new TextStyle({
      fontSize: Math.max(7, pocketH * 0.34),
      fill: 0xffffff,
      fontFamily: 'Arial',
      fontWeight: 'bold',
    });

    for (let i = 0; i < POCKET_COUNT; i++) {
      const midAngle = i * POCKET_ANGLE + POCKET_ANGLE / 2 - Math.PI / 2;
      const label = new Text({ text: String(WHEEL_NUMBERS[i]), style });
      label.anchor.set(0.5);
      label.x = Math.cos(midAngle) * labelR;
      label.y = Math.sin(midAngle) * labelR;
      label.rotation = midAngle + Math.PI / 2;
      this.labelContainer.addChild(label);
    }
  }

  spinTo(pocketIndex: number, extraRevolutions = 7): void {
    if (this.spinning) return;

    const alignAngle = -(pocketIndex * POCKET_ANGLE + POCKET_ANGLE / 2);

    const currentNorm = ((this.currentAngle % TWO_PI) + TWO_PI) % TWO_PI;
    const alignNorm   = ((alignAngle   % TWO_PI) + TWO_PI) % TWO_PI;
    const diff = ((alignNorm - currentNorm) + TWO_PI) % TWO_PI;

    this.startAngle  = this.currentAngle;
    this.targetAngle = this.currentAngle + extraRevolutions * TWO_PI + diff;
    this.spinElapsed = 0;
    this.spinning    = true;
  }

  update(deltaMS: number): boolean {
    if (!this.spinning) return false;

    this.spinElapsed += deltaMS;
    const t = Math.min(this.spinElapsed / this.spinDuration, 1);
    this.currentAngle = this.startAngle + (this.targetAngle - this.startAngle) * easeOutQuart(t);
    this.rotation = this.currentAngle;

    if (t >= 1) {
      this.spinning = false;
      return true;
    }
    return false;
  }

  resize(radius: number): void {
    this.wheelGraphics.clear();
    this.labelContainer.removeChildren();
    this.draw(radius);
  }
}
