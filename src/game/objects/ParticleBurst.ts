import { Container, Graphics } from 'pixi.js';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: number;
  alpha: number;
  life: number; // 0-1
}

const COLORS = [0xffd700, 0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa8e6cf, 0xff8b94];

export class ParticleBurst extends Container {
  private readonly gfx: Graphics;
  private particles: Particle[] = [];
  private elapsed = 0;
  private readonly duration = 800;
  private active = false;

  constructor() {
    super();
    this.gfx = new Graphics();
    this.addChild(this.gfx);
    this.visible = false;
  }

  fire(originX: number, originY: number, count = 70): void {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 60 + Math.random() * 140;
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 1,
        life: 0,
      });
    }
    this.elapsed = 0;
    this.active = true;
    this.visible = true;
  }

  update(deltaMS: number): void {
    if (!this.active) return;

    this.elapsed += deltaMS;
    const t = Math.min(this.elapsed / this.duration, 1);

    const dt = deltaMS / 1000; // seconds
    this.gfx.clear();

    for (const p of this.particles) {
      p.life = t;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt; // gravity
      p.alpha = 1 - t;

      this.gfx.circle(p.x, p.y, p.radius);
      this.gfx.fill({ color: p.color, alpha: p.alpha });
    }

    if (t >= 1) {
      this.active = false;
      this.visible = false;
      this.gfx.clear();
    }
  }

  get isActive(): boolean {
    return this.active;
  }
}
