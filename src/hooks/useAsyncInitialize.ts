import { useEffect, useState } from "react";

export function useAsyncInitialize<T>(func: () => Promise<T>) {
  const [state, setState] = useState<T | undefined>();

  useEffect(() => {
    let active = true;

    void func().then((value) => {
      if (active) setState(value);
    });

    return () => {
      active = false;
    };
  }, [func]);

  return state;
}
