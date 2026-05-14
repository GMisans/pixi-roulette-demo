import { Container, Graphics } from 'pixi.js';
import { easeOutQuart, easeOutCubic, lerp } from '../utils/easing';

type Phase = 'idle' | 'orbit' | 'drop' | 'settled';

const FINAL_ANGLE = -Math.PI / 2;
const TWO_PI = Math.PI * 2;
const ORBIT_DURATION = 4500;
const EXTRA_REVS = 9;

export class Ball extends Container {
  private readonly gfx: Graphics;
  private phase: Phase = 'idle';

  private outerRadius = 0;
  private pocketRadius = 0;
  private ballRadius = 6;

  private orbitStartAngle = 0;
  private orbitEndAngle = 0;
  private orbitElapsed = 0;

  private dropElapsed = 0;
  private readonly dropDuration = 340;

  onSettled?: () => void;

  constructor() {
    super();
    this.gfx = new Graphics();
    this.addChild(this.gfx);
    this.visible = false;
  }

  private draw(r: number): void {
    this.gfx.clear();
    this.gfx.circle(r * 0.18, r * 0.18, r);
    this.gfx.fill({ color: 0x000000, alpha: 0.28 });
    this.gfx.circle(0, 0, r);
    this.gfx.fill({ color: 0xe8e8e8 });
    this.gfx.circle(-r * 0.3, -r * 0.3, r * 0.3);
    this.gfx.fill({ color: 0xffffff, alpha: 0.8 });
  }

  launch(outerRadius: number, wheelRadius: number): void {
    this.outerRadius = outerRadius;
    this.pocketRadius = wheelRadius * 0.87;
    this.ballRadius = Math.max(5, wheelRadius * 0.036);
    this.draw(this.ballRadius);

    this.orbitStartAngle = Math.random() * TWO_PI;

    // Orbit decelerates so the ball ends exactly at the winning pocket.
    const approachNorm = ((FINAL_ANGLE % TWO_PI) + TWO_PI) % TWO_PI;
    const startNorm    = ((this.orbitStartAngle % TWO_PI) + TWO_PI) % TWO_PI;
    const ccwDist = ((startNorm - approachNorm) + TWO_PI) % TWO_PI;
    this.orbitEndAngle = this.orbitStartAngle - (EXTRA_REVS * TWO_PI + ccwDist);

    this.orbitElapsed = 0;
    this.phase = 'orbit';
    this.visible = true;
    this.setPos(this.outerRadius, this.orbitStartAngle);
  }

  update(deltaMS: number, _wheelDone: boolean): void {
    switch (this.phase) {
      case 'orbit':  this.tickOrbit(deltaMS);  break;
      case 'drop':   this.tickDrop(deltaMS);   break;
    }
  }

  private tickOrbit(deltaMS: number): void {
    this.orbitElapsed += deltaMS;
    const t = Math.min(this.orbitElapsed / ORBIT_DURATION, 1);
    const angle = lerp(this.orbitStartAngle, this.orbitEndAngle, easeOutQuart(t));

    this.setPos(this.outerRadius, angle);

    if (t >= 1) this.beginDrop();
  }

  private beginDrop(): void {
    this.dropElapsed = 0;
    this.phase = 'drop';
  }

  private tickDrop(deltaMS: number): void {
    this.dropElapsed += deltaMS;
    const t = Math.min(this.dropElapsed / this.dropDuration, 1);
    const radius = lerp(this.outerRadius, this.pocketRadius, easeOutCubic(t));
    // Angle locked to winning pocket for the entire drop
    this.setPos(radius, FINAL_ANGLE);

    if (t >= 1) {
      this.setPos(this.pocketRadius, FINAL_ANGLE);
      this.phase = 'settled';
      this.onSettled?.();
    }
  }

  private setPos(radius: number, angle: number): void {
    this.x = Math.cos(angle) * radius;
    this.y = Math.sin(angle) * radius;
  }

  reset(): void {
    this.phase = 'idle';
    this.visible = false;
  }
}
