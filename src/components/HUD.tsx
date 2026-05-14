import { useState, useEffect } from 'react';
import EventEmitter from 'eventemitter3';
import type { RouletteEvents, GameState } from '../game/events';
import styles from './HUD.module.css';

interface Props {
  emitter: EventEmitter<RouletteEvents>;
  onSpin: () => void;
  onReset: () => void;
}

const STATE_LABELS: Record<GameState, string> = {
  IDLE: 'Place Your Bet',
  SPINNING: 'Wheel Spinning...',
  BALL_MOVING: 'Ball In Motion',
  WIN: 'Winner!',
};

const NUMBER_COLORS: Record<'red' | 'black' | 'green', string> = {
  red: '#c0392b',
  black: '#1a1a1a',
  green: '#1a7c3e',
};

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

function getNumberColor(n: number): string {
  if (n === 0) return NUMBER_COLORS.green;
  return RED_NUMBERS.has(n) ? NUMBER_COLORS.red : NUMBER_COLORS.black;
}

export function HUD({ emitter, onSpin, onReset }: Props) {
  const [state, setState] = useState<GameState>('IDLE');
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const onStateChange = (s: GameState) => setState(s);
    const onBallLanded = (n: number) => setWinningNumber(n);
    const onFpsUpdate = (f: number) => setFps(f);

    emitter.on('STATE_CHANGE', onStateChange);
    emitter.on('BALL_LANDED', onBallLanded);
    emitter.on('FPS_UPDATE', onFpsUpdate);

    return () => {
      emitter.off('STATE_CHANGE', onStateChange);
      emitter.off('BALL_LANDED', onBallLanded);
      emitter.off('FPS_UPDATE', onFpsUpdate);
    };
  }, [emitter]);

  const canSpin = state === 'IDLE';
  const showReset = state === 'WIN';

  return (
    <div className={styles.hud}>
      <div className={styles.header}>
        <h1 className={styles.title}>Roulette</h1>
        <span className={styles.fps}>{fps} FPS</span>
      </div>

      <div className={styles.stateLabel}>{STATE_LABELS[state]}</div>

      <div className={styles.resultArea}>
        {winningNumber !== null && state === 'WIN' ? (
          <div
            className={styles.winNumber}
            style={{ backgroundColor: getNumberColor(winningNumber) }}
          >
            {winningNumber}
          </div>
        ) : (
          <div className={styles.winNumberPlaceholder}>—</div>
        )}
      </div>

      <div className={styles.buttonRow}>
        {!showReset ? (
          <button
            className={styles.spinButton}
            onClick={onSpin}
            disabled={!canSpin}
          >
            {canSpin ? 'SPIN' : '...'}
          </button>
        ) : (
          <button className={styles.resetButton} onClick={onReset}>
            Spin Again
          </button>
        )}
      </div>

      <div className={styles.footer}>
        <span>European Roulette · 37 pockets</span>
      </div>
    </div>
  );
}
