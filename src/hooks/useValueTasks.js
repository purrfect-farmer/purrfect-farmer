import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import { useCallback } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useAppContext from "./useAppContext";
import useSocketHandlers from "./useSocketHandlers";

export default function useValueTasks(key) {
  const { socket } = useAppContext();
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
  const [, dispatchAndPrompt] = useSocketDispatchCallback(
    /** Main */
    useCallback(
      (id) =>
        new Promise((resolve, reject) => {
          setValuePrompt({
            id,
            callback: resolve,
          });
        }),
      [setValuePrompt]
    ),

    /** Dispatch to Retrieve it from Others */
    useCallback(
      (socket, id) => {
        socket.dispatch({
          action: `${key}.get`,
          data: {
            id,
          },
        });
      },
      [key]
    )
  );

  /** Handle value Prompt Submit */
  const [submitPrompt, dispatchAndSubmitPrompt] = useSocketDispatchCallback(
    /** Main */
    useCallback(
      (value) => {
        if (!valuePrompt) return;

        const { callback } = valuePrompt;

        setValuePrompt(null);
        callback(value);
      },
      [valuePrompt, setValuePrompt]
    ),

    /** Dispatch */
    useCallback(
      (socket, value) => {
        if (!valuePrompt) return;

        const { id } = valuePrompt;

        /** Dispatch for others to store */
        socket.dispatch({
          action: `${key}.store`,
          data: {
            id,
            value,
          },
        });
      },
      [key, valuePrompt]
    )
  );

  /** Get Value Request */
  const handleGetValueRequest = useCallback(
    (id) => {
      getResolvedValue(id).then((value) => {
        if (value) {
          /** Dispatch for others to store */
          socket.dispatch({
            action: `${key}.store`,
            data: {
              id,
              value,
            },
          });
        }
      });
    },
    [key, socket, getResolvedValue]
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

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        [`${key}.get`]: (command) => {
          handleGetValueRequest(command.data.id);
        },
        [`${key}.store`]: (command) => {
          handleStoreValueRequest(command.data.id, command.data.value);
        },
      }),
      [key, handleGetValueRequest, handleStoreValueRequest]
    )
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
