import { Application, Container, Graphics } from 'pixi.js';
import EventEmitter from 'eventemitter3';
import { Wheel } from './objects/Wheel';
import { Ball } from './objects/Ball';
import { ParticleBurst } from './objects/ParticleBurst';
import type { RouletteEvents, GameState } from './events';
import { WHEEL_NUMBERS, getPocketIndex } from './utils/constants';

export class GameScene {
  private readonly app: Application;
  private readonly emitter: EventEmitter<RouletteEvents>;
  private readonly root: Container;
  private readonly wheel: Wheel;
  private readonly ball: Ball;
  private readonly burst: ParticleBurst;
  private readonly marker: Graphics;

  private state: GameState = 'IDLE';
  private winningNumber = 0;
  private winningPocketIndex = 0;

  private fpsTimer = 0;
  private readonly fpsInterval = 500;
  private tickFn: (ticker: { deltaMS: number }) => void;

  constructor(app: Application, emitter: EventEmitter<RouletteEvents>) {
    this.app = app;
    this.emitter = emitter;

    this.root = new Container();
    this.app.stage.addChild(this.root);

    const radius = this.wheelRadius();
    this.wheel = new Wheel(radius);
    this.ball = new Ball();
    this.burst = new ParticleBurst();
    this.ball.visible = false;

    // Fixed landing marker: small diamond at 12 o'clock, does NOT rotate with wheel
    this.marker = new Graphics();
    this.drawMarker(radius);

    this.root.addChild(this.wheel);
    this.root.addChild(this.marker); // added after wheel so it renders on top
    this.root.addChild(this.ball);
    this.root.addChild(this.burst);

    this.centreRoot();

    this.ball.onSettled = () => this.onBallSettled();

    this.tickFn = this.tick.bind(this);
    this.app.ticker.add(this.tickFn);
  }

  private wheelRadius(): number {
    return Math.min(this.app.screen.width, this.app.screen.height) * 0.42;
  }

  private centreRoot(): void {
    this.root.x = this.app.screen.width / 2;
    this.root.y = this.app.screen.height / 2;
  }

  private drawMarker(radius: number): void {
    const g = this.marker;
    g.clear();
    // Diamond/arrow pointing inward at 12 o'clock position (top of outer rim)
    const tip = -(radius + 14);
    const half = radius * 0.028;
    const height = radius * 0.065;
    g.moveTo(0, tip);
    g.lineTo(half, tip - height);
    g.lineTo(-half, tip - height);
    g.closePath();
    g.fill({ color: 0xffd700 });
    g.stroke({ color: 0xaa8800, width: 1 });
  }

  spin(): void {
    if (this.state !== 'IDLE') return;

    this.winningNumber = WHEEL_NUMBERS[Math.floor(Math.random() * WHEEL_NUMBERS.length)];
    this.winningPocketIndex = getPocketIndex(this.winningNumber);

    this.setState('SPINNING');
    this.emitter.emit('SPIN_START');

    const r = this.wheelRadius();
    this.wheel.spinTo(this.winningPocketIndex);

    this.ball.reset();
    this.ball.launch(r * 0.94, r);

    this.setState('BALL_MOVING');
  }

  private tick(ticker: { deltaMS: number }): void {
    const { deltaMS } = ticker;

    this.fpsTimer += deltaMS;
    if (this.fpsTimer >= this.fpsInterval) {
      this.emitter.emit('FPS_UPDATE', Math.round(this.app.ticker.FPS));
      this.fpsTimer = 0;
    }

    if (this.state === 'SPINNING' || this.state === 'BALL_MOVING') {
      const wheelDone = this.wheel.update(deltaMS);
      this.ball.update(deltaMS, wheelDone);
      this.burst.update(deltaMS);
    } else if (this.state === 'WIN') {
      this.burst.update(deltaMS);
    }
  }

  private onBallSettled(): void {
    const r = this.wheelRadius();
    // Ball settles at 12 o'clock — burst from there
    const px = 0;
    const py = -r * 0.875;
    this.burst.fire(px, py, 70);
    this.setState('WIN');
    this.emitter.emit('BALL_LANDED', this.winningNumber);
  }

  private setState(s: GameState): void {
    this.state = s;
    this.emitter.emit('STATE_CHANGE', s);
  }

  resetToIdle(): void {
    this.ball.reset();
    this.setState('IDLE');
  }

  resize(): void {
    this.centreRoot();
    const r = this.wheelRadius();
    this.wheel.resize(r);
    this.drawMarker(r);
  }

  destroy(): void {
    this.app.ticker.remove(this.tickFn);
    this.root.destroy({ children: true });
  }
}
