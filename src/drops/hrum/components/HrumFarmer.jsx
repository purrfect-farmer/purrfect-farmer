import * as Tabs from "@radix-ui/react-tabs";
import useSocketTabs from "@/hooks/useSocketTabs";
import { CgSpinner } from "react-icons/cg";
import { cn } from "@/lib/utils";

import CookieIcon from "../assets/images/cookie.png?format=webp&w=160";
import HrumAutoTasks from "./HrumAutoTasks";
import HrumBalanceDisplay from "./HrumBalanceDisplay";
import HrumIcon from "../assets/images/icon.png?format=webp&w=80";
import HrumOpenButton from "./HrumOpenButton";
import HrumRiddleTask from "./HrumRiddleTask";
import useHrumDailyClaim from "../hooks/useHrumDailyClaim";
import useHrumDataQueries from "../hooks/useHrumDataQueries";

export default function () {
  const dataQueries = useHrumDataQueries();

  const hero = dataQueries.data?.[0]?.hero;
  const tabs = useSocketTabs("hrum.farmer-tabs", "daily");

  /** Run Daily Claim */
  useHrumDailyClaim();

  return dataQueries.isPending ? (
    <div className="flex items-center justify-center grow">
      <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
    </div>
  ) : dataQueries.isError ? (
    <div className="flex items-center justify-center text-red-500 grow">
      Error...
    </div>
  ) : (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 p-2">
        <img
          src={HrumIcon}
          alt="Hrum Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Hrum Farmer</h1>
      </div>
      {/* Balance */}
      <HrumBalanceDisplay balance={hero.token} />

      {/* Cookie Icon */}
      <img src={CookieIcon} className="w-20 h-20 mx-auto my-4" />

      {/* Open Button */}
      <HrumOpenButton queries={dataQueries} />

      <Tabs.Root {...tabs} className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-2">
          {["daily", "tasks"].map((value, index) => (
            <Tabs.Trigger
              key={index}
              value={value}
              className={cn(
                "p-2",
                "border-b-4 border-transparent",
                "data-[state=active]:border-yellow-500"
              )}
            >
              {value.toUpperCase()}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="daily">
          {/* Hrum Riddle */}
          <HrumRiddleTask queries={dataQueries} />
        </Tabs.Content>
        <Tabs.Content value="tasks">
          {/* Hrum Tasks */}
          <HrumAutoTasks queries={dataQueries} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
