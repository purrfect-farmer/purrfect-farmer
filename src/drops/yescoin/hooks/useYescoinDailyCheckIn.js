import md5 from "md5";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";

import useYescoinClaimSignInMutation from "./useYescoinClaimSignInMutation";
import useYescoinSignInListQuery from "./useYescoinSignInListQuery";
import useYescoinWalletQuery from "./useYescoinWalletQuery";
import { getSignInKey } from "../lib/utils";

export default function useYescoinDailyCheckIn() {
  const signInListQuery = useYescoinSignInListQuery();
  const walletQuery = useYescoinWalletQuery();

  const claimSignInMutation = useYescoinClaimSignInMutation();

  useFarmerAsyncTask(
    "daily-check-in",
    () => {
      if ([signInListQuery.data, walletQuery.data].every(Boolean)) {
        const list = signInListQuery.data;
        const address =
          walletQuery.data?.[0]?.friendlyAddress ||
          walletQuery.data?.[0]?.rawAddress;

        const unclaimed = list.find((item) => item.status);

        if (unclaimed) {
          return async function () {
            /** Yescoin Check In */
            const yescoinCheckIn = async function () {
              const day = { ...unclaimed, signInType: 1 };

              /** Get SignInKey */
              const signInKey = await getSignInKey();

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
            };

            await toast.promise(yescoinCheckIn(), {
              loading: "Yescoin daily check-in...",
              error: "Error!",
              success: "Yescoin - Successfully checked-in!",
            });

            /** Refetch */
            await signInListQuery.refetch();
          };
        }
      }
    },
    [signInListQuery.data, walletQuery.data]
  );
}
