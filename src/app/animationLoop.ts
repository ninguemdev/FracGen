/** Receives the time in seconds since the loop started. */
export type FrameCallback = (time: number) => void;

/** Calls `onFrame` once per display refresh. Returns a function that stops the loop. */
export function startAnimationLoop(onFrame: FrameCallback): () => void {
  let startTime: number | undefined;
  let requestId = 0;

  const tick = (now: DOMHighResTimeStamp) => {
    startTime ??= now;
    onFrame((now - startTime) / 1000);
    requestId = requestAnimationFrame(tick);
  };

  requestId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(requestId);
}
