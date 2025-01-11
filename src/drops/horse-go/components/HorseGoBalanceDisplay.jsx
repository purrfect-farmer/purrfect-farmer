import { memo } from "react";

import useHorseGoUserQuery from "../hooks/useHorseGoUserQuery";

export default memo(function HorseGoBalanceDisplay() {
  const query = useHorseGoUserQuery();

  return (
    <div className="flex flex-col gap-2 py-2 text-center">
      {query.isPending ? (
        "Fetching balance..."
      ) : query.isSuccess ? (
        <>
          <h3 className="flex items-center justify-center gap-2 text-2xl font-bold text-lime-500">
            {Intl.NumberFormat().format(query.data.availablePoints)} $HORSE
          </h3>

          <h3 className="flex items-center justify-center gap-2 text-xs font-bold text-purple-500">
            Total: {Intl.NumberFormat().format(query.data.totalPoints)} $HORSE
          </h3>

          <h3 className="flex items-center justify-center gap-2 text-xs font-bold text-sky-500">
            Base: {Intl.NumberFormat().format(query.data.userBasePoints)}
          </h3>

          <h3 className="flex items-center justify-center gap-2 text-xs font-bold text-pink-500">
            Streak: {Intl.NumberFormat().format(query.data.streak)}
          </h3>

          <h4 className="flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
              className="h-4"
            >
              <path
                fill="currentColor"
                d="M17.5 2.5a.833.833 0 0 1 .833.833v4.584a2.083 2.083 0 0 0 0 4.166v4.584a.833.833 0 0 1-.833.833h-15a.833.833 0 0 1-.833-.833v-4.584a2.083 2.083 0 0 0 0-4.166V3.333A.833.833 0 0 1 2.5 2.5zm-.833 1.667H3.333V6.64l.13.067a3.75 3.75 0 0 1 1.95 3.117l.004.176a3.75 3.75 0 0 1-1.954 3.292l-.13.068v2.473h13.334V13.36l-.13-.066a3.75 3.75 0 0 1-1.95-3.117L14.583 10c0-1.42.79-2.656 1.954-3.292l.13-.069z"
              ></path>
            </svg>{" "}
            {query.data.energyPoints}
          </h4>
        </>
      ) : (
        "Error..."
      )}
    </div>
  );
});
