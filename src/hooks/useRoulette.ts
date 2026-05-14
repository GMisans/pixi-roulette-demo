import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import EventEmitter from 'eventemitter3';
import { GameScene } from '../game/GameScene';
import type { RouletteEvents } from '../game/events';

export interface RouletteHandle {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  emitter: EventEmitter<RouletteEvents>;
  spin: () => void;
  resetToIdle: () => void;
}

export function useRoulette(): RouletteHandle {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const emitterRef = useRef<EventEmitter<RouletteEvents>>(
    new EventEmitter<RouletteEvents>(),
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const container = canvasRef.current;
    const { width, height } = container.getBoundingClientRect();
    // cancelled becomes true when the effect cleanup runs before init resolves
    let cancelled = false;

    const app = new Application();

    let observer: ResizeObserver | null = null;

    app
      .init({
        width: width || 600,
        height: height || 600,
        backgroundColor: 0x0d1b2a,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      .then(() => {
        if (cancelled) {
          app.destroy(true);
          return;
        }
        appRef.current = app;
        container.appendChild(app.canvas);
        sceneRef.current = new GameScene(app, emitterRef.current);

        observer = new ResizeObserver(() => {
          const r = container.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          appRef.current?.renderer.resize(r.width, r.height);
          sceneRef.current?.resize();
        });
        observer.observe(container);
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      sceneRef.current?.destroy();
      sceneRef.current = null;
      appRef.current?.destroy(true);
      appRef.current = null;
    };
  }, []);

  const spin = () => sceneRef.current?.spin();
  const resetToIdle = () => sceneRef.current?.resetToIdle();

  return {
    canvasRef,
    emitter: emitterRef.current,
    spin,
    resetToIdle,
  };
}
