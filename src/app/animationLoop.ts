/** Receives the seconds elapsed since the previous frame (0 on the first frame). */
export type FrameCallback = (deltaTime: number) => void;

// rAF pauses while the tab is hidden; capping the first step afterwards keeps animations
// from jumping ahead by the whole time the tab was away.
const MAX_DELTA_TIME = 0.1;

/** Calls `onFrame` once per display refresh. Returns a function that stops the loop. */
export function startAnimationLoop(onFrame: FrameCallback): () => void {
  let previousTime: number | undefined;
  let requestId = 0;

  const tick = (now: DOMHighResTimeStamp) => {
    const deltaTime = previousTime === undefined ? 0 : (now - previousTime) / 1000;
    previousTime = now;
    onFrame(Math.min(deltaTime, MAX_DELTA_TIME));
    requestId = requestAnimationFrame(tick);
  };

  requestId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(requestId);
}
