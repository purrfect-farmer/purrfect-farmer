import md5 from "md5";
import toast from "react-hot-toast";
import { delay } from "@/lib/utils";
import { useEffect } from "react";

import useYescoinAccountInfoQuery from "./useYescoinAccountInfoQuery";
import useYescoinCheckDailyMissionMutation from "./useYescoinCheckDailyMissionMutation";
import useYescoinClaimMissionMutation from "./useYescoinClaimMissionMutation";
import useYescoinClaimSignInMutation from "./useYescoinClaimSignInMutation";
import useYescoinClickDailyMissionMutation from "./useYescoinClickDailyMissionMutation";
import useYescoinDailyMissionQuery from "./useYescoinDailyMissionQuery";
import useYescoinSignInListQuery from "./useYescoinSignInListQuery";
import useYescoinWalletQuery from "./useYescoinWalletQuery";
import { getSignInKey } from "../lib/utils";

export default function useYescoinDailyCheckIn() {
  const dailyMissionQuery = useYescoinDailyMissionQuery();
  const signInListQuery = useYescoinSignInListQuery();
  const walletQuery = useYescoinWalletQuery();
  const accountInfoQuery = useYescoinAccountInfoQuery();

  const clickDailyMissionMutation = useYescoinClickDailyMissionMutation();
  const checkDailyMissionMutation = useYescoinCheckDailyMissionMutation();
  const claimMissionMutation = useYescoinClaimMissionMutation();
  const claimSignInMutation = useYescoinClaimSignInMutation();

  useEffect(() => {
    if (
      ![dailyMissionQuery.data, signInListQuery.data, walletQuery.data].every(
        Boolean
      )
    )
      return;

    (async function () {
      const checkIn = dailyMissionQuery.data.find(
        (item) => item.link === "CheckIn"
      );

      if (!checkIn || checkIn.missionStatus) {
        return;
      } else {
        /** Complete daily check-in mission */
        const completeDailyCheckInMission = async function () {
          /** Check */
          await checkDailyMissionMutation.mutateAsync(checkIn.missionId);
          await delay(3_000);

          /** Claim */
          await claimMissionMutation.mutateAsync(checkIn.missionId);
          await delay(3_000);

          /** Refetch Balance */
          await accountInfoQuery.refetch();
        };

        /** Yescoin Check In */
        const yescoinCheckIn = async function () {
          const list = signInListQuery.data;
          const address =
            walletQuery.data?.[0]?.friendlyAddress ||
            walletQuery.data?.[0]?.rawAddress;

          let day = list.find((item) => item.status);

          /** Click Daily Mission */
          await clickDailyMissionMutation.mutateAsync(checkIn.missionId);
          await delay(3000);

          if (day) {
            /** Set SignInType */
            day.signInType = 1;

            /** Get SignInKey */
            let signInKey = await getSignInKey();
            if (!signInKey) return;

            const time = Math.floor(Date.now() / 1000);
            const hash = md5(day.id + time + signInKey + day.signInType);

            const body = {
              id: day.id,
              createAt: Math.floor(Date.now() / 1000),
              signInType: day.signInType,
              destination: address || "",
            };

            const headers = { tm: time, sign: hash };

            /** Sign in */
            await claimSignInMutation.mutateAsync({ headers, body });
            await delay(3000);

            /** Complete the Mission */
            await completeDailyCheckInMission();
          } else {
            /** Complete the Mission */
            await completeDailyCheckInMission();
          }
        };

        toast.promise(yescoinCheckIn(), {
          loading: "Yescoin daily check-in...",
          error: "Error!",
          success: "Yescoin - Successfully checked-in!",
        });
      }
    })();
  }, [dailyMissionQuery.data, signInListQuery.data, walletQuery.data]);
}
