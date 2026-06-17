"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { safeParseJson } from "@/lib/storage";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueRef = useRef(initialValue);
  const [value, setValue] = useState<T>(initialValue);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setValue(safeParseJson<T>(window.localStorage.getItem(key), initialValueRef.current));
    setHasHydrated(true);
  }, [key]);

  const setStoredValue = useCallback(
    (nextValue: T | ((currentValue: T) => T)) => {
      setValue((currentValue) => {
        const resolvedValue =
          typeof nextValue === "function"
            ? (nextValue as (currentValue: T) => T)(currentValue)
            : nextValue;

        window.localStorage.setItem(key, JSON.stringify(resolvedValue));
        return resolvedValue;
      });
    },
    [key]
  );

  return [value, setStoredValue, hasHydrated] as const;
}
