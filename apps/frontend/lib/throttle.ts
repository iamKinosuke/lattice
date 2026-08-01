export function throttle(
  intervalMs: number,
  fn: () => void,
): { call: () => void; cancel: () => void } {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const run = () => {
    last = performance.now();
    timer = null;
    fn();
  };

  return {
    call() {
      if (timer) return;

      const wait = intervalMs - (performance.now() - last);
      if (wait <= 0) {
        run();
        return;
      }

      timer = setTimeout(run, wait);
    },

    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
    },
  };
}
