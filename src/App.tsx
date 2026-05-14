import { useRoulette } from './hooks/useRoulette';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import styles from './App.module.css';

export default function App() {
  const { canvasRef, emitter, spin, resetToIdle } = useRoulette();

  return (
    <div className={styles.layout}>
      <div className={styles.canvasArea}>
        <GameCanvas canvasRef={canvasRef} />
      </div>
      <HUD emitter={emitter} onSpin={spin} onReset={resetToIdle} />
    </div>
  );
}
