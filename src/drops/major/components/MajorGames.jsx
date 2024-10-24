import MajorHoldCoin from "./MajorHoldCoin";
import MajorPuzzle from "./MajorPuzzle";
import MajorRoulette from "./MajorRoulette";
import MajorSwipeCoin from "./MajorSwipeCoin";

export default function MajorGames() {
  return (
    <div className="flex flex-col gap-2 py-4">
      <MajorPuzzle />
      <MajorHoldCoin />
      <MajorRoulette />
      <MajorSwipeCoin />
    </div>
  );
}
