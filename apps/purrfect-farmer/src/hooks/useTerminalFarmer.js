import { useLayoutEffect, useRef, useState } from "react";

import { customLogger } from "@/utils";
import toast from "react-hot-toast";
import useAppContext from "./useAppContext";
import { useEffect } from "react";
import useFarmerContext from "./useFarmerContext";
import useMirroredCallback from "./useMirroredCallback";
import usePrimaryFarmerLink from "./usePrimaryFarmerLink";
import usePrimaryFarmerUserIdId from "./usePrimaryFarmerUserId";
import usePrompt from "./usePrompt";
import useRefCallback from "./useRefCallback";
import useStaticQuery from "./useStaticQuery";
import useStorageState from "./useStorageState";
import useSyncedRef from "./useSyncedRef";

export default function useTerminalFarmer() {
  const app = useAppContext();
  const context = useFarmerContext();
  const userInputPrompt = usePrompt();

  const {
    account,
    dispatchToSetPrimaryFarmerLink,
    dispatchToSetPrimaryFarmerUserId,
  } = app;

  const {
    id,
    title,
    FarmerClass,
    external,
    instance,
    logger,
    isZooming,
    zoomies,
    processNextTask,
  } = context;

  /** Primary farmer user ID */
  const { primaryFarmerUserId, storePrimaryFarmerUserId } =
    usePrimaryFarmerUserIdId(FarmerClass.id);

  /** Primary farmer link */
  const { primaryFarmerLink, storePrimaryFarmerLink } = usePrimaryFarmerLink(
    FarmerClass.id,
  );

  /** Instance user ID */
  const instanceUserId = instance.getUserId();

  /** Is Primary user */
  const isPrimaryFarmerUser = primaryFarmerUserId
    ? primaryFarmerUserId === instanceUserId
    : account.isPrimary;

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

  /**  Storage of Referral Link */
  const { value: currentReferralLink, storeValue: storeReferralLink } =
    useStorageState(`farmer-referral-link:${id}`, null);

  /** Dispatch the primary farmer link */
  const dispatchPrimaryFarmerLink = useRefCallback(
    (link) => dispatchToSetPrimaryFarmerLink(FarmerClass.id, link),
    [FarmerClass.id, dispatchToSetPrimaryFarmerLink],
  );

  /** Dispatch the primary farmer user ID */
  const dispatchPrimaryFarmerUserId = useRefCallback(
    (userId) => dispatchToSetPrimaryFarmerUserId(FarmerClass.id, userId),
    [FarmerClass.id, dispatchToSetPrimaryFarmerUserId],
  );

  /** Make as primary farmer account */
  const makeAsPrimaryFarmerUser = useRefCallback(() => {
    storePrimaryFarmerUserId(instanceUserId);
    dispatchPrimaryFarmerUserId(instanceUserId);
    toast.success(`Updated user as primary for ${FarmerClass.title} Farmer`);
  }, [
    FarmerClass.title,
    instanceUserId,
    storePrimaryFarmerUserId,
    dispatchPrimaryFarmerUserId,
  ]);

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
    if (referralLink && isPrimaryFarmerUser) {
      console.log("Storing primary farmer link:", {
        id: FarmerClass.id,
        link: referralLink,
      });
      /** Store and dispatch the primary farmer link */
      storePrimaryFarmerLink(referralLink);
      dispatchPrimaryFarmerLink(referralLink);

      /** Store and dispatch the primary farmer user ID */
      storePrimaryFarmerUserId(instanceUserId);
      dispatchPrimaryFarmerUserId(instanceUserId);
    }
  }, [
    FarmerClass.id,
    referralLink,
    instanceUserId,
    isPrimaryFarmerUser,
    storePrimaryFarmerLink,
    storePrimaryFarmerUserId,
    dispatchPrimaryFarmerLink,
    dispatchPrimaryFarmerUserId,
  ]);

  /** Store Referral Link */
  useEffect(() => {
    /** Log Link */
    customLogger(`${id.toUpperCase()} - REFERRAL LINK`, referralLink);

    if (referralLink && referralLink !== currentReferralLink) {
      storeReferralLink(referralLink);
    }
  }, [id, referralLink, currentReferralLink, storeReferralLink]);

  /** Log info */
  useEffect(() => {
    customLogger(`${title} Farmer - Info`, {
      instanceUserId,
      primaryFarmerUserId,
      primaryFarmerLink,
      referralLink,
      currentReferralLink,
      isPrimaryFarmerUser,
    });
  }, [
    title,
    instanceUserId,
    primaryFarmerUserId,
    primaryFarmerLink,
    referralLink,
    currentReferralLink,
    isPrimaryFarmerUser,
  ]);

  return {
    external,
    context,
    instance,
    referralLink,
    terminalRef,
    started,
    userInputPrompt,
    isPrimaryFarmerUser,
    primaryFarmerUserId,
    makeAsPrimaryFarmerUser,
    storePrimaryFarmerUserId,
    start: dispatchAndStartFarmer,
    stop: dispatchAndStopFarmer,
    toggle: dispatchAndToggleFarmer,
  };
}
