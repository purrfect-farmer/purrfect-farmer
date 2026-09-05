import { useCallback, useState } from "react";

import { getWalletAddressFromMnemonic } from "@purrfect/shared/lib/auto/wallet";
import { mnemonicNew } from "@ton/crypto";
import useAuto from "./useAuto";
import useAutoMaster from "./useAutoMaster";
import useFarmerCommandBus from "./useFarmerCommandBus";
import { useMutation } from "@tanstack/react-query";

export default function useAutoBoosterWithdrawMutation() {
  const { config } = useAuto();
  const { decryptPhrase } = useAutoMaster();
  const { send } = useFarmerCommandBus();
  const [steps, setSteps] = useState([]);

  const updateStep = useCallback(
    (id, patch) =>
      setSteps((prev) =>
        prev.map((step) => (step.id === id ? { ...step, ...patch } : step)),
      ),
    [],
  );

  const appendStep = useCallback(
    (step) => setSteps((prev) => [...prev, { status: "pending", ...step }]),
    [],
  );

  const runStep = useCallback(
    async (id, action) => {
      updateStep(id, { status: "running", message: null });

      try {
        const result = await action();
        updateStep(id, { status: "done", message: result?.message || null });
        return result;
      } catch (error) {
        updateStep(id, {
          status: "failed",
          message: error?.message || "Unknown error",
        });
        throw error;
      }
    },
    [updateStep],
  );

  const mutation = useMutation({
    mutationKey: [config.id, "booster-withdraw"],
    onError: (error) => {
      console.log("Error while withdrawing through a verified account", error);
    },
    mutationFn: async ({ account, verifiedAccount }) => {
      /** Sends a command and treats the farmer's own failure as a throw */
      const command = async ({ target, name, payload, label }) => {
        const result = await send({
          farmerId: config.farmerId,
          userId: target.userId,
          command: name,
          payload,
          label,
        });

        if (!result.status) {
          throw new Error(result.message || `${label} failed`);
        }

        return result;
      };

      /** Syncs `wallet` to `target`'s account */
      const connectWallet = ({ target, wallet, label }) =>
        command({
          target,
          name: "connect-wallet",
          payload: { phrase: wallet.phrase, version: wallet.version },
          label,
        });

      setSteps(
        [
          { id: "prepare", label: "Generating temporary wallet" },
          {
            id: "requester-temp",
            label: `Connecting temporary wallet to ${account.title}`,
          },
          {
            id: "verified-connect",
            label: `Connecting ${account.title}'s wallet to ${verifiedAccount.title}`,
          },
          {
            id: "withdraw",
            label: `Withdrawing from ${verifiedAccount.title}`,
          },
          {
            id: "restore-verified",
            label: `Restoring ${verifiedAccount.title}'s wallet`,
          },
          {
            id: "restore-requester",
            label: `Restoring ${account.title}'s wallet`,
          },
        ].map((step) => ({ ...step, status: "pending" })),
      );

      /**
       * Both real phrases are decrypted up front: a rollback needs them, and
       * failing a scrypt pass here costs nothing because no wallet has moved.
       */
      const { temporaryWallet, requesterWallet, verifiedWallet } =
        await runStep("prepare", async () => {
          const phrase = (await mnemonicNew()).join(" ");
          const address = await getWalletAddressFromMnemonic(
            phrase,
            account.version,
          );

          return {
            message: address,
            temporaryWallet: { phrase, version: account.version },
            requesterWallet: {
              phrase: await decryptPhrase(account.encryptedPhrase),
              version: account.version,
            },
            verifiedWallet: {
              phrase: await decryptPhrase(verifiedAccount.encryptedPhrase),
              version: verifiedAccount.version,
            },
          };
        });

      let requesterMoved = false;
      let verifiedMoved = false;

      /** Best-effort return of both accounts to their own wallets */
      const rollback = async () => {
        if (verifiedMoved) {
          appendStep({
            id: "rollback-verified",
            label: `Rollback — restoring ${verifiedAccount.title}'s wallet`,
          });

          try {
            await runStep("rollback-verified", () =>
              connectWallet({
                target: verifiedAccount,
                wallet: verifiedWallet,
                label: `${verifiedAccount.title} restore wallet`,
              }),
            );
            verifiedMoved = false;
          } catch {
            /* reported on the step itself */
          }
        }

        if (requesterMoved) {
          appendStep({
            id: "rollback-requester",
            label: `Rollback — restoring ${account.title}'s wallet`,
          });

          try {
            await runStep("rollback-requester", () =>
              connectWallet({
                target: account,
                wallet: requesterWallet,
                label: `${account.title} restore wallet`,
              }),
            );
            requesterMoved = false;
          } catch {
            /* reported on the step itself */
          }
        }
      };

      try {
        /** The requester releases its wallet */
        await runStep("requester-temp", async () => {
          const result = await connectWallet({
            target: account,
            wallet: temporaryWallet,
            label: `${account.title} connect temporary wallet`,
          });

          requesterMoved = true;
          return result;
        });

        /** The verified account picks it up */
        await runStep("verified-connect", async () => {
          const result = await connectWallet({
            target: verifiedAccount,
            wallet: requesterWallet,
            label: `${verifiedAccount.title} connect ${account.title}'s wallet`,
          });

          verifiedMoved = true;
          return result;
        });

        const withdrawal = await runStep("withdraw", () =>
          command({
            target: verifiedAccount,
            name: "withdraw",
            payload: { force: true, difference: 0 },
            label: `${verifiedAccount.title} withdraw`,
          }),
        );

        await runStep("restore-verified", async () => {
          const result = await connectWallet({
            target: verifiedAccount,
            wallet: verifiedWallet,
            label: `${verifiedAccount.title} restore wallet`,
          });

          verifiedMoved = false;
          return result;
        });

        await runStep("restore-requester", async () => {
          const result = await connectWallet({
            target: account,
            wallet: requesterWallet,
            label: `${account.title} restore wallet`,
          });

          requesterMoved = false;
          return result;
        });

        return {
          amount: withdrawal.amount,
          message: withdrawal.message,
        };
      } catch (error) {
        await rollback();
        throw error;
      }
    },
  });

  const reset = useCallback(() => {
    setSteps([]);
    mutation.reset();
  }, [mutation]);

  return { mutation, steps, reset };
}
