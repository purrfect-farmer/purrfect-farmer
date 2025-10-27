import LabelToggle from "@/components/LabelToggle";
import PrimaryButton from "@/components/PrimaryButton";
import farmers from "@/core/farmers";
import useAppContext from "@/hooks/useAppContext";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useMirroredState from "@/hooks/useMirroredState";
import { Rating } from "@smastrom/react-rating";
import { useMemo } from "react";
import { useState } from "react";
import { memo } from "react";

function HeadlessPicker() {
  const { settings, startHeadlessMode } = useAppContext();
  const [rating, setRating, dispatchAndSetRating] = useMirroredState(
    "headless-picker.rating",
    settings.farmersRating
  );

  const availableFarmers = useMemo(() => {
    return farmers.filter((farmer) => farmer.rating >= rating);
  }, [farmers, rating]);

  const [selectedFarmers, setSelectedFarmers] = useState(() =>
    availableFarmers.map((item) => item.id)
  );

  const toggleDrop = (id, enabled) => {
    setSelectedFarmers((prev) => {
      if (enabled) {
        return [...prev, id];
      } else {
        return prev.filter((item) => item !== id);
      }
    });
  };

  /** Start Headless Mode */
  const [, dispatchAndStartHeadlessMode] = useMirroredCallback(
    "app.start-headless-mode",
    () => {
      startHeadlessMode(
        availableFarmers.filter((farmer) => selectedFarmers.includes(farmer.id))
      );
    },
    [startHeadlessMode, availableFarmers, selectedFarmers]
  );

  return (
    <div className="flex flex-col gap-2 p-4">
      <PrimaryButton onClick={() => dispatchAndStartHeadlessMode()}>
        Start Headless Mode
      </PrimaryButton>

      <div className="flex items-center justify-center">
        <Rating
          style={{ maxWidth: 120 }}
          value={rating}
          onChange={(value) => dispatchAndSetRating(value)}
        />
      </div>

      {availableFarmers.map((drop) => {
        return (
          <LabelToggle
            key={drop.id}
            onChange={(ev) => toggleDrop(drop.id, ev.target.checked)}
            checked={selectedFarmers.includes(drop.id)}
          >
            <div className="flex items-center gap-1">
              <span className="relative shrink-0">
                <img src={drop.icon} className="w-6 h-6 rounded-full" />
              </span>
              <h5>{drop.title}</h5>
            </div>
          </LabelToggle>
        );
      })}
    </div>
  );
}

export default memo(HeadlessPicker);
