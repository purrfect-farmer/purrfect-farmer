import { useLayoutEffect, useRef, useState } from "react";

import useAppContext from "./useAppContext";
import { useEffect } from "react";
import useFarmerContext from "./useFarmerContext";
import useMirroredCallback from "./useMirroredCallback";
import usePrimaryFarmerLink from "./usePrimaryFarmerLink";
import usePrompt from "./usePrompt";
import useRefCallback from "./useRefCallback";
import useStaticQuery from "./useStaticQuery";
import useSyncedRef from "./useSyncedRef";

export default function useTerminalFarmer() {
  const app = useAppContext();
  const context = useFarmerContext();
  const userInputPrompt = usePrompt();

  const { account, dispatchToSetPrimaryFarmerLink } = app;
  const {
    id,
    title,
    farmer,
    external,
    instance,
    logger,
    isZooming,
    zoomies,
    processNextTask,
  } = context;

  const { FarmerClass } = farmer;

  /** Should store primary link */
  const shouldStorePrimaryLink = account.isPrimary && !external;

  /** Primary farmer link */
  const { storePrimaryFarmerLink } = usePrimaryFarmerLink(FarmerClass.id);

  const [started, setStarted] = useState();
  const terminalRef = useRef();
  const controllerRef = useRef();
  const startedRef = useSyncedRef(started);

  /** Referral link query */
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

  /** Referral link */
  const referralLink = referralLinkQuery.data;

  /** Dispatch the primary farmer link */
  const dispatchPrimaryFarmerLink = useRefCallback(
    (link) => dispatchToSetPrimaryFarmerLink(FarmerClass.id, link),
    [FarmerClass.id, dispatchToSetPrimaryFarmerLink],
  );

  /** Stop farmer */
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
    [id, instance, setStarted],
  );

  /** Start farmer */
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
    [id, title, instance, logger, stopFarmer],
  );

  /** Toggle farmer */
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
    [id, started, startFarmer, stopFarmer],
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
          processNextTask,
        );

        /** Abort */
        controllerRef.current?.abort();

        /** Reset Quick Run */
        instance.setQuickRun(false);
      };
    }
  }, [isZooming, zoomies.quickRun, startFarmer, processNextTask]);

  /** Store primary link */
  useEffect(() => {
    if (referralLink && shouldStorePrimaryLink) {
      console.log("Storing primary farmer link:", {
        id: FarmerClass.id,
        link: referralLink,
      });
      storePrimaryFarmerLink(referralLink);
      dispatchPrimaryFarmerLink(referralLink);
    }
  }, [
    FarmerClass.id,
    referralLink,
    shouldStorePrimaryLink,
    storePrimaryFarmerLink,
    dispatchPrimaryFarmerLink,
  ]);

  return {
    context,
    instance,
    referralLink,
    terminalRef,
    started,
    userInputPrompt,
    start: dispatchAndStartFarmer,
    stop: dispatchAndStopFarmer,
    toggle: dispatchAndToggleFarmer,
  };
}
