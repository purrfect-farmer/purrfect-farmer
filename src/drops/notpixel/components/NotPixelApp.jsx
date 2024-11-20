import * as Tabs from "@radix-ui/react-tabs";
import ReactTimeAgo from "react-time-ago";
import Slider from "@/components/Slider";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import toast from "react-hot-toast";
import useFarmerAsyncTask from "@/hooks/useFarmerAsyncTask";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketState from "@/hooks/useSocketState";
import useSocketTabs from "@/hooks/useSocketTabs";
import { CgSpinner } from "react-icons/cg";
import { cn, delayForSeconds } from "@/lib/utils";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import NotPixelIcon from "../assets/images/icon.png?format=webp&w=80";
import useNotPixelMiningClaimMutation from "../hooks/useNotPixelMiningClaimMutation";
import useNotPixelMiningStatusQuery from "../hooks/useNotPixelMiningStatusQuery";
import useNotPixelRepaintMutation from "../hooks/useNotPixelRepaintMutation";
import useNotPixelSecretWordMutation from "../hooks/useNotSecretWordMutation";

TimeAgo.addDefaultLocale(en);

export default function NotPixelApp({ diff, updatedAt }) {
  const tabs = useSocketTabs("notpixel.farmer-tabs", ["paint", "secrets"]);
  const miningQuery = useNotPixelMiningStatusQuery();
  const mining = miningQuery.data;

  const process = useProcessLock("notpixel.app");

  const [secretWord, setSecretWord, dispatchAndSetSecretWord] = useSocketState(
    "notpixel.secret-word",
    ""
  );

  const repaintMutation = useNotPixelRepaintMutation();
  const claimMiningMutation = useNotPixelMiningClaimMutation();
  const secretWordMutation = useNotPixelSecretWordMutation();

  /** Check Secret Word */
  const [checkSecretWord, dispatchAndCheckSecretWord] =
    useSocketDispatchCallback(
      "notpixel.check-secret-word",
      (word) => {
        if (!word) return;
        toast.promise(
          secretWordMutation
            .mutateAsync(word)
            .then((data) =>
              data.secretWord.success ? data : Promise.reject(data)
            ),
          {
            loading: "Checking...",
            success: "Success",
            error: "Error...",
          }
        );
      },
      []
    );

  const [farmingSpeed, , dispatchAndSetFarmingSpeed] = useSocketState(
    "notpixel.farming-speed",
    3
  );

  const [pixel, setPixel] = useState(null);

  const balance = useMemo(
    () => Math.floor(mining?.userBalance || 0),
    [mining?.userBalance]
  );

  useEffect(() => {
    setPixel(null);
  }, [process.started, setPixel]);

  /** Claim Mining */
  useFarmerAsyncTask(
    "mining",
    () => {
      if (mining)
        return (async function () {
          if (mining.fromStart >= mining.maxMiningTime) {
            const data = await claimMiningMutation.mutateAsync();

            /** Update Balance */
            miningQuery.updateQueryData((prev) => {
              return {
                ...prev,
                fromStart: 0,
                userBalance: prev.userBalance + data.claimed,
              };
            });

            /** Toast Message */
            toast.success(`Not Pixel - Claimed Mining +${data.claimed}`);
          }
        })();
    },
    [mining, miningQuery.updateQueryData]
  );

  /** Farmer */
  useEffect(() => {
    if (!process.canExecute) return;

    if (mining.charges < 1) {
      process.stop();
      return;
    }

    (async function () {
      /** Lock Process */
      process.lock();

      try {
        const pixel = diff[Math.floor(Math.random() * diff.length)];

        if (pixel) {
          setPixel(pixel);

          if (!process.controller.signal.aborted) {
            const data = await repaintMutation.mutateAsync({
              pixelId: pixel.pixelId,
              newColor: pixel.color,
            });

            /** Update Balance */
            miningQuery.updateQueryData((prev) => ({
              ...prev,
              charges: prev.charges - 1,
              userBalance: data.balance,
            }));

            /** Show Difference */
            toast.success(
              `+${Math.floor(data.balance - mining.userBalance)} - Not Pixel`
            );
          }
        }
      } catch {
        try {
          /** Update Balance */
          await miningQuery.refetch();
        } catch {}
      }

      /** Delay */
      await delayForSeconds(farmingSpeed);

      /** Reset Color */
      setPixel(null);

      /** Reset Mutation */
      repaintMutation.reset();

      /** Release Lock */
      process.unlock();
    })();
  }, [process, diff, farmingSpeed, mining]);

  /** AutoPaint */
  useFarmerAutoProcess("paint", !miningQuery.isLoading, process.start);

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 p-2">
        <img
          src={NotPixelIcon}
          alt="Not Pixel Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Not Pixel Farmer</h1>
      </div>

      <p className="text-center text-green-500">
        🛜 <ReactTimeAgo date={updatedAt} locale="en-US" timeStyle="twitter" />
      </p>

      {miningQuery.isSuccess ? (
        <>
          <h1 className="text-3xl text-center">
            {Intl.NumberFormat().format(balance)}
          </h1>
          <h2 className="text-center">Charges: {mining.charges}</h2>

          <Tabs.Root {...tabs.rootProps} className="flex flex-col gap-4">
            <Tabs.List className="grid grid-cols-2">
              {tabs.list.map((value, index) => (
                <Tabs.Trigger
                  key={index}
                  value={value}
                  className={cn(
                    "p-2",
                    "border-b-4 border-transparent",
                    "data-[state=active]:border-black"
                  )}
                >
                  {value.toUpperCase()}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <Tabs.Content
              forceMount
              className="data-[state=inactive]:hidden"
              value="paint"
            >
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => process.dispatchAndToggle(!process.started)}
                  disabled={mining.charges < 1}
                  className={cn(
                    "text-white px-4 py-2 rounded-lg disabled:opacity-50",
                    !process.started ? "bg-black" : "bg-red-500"
                  )}
                >
                  {!process.started ? "Start Farming" : "Stop Farming"}
                </button>

                {/* Farming Speed */}
                <div className="flex flex-col gap-1">
                  {/* Speed Control */}
                  <Slider
                    value={[farmingSpeed]}
                    min={0}
                    max={15}
                    step={0.5}
                    onValueChange={([value]) =>
                      dispatchAndSetFarmingSpeed(Math.max(0.5, value))
                    }
                    trackClassName="bg-neutral-200"
                    rangeClassName="bg-neutral-900"
                    thumbClassName="bg-neutral-900"
                  />

                  {/* Speed Display */}
                  <div className="text-center">
                    Painting Speed:{" "}
                    <span className="font-bold">{farmingSpeed}s</span>
                  </div>
                </div>

                {process.started ? (
                  <>
                    <div className="flex flex-col items-center justify-center gap-2 ">
                      {/* Color */}
                      {pixel ? (
                        <>
                          <div className="flex flex-col w-full gap-1 p-4 font-bold bg-black rounded-lg">
                            <p className="text-blue-500">
                              Pixel ID: {pixel.pixelId}
                            </p>
                            <p className="text-rose-500">
                              Offset: {pixel.offset}
                            </p>
                            <p className="text-green-500">
                              Color: {pixel.color}
                            </p>
                            <p className="text-pink-500">X: {pixel.x}</p>
                            <p className="text-orange-500">Y: {pixel.y}</p>
                            <p className="text-purple-500">
                              Position-X: {pixel.positionX}
                            </p>
                            <p className="text-lime-500">
                              Position-Y: {pixel.positionY}
                            </p>
                          </div>

                          {/* Box Color */}
                          <div
                            className="w-full h-10 border rounded-lg"
                            style={{ backgroundColor: pixel.color }}
                          />
                        </>
                      ) : null}

                      <div
                        className={cn(
                          "text-center font-bold",
                          {
                            pending: "text-orange-500",
                            success: "text-green-500",
                            error: "text-red-500",
                          }[repaintMutation.status]
                        )}
                      >
                        {
                          {
                            idle: "Waiting...",
                            pending: "Painting...",
                            success: "Painted! Refetching...",
                            error: "Error..",
                          }[repaintMutation.status]
                        }
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </Tabs.Content>
            <Tabs.Content
              forceMount
              className="data-[state=inactive]:hidden"
              value="secrets"
            >
              <div className="flex flex-col gap-2">
                {/* Secret Word Input */}
                <input
                  className={cn(
                    "outline-0",
                    "rounded-lg",
                    "border border-black",
                    "focus:ring focus:ring-neutral-500",
                    "placeholder:text-neutral-600",
                    "px-4 py-2"
                  )}
                  onChange={(ev) => dispatchAndSetSecretWord(ev.target.value)}
                  value={secretWord}
                  placeholder="Secret Word"
                />
                {/* Check Button */}
                <button
                  className={cn(
                    "text-white px-4 py-2 rounded-lg disabled:opacity-50",
                    "bg-black"
                  )}
                  onClick={() => dispatchAndCheckSecretWord(secretWord)}
                >
                  Check
                </button>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </>
      ) : (
        <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
      )}
    </div>
  );
}
