import useFarmerContext from "@/hooks/useFarmerContext";

import BallIcon from "../assets/images/ball.png?format=webp&w=80";

export default function TsubasaInfoDisplay() {
  const { authQuery } = useFarmerContext();
  const user = authQuery.data?.["game_data"]?.["user"];

  return (
    <>
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold text-center text-indigo-500">
          <img src={BallIcon} className="inline w-5 h-5" />{" "}
          {Intl.NumberFormat().format(user?.["total_coins"] || 0)}
        </h3>
      </div>
    </>
  );
}
