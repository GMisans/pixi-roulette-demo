# Pixi.js Roulette Wheel

A European roulette demo built as a portfolio piece for my application to **Evolution Gaming**.

**Live demo:** _[deploy to GitHub Pages and add link here]_

---

## Why I built this

Evolution Gaming explicitly uses React for UI and Pixi.js for 2D canvas rendering. This project is my way of demonstrating that I understand *why* that split exists — not just that I can wire two libraries together.

---

## Architecture

### React owns the DOM. Pixi owns the canvas. They never cross.

```
React layer (DOM)          EventEmitter          Pixi layer (WebGL canvas)
─────────────────          ────────────          ────────────────────────
HUD.tsx                        ←→                GameScene.ts
  spin button                SPIN_START           Wheel.ts
  result display             BALL_LANDED          Ball.ts
  fps counter                STATE_CHANGE         ParticleBurst.ts
  state label                FPS_UPDATE
```

The `eventemitter3` package is the seam. React emits `SPIN_START` (via the hook) and listens to `BALL_LANDED`, `STATE_CHANGE`, `FPS_UPDATE`. Pixi listens to `SPIN_START` and emits the rest. Neither layer holds a reference to the other.

**Why React for the HUD?**
React is the right tool for reactive UI — state changes, conditional rendering, accessibility. Trying to manage a DOM-based HUD inside Pixi (via Pixi's HTMLText or a separate DOM layer) means managing two render cycles manually. React already does this for free.

**Why Pixi for the canvas?**
CSS animation is declarative and great for layout-adjacent effects. But a physics-adjacent simulation — a spinning wheel, a ball decelerating along a curve, 70 simultaneous fading particles — needs frame-level control. Pixi's Ticker gives you `deltaMS` on every frame, GPU-batched draw calls, and a scene graph. You can't replicate that in CSS without fighting the browser.

**Why eventemitter3?**
It's tiny (< 3KB), typed, and has zero opinions about your framework. It keeps the boundary explicit: you have to *decide* what crosses it.

---

## What surprised me about Pixi vs CSS animation

**The rendering model is different in kind, not just degree.** In CSS you describe *what state things should be in* and the browser interpolates. In Pixi you describe *what to draw, every frame*. That means `Graphics.clear()` followed by re-drawing isn't a hack — it's the idiom. The first time I saw a `clear()` inside a tick loop I thought I was reading a bug; I wasn't.

**Ticker vs rAF.** Pixi's `Ticker` isn't just a wrapper around `requestAnimationFrame`. It provides `deltaMS` (capped and corrected), shared scheduling across all objects, and it integrates with Pixi's shared render loop so your logic update and the GPU draw happen in the right order without you thinking about it. Rolling your own `rAF` loop for a Pixi scene is both redundant and risky.

**Sprite batching matters more than I expected.** `Graphics` objects each have their own draw call unless you're careful. For the particle burst I batch all 70 particles into a single `Graphics` instance and redraw them all in one `clear()/fill()` loop per frame. Switching to 70 individual `Graphics` objects showed an immediate FPS drop in dev tools.

---

## What I'd do differently

- **Object pooling for particles.** Currently `emit()` allocates a fresh array on every burst. At 60 fps the GC pressure doesn't matter here, but in a real game scene with many concurrent effects you'd pool and reuse particle objects.
- **Use `RenderTexture` for the static wheel.** The wheel geometry doesn't change between spins; redrawing it on resize is wasteful. Rendering it once to a `RenderTexture` and then spinning a `Sprite` would be cheaper and sharper.
- **Separate resize from init.** The current `useRoulette` hook creates the Pixi app at the container's initial size. A `ResizeObserver` should drive `app.renderer.resize()` and `GameScene.resize()` on container changes.
- **Accessibility.** The canvas is opaque to screen readers. The winning number is announced via the React HUD, but a proper implementation would add `aria-live` to the result region.
- **Proper physics.** The ball trajectory is animated with easing functions, not physics. A real roulette simulation would model angular momentum, friction, and the deflection geometry of the frets.

---

## Local setup

```bash
git clone <your-repo-url>
cd roulette-demo
npm install
npm run dev
```

Open `http://localhost:5173`.

**Build for GitHub Pages:**

```bash
npm run build
# dist/ is ready to deploy
```

The `vite.config.ts` sets `base: './'` so asset paths resolve correctly under a GitHub Pages subdirectory.

---

## Project structure

```
src/
  main.tsx                      React root
  App.tsx                       Layout — mounts canvas + HUD side by side
  App.module.css
  index.css                     Global reset
  hooks/
    useRoulette.ts              Initialises Pixi once (strict-mode safe), returns ref + emitter
  components/
    GameCanvas.tsx              Mounts Pixi canvas via ref — zero logic
    GameCanvas.module.css
    HUD.tsx                     Spin button, result, fps, state label — pure React
    HUD.module.css
  game/
    GameScene.ts                Composes Wheel + Ball + Burst, owns the state machine
    events.ts                   Typed event map (RouletteEvents interface)
    objects/
      Wheel.ts                  37-pocket wheel, draws with Graphics API, spins via easeOutQuart
      Ball.ts                   Orbit -> drop -> bounce phases, all driven by Ticker deltaMS
      ParticleBurst.ts          70-particle burst, batched into one Graphics per frame
    utils/
      easing.ts                 Pure easing functions (easeOutQuart, easeOutCubic, easeOutBounce)
      constants.ts              WHEEL_NUMBERS, RED_NUMBERS, pocket helpers
```
