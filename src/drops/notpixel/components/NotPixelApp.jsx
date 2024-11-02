import ReactTimeAgo from "react-time-ago";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import toast from "react-hot-toast";
import useProcessLock from "@/hooks/useProcessLock";
import { CgSpinner } from "react-icons/cg";
import { cn, delayForSeconds } from "@/lib/utils";
import { useMemo } from "react";
import { useEffect } from "react";
import { useState } from "react";

import NotPixelIcon from "../assets/images/icon.png?format=webp&w=80";
import useNotPixelMiningClaimMutation from "../hooks/useNotPixelMiningClaimMutation";
import useNotPixelMiningStatusQuery from "../hooks/useNotPixelMiningStatusQuery";
import useNotPixelRepaintMutation from "../hooks/useNotPixelRepaintMutation";
import useSocketState from "@/hooks/useSocketState";
import Slider from "@/components/Slider";

TimeAgo.addDefaultLocale(en);

export default function NotPixelApp({ diff, updatedAt }) {
  const miningQuery = useNotPixelMiningStatusQuery();
  const mining = miningQuery.data;

  const process = useProcessLock("notpixel.repaint.auto");

  const repaintMutation = useNotPixelRepaintMutation();
  const claimMiningMutation = useNotPixelMiningClaimMutation();

  const [farmingSpeed, , dispatchAndSetFarmingSpeed] = useSocketState(
    "notpixel.farming-speed",
    10
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
  useEffect(() => {
    if (!mining) return;

    (async function () {
      if (mining.fromStart >= mining.maxMiningTime) {
        await claimMiningMutation.mutateAsync();
        toast.success("Not Pixel - Claimed Mining");
      }
    })();
  }, [mining]);

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

          if (!process.signal.aborted) {
            const data = await repaintMutation.mutateAsync({
              pixelId: pixel.pixelId,
              newColor: pixel.color,
            });

            /** Show Difference */
            toast.success(`+${Math.floor(data.balance - mining.userBalance)}`);

            /** Update Balance */
            await miningQuery.refetch();
          }
        }
      } catch {}

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
              Painting Speed: <span className="font-bold">{farmingSpeed}s</span>
            </div>
          </div>

          {process.started ? (
            <>
              <div className="flex flex-col items-center justify-center gap-2 ">
                {/* Color */}
                {pixel ? (
                  <>
                    <div className="flex flex-col w-full gap-1 p-4 font-bold bg-black rounded-lg">
                      <p className="text-blue-500">Pixel ID: {pixel.pixelId}</p>
                      <p className="text-rose-500">Offset: {pixel.offset}</p>
                      <p className="text-green-500">Color: {pixel.color}</p>
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
        </>
      ) : (
        <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
      )}
    </div>
  );
}
