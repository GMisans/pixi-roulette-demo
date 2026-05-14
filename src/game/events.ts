export type GameState = 'IDLE' | 'SPINNING' | 'BALL_MOVING' | 'WIN';

export interface RouletteEvents {
  SPIN_START: () => void;
  BALL_LANDED: (number: number) => void;
  STATE_CHANGE: (state: GameState) => void;
  FPS_UPDATE: (fps: number) => void;
}
