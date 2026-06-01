import { useCallback, useEffect, useRef } from "react";

export function useDebouncedCallback<T extends (...args: never[]) => void>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay],
  );
}
