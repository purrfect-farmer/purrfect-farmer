import { useLayoutEffect, useRef, useState } from "react";

import useFarmerContext from "./useFarmerContext";
import useMirroredCallback from "./useMirroredCallback";
import useStaticQuery from "./useStaticQuery";
import usePrompt from "./usePrompt";

export default function useTerminalFarmer() {
  const context = useFarmerContext();
  const userInputPrompt = usePrompt();

  const { id, title, instance, logger, isZooming, zoomies, processNextTask } =
    context;

  const referralLinkQuery = useStaticQuery({
    queryKey: [id, "referral-link"],
    queryFn: async () => {
      try {
        const link = await instance.getReferralLink();
        return link;
      } catch (err) {
        return null;
      }
    },
  });

  const referralLink = referralLinkQuery.data;

  const [started, setStarted] = useState();
  const scrollRef = useRef(null);
  const terminalRef = useRef();
  const controllerRef = useRef();

  const startedRef = useRef(started);
  startedRef.current = started;

  const [stopFarmer, dispatchAndStopFarmer] = useMirroredCallback(
    `${id}-stop`,
    () => {
      if (!startedRef.current) {
        return;
      }
      controllerRef.current?.abort();
      controllerRef.current = null;
      setStarted(false);
    },
    [id, instance, setStarted]
  );

  const [startFarmer, dispatchAndStartFarmer] = useMirroredCallback(
    `${id}-start`,
    () => {
      if (startedRef.current) {
        return;
      }
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      logger.clear();
      logger.info(`> Starting ${title} Farmer...`);
      instance.start(controller.signal).finally(() => {
        if (controllerRef.current === controller) {
          stopFarmer();
        }
      });

      setStarted(true);
    },
    [id, title, instance, logger, stopFarmer]
  );

  const [, dispatchAndToggleFarmer] = useMirroredCallback(
    `${id}-toggle`,
    (status) => {
      if (typeof status === "boolean") {
        return status ? startFarmer() : stopFarmer();
      } else if (!started) {
        return startFarmer();
      } else {
        return stopFarmer();
      }
    },
    [id, started, startFarmer, stopFarmer]
  );

  /** Configure Prompt */
  useLayoutEffect(() => {
    instance.setPromptFunctions({
      promptInput: userInputPrompt.prompt,
      promptAnswer: userInputPrompt.answer,
      promptCancel: userInputPrompt.cancel,
    });
  }, [instance, userInputPrompt]);

  /** Initialize Logger */
  useLayoutEffect(() => {
    logger.setElement(terminalRef.current);
    logger.setScrollElement(scrollRef.current);
    logger.success(`> ${title} Farmer Initiated`);
  }, [logger, title]);

  /** Auto Start in Zoomies */
  useLayoutEffect(() => {
    if (isZooming) {
      /** Set Quick Run */
      instance.setQuickRun(zoomies.quickRun);

      /** Start the farmer */
      startFarmer();

      /** Add Abort Listener */
      controllerRef.current?.signal?.addEventListener("abort", processNextTask);

      return () => {
        /** Remove Abort Listener */
        controllerRef.current?.signal?.removeEventListener(
          "abort",
          processNextTask
        );

        /** Abort */
        controllerRef.current?.abort();

        /** Reset Quick Run */
        instance.setQuickRun(false);
      };
    }
  }, [isZooming, zoomies.quickRun, startFarmer, processNextTask]);

  return {
    context,
    instance,
    referralLink,
    scrollRef,
    terminalRef,
    started,
    userInputPrompt,
    start: dispatchAndStartFarmer,
    stop: dispatchAndStopFarmer,
    toggle: dispatchAndToggleFarmer,
  };
}
