import "@smastrom/react-rating/style.css";

import Alert from "@/components/Alert";
import LabelToggle from "@/components/LabelToggle";
import { Rating } from "@smastrom/react-rating";
import { Reorder } from "motion/react";
import { cn } from "@/utils";
import { memo } from "react";

import {
  DropReorderItem,
  SettingsGridButton,
  SettingsLabel,
} from "./SettingsComponents";

export default memo(function FarmersConfigTab({
  settings,
  dropsStatus,
  dropsOrder,
  orderedDrops,
  dispatchAndConfigureSettings,
  toggleDrop,
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Layout */}
      <SettingsLabel>Layout</SettingsLabel>

      <div className="grid grid-cols-2 gap-2">
        {["grid", "list"].map((style) => (
          <SettingsGridButton
            onClick={() => dispatchAndConfigureSettings("farmersLayout", style)}
            key={style}
            className={cn(
              settings.farmersLayout === style
                ? "bg-blue-200 dark:bg-blue-200 text-blue-800"
                : null
            )}
          >
            {style}
          </SettingsGridButton>
        ))}
      </div>

      {/* Repeat Cycle */}
      <LabelToggle
        onChange={(ev) =>
          dispatchAndConfigureSettings("repeatZoomiesCycle", ev.target.checked)
        }
        checked={settings?.repeatZoomiesCycle}
      >
        Repeat Zoomies Cycle
      </LabelToggle>

      <Alert variant={"info"}>
        Enable the farmers you would like to include.
      </Alert>

      <div className="flex items-center justify-center">
        <Rating
          style={{ maxWidth: 120 }}
          value={settings?.farmersRating}
          onChange={(value) =>
            dispatchAndConfigureSettings("farmersRating", value)
          }
        />
      </div>

      <Reorder.Group
        values={dropsOrder}
        className="flex flex-col gap-2"
        onReorder={(newOrder) =>
          dispatchAndConfigureSettings("dropsOrder", newOrder, false)
        }
      >
        {orderedDrops.map((drop) => (
          <DropReorderItem key={drop.id} value={drop.id}>
            <LabelToggle
              onChange={(ev) => toggleDrop(drop.id, ev.target.checked)}
              checked={dropsStatus[drop.id] === true}
            >
              <div className="flex items-center gap-1">
                <span className="relative shrink-0">
                  <img src={drop.icon} className="w-6 h-6 rounded-full" />
                  {drop.syncToCloud ? (
                    <span
                      className={cn(
                        "absolute inset-0",
                        "rotate-45",

                        // After
                        "after:absolute",
                        "after:top-0 after:left-1/2",
                        "after:-translate-x-1/2 after:-translate-y-1/2",
                        "after:border-2 after:border-white",
                        "after:w-2 after:h-2",
                        "after:rounded-full",
                        "after:bg-green-500"
                      )}
                    ></span>
                  ) : null}
                </span>
                <h5>{drop.title}</h5>
              </div>
            </LabelToggle>
          </DropReorderItem>
        ))}
      </Reorder.Group>
    </div>
  );
});
