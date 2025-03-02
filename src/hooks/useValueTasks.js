import useMirroredCallback from "@/hooks/useMirroredCallback";
import { useCallback } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useAppContext from "./useAppContext";

export default function useValueTasks(key) {
  const { mirror } = useAppContext();
  const [valuePrompt, setValuePrompt] = useState(null);

  /** Get stored values */
  const getValues = useCallback(
    () =>
      new Promise((res, rej) => {
        chrome?.storage?.local
          .get(key)
          .then((settings) => res(settings[key] || {}))
          .catch(rej);
      }),
    [key]
  );

  /** Get a resolved value */
  const getResolvedValue = useCallback(
    (id) =>
      new Promise((res, rej) => {
        getValues()
          .then((values) => res(values[id]))
          .catch(rej);
      }),
    [getValues]
  );

  /** Store a resolved value */
  const storeResolvedValue = useCallback(
    (id, value) =>
      new Promise((res, rej) => {
        getValues()
          .then((values) => {
            /** New Values */
            const newValues = { ...values };

            /** Set Id Value */
            newValues[id] = value;

            /** Update the values */
            chrome?.storage?.local
              .set({
                [key]: newValues,
              })
              .then(res)
              .catch(rej);
          })
          .catch(rej);
      }),
    [key, getValues]
  );

  /** Remove Value */
  const removeResolvedValue = useCallback(
    (id) =>
      new Promise((resolve, reject) => {
        getValues()
          .then((values) => {
            const newValues = { ...values };

            /** Remove Id */
            delete newValues[id];

            /** Update the values */
            chrome?.storage?.local
              .set({
                [key]: newValues,
              })
              .then(resolve)
              .catch(reject);
          })
          .catch(reject);
      }),
    [key, getValues]
  );

  /** Prompt Value */
  const [, dispatchAndPrompt] = useMirroredCallback(
    key + ":prompt",
    (id) =>
      new Promise((resolve, reject) => {
        setValuePrompt({
          id,
          callback: resolve,
        });
      }),
    [setValuePrompt]
  );

  /** Handle value Prompt Submit */
  const [submitPrompt, dispatchAndSubmitPrompt] = useMirroredCallback(
    key + ":submit",
    (value) => {
      if (!valuePrompt) return;

      const { callback } = valuePrompt;

      setValuePrompt(null);
      callback(value);
    },
    [valuePrompt, setValuePrompt]
  );

  /** Get Value Request */
  const handleGetValueRequest = useCallback(
    (id) => {
      getResolvedValue(id).then((value) => {
        if (value) {
          /** Dispatch for others to store */
          mirror.dispatch({
            action: `${key}.store`,
            data: {
              id,
              value,
            },
          });
        }
      });
    },
    [key, mirror.dispatch, getResolvedValue]
  );

  /** Store Value Request */
  const handleStoreValueRequest = useCallback(
    (id, value) => {
      /** Store value */
      storeResolvedValue(id, value);

      /** Compare current prompt */
      if (valuePrompt && valuePrompt.id === id) {
        submitPrompt(value);
      }
    },
    [valuePrompt, storeResolvedValue, submitPrompt]
  );

  return useMemo(
    () => ({
      valuePrompt,
      dispatchAndPrompt,
      dispatchAndSubmitPrompt,
      getResolvedValue,
      removeResolvedValue,
    }),
    [
      valuePrompt,
      dispatchAndPrompt,
      dispatchAndSubmitPrompt,
      getResolvedValue,
      removeResolvedValue,
    ]
  );
}
