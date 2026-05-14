import styles from './GameCanvas.module.css';

interface Props {
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export function GameCanvas({ canvasRef }: Props) {
  return (
    <div
      ref={canvasRef}
      className={styles.canvas}
      aria-label="Roulette wheel canvas"
    />
  );
}
