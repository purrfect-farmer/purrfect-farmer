import AppIcon from "@/assets/images/icon-unwrapped-cropped.png?format=webp&h=192";
import Alert from "@/components/Alert";
import Container from "@/components/Container";
import LabelToggle from "@/components/LabelToggle";
import PrimaryButton from "@/components/PrimaryButton";
import farmers from "@/core/farmers";
import useAppContext from "@/hooks/useAppContext";
import useMirroredState from "@/hooks/useMirroredState";
import { Rating } from "@smastrom/react-rating";
import { useCallback, useMemo, useState, memo } from "react";

function HeadlessPicker() {
  const { settings, dispatchAndStartHeadlessMode } = useAppContext();
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
  const startHeadlessMode = useCallback(() => {
    dispatchAndStartHeadlessMode(
      availableFarmers
        .filter((farmer) => selectedFarmers.includes(farmer.id))
        .map((item) => item.id)
    );
  }, [dispatchAndStartHeadlessMode, availableFarmers, selectedFarmers]);

  return (
    <Container className="flex flex-col gap-2 p-4">
      <div className="flex flex-col gap-2 justify-center items-center">
        <img src={AppIcon} className="h-24" />
        <h1 className="font-turret-road text-center text-2xl text-orange-500">
          Headless Mode
        </h1>
      </div>

      <Alert variant={"warning"}>
        This mode will only run farmers for accounts with{" "}
        <span className="font-bold">Local Telegram Session</span>.
      </Alert>

      <PrimaryButton onClick={() => startHeadlessMode()}>Start</PrimaryButton>

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
    </Container>
  );
}

export default memo(HeadlessPicker);
