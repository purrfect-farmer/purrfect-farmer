import { useCallback } from "react";
import { useMemo } from "react";

export default function useMapState() {
  /** Map */
  const map = useMemo(() => new Map(), []);

  /** Set map items */
  const addMapItems = useCallback(
    (items) => {
      Object.entries(items).forEach(([k, v]) => map.set(k, v));
    },
    [map]
  );

  /** Remove map items */
  const removeMapItems = useCallback(
    (items) => {
      Object.keys(items).forEach((k) => map.delete(k));
    },
    [map]
  );

  return useMemo(
    () => ({ map, addMapItems, removeMapItems }),
    [map, addMapItems, removeMapItems]
  );
}
