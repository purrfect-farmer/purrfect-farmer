import Alert from "@/components/Alert";
import Button from "@/components/Button";
import LabelToggle from "@/components/LabelToggle";
import PrimaryButton from "@/components/PrimaryButton";
import { cn } from "@/utils";
import { useMemo } from "react";
import { useState } from "react";

/** Unchanged lines kept around each change */
const CONTEXT_LINES = 2;

/** Collapse long unchanged runs of the diff */
const collapseDiff = (diff) => {
  const keep = diff.map((item, index) =>
    diff
      .slice(Math.max(0, index - CONTEXT_LINES), index + CONTEXT_LINES + 1)
      .some((other) => other.type !== "same"),
  );

  const output = [];
  diff.forEach((item, index) => {
    if (keep[index]) output.push(item);
    else if (output.at(-1)?.type !== "gap") output.push({ type: "gap" });
  });

  return output;
};

export default function CloudEnvReview({ preview, isPending, onBack, onConfirm }) {
  const [restart, setRestart] = useState(true);
  const lines = useMemo(() => collapseDiff(preview.diff), [preview.diff]);
  const hasChanges = preview.diff.some((item) => item.type !== "same");

  return (
    <div className="flex flex-col gap-2">
      {preview.warnings.map((warning, index) => (
        <Alert key={index} variant="warning">
          {warning}
        </Alert>
      ))}

      {hasChanges ? (
        <div className="overflow-auto text-xs rounded-lg bg-neutral-100 dark:bg-neutral-900 max-h-96">
          <pre className="p-2 font-mono">
            {lines.map((item, index) =>
              item.type === "gap" ? (
                <div key={index} className="text-neutral-400">
                  ⋯
                </div>
              ) : (
                <div
                  key={index}
                  className={cn(
                    "whitespace-pre-wrap break-all",
                    item.type === "added" &&
                      "bg-green-500/20 text-green-700 dark:text-green-400",
                    item.type === "removed" &&
                      "bg-red-500/20 text-red-700 dark:text-red-400",
                  )}
                >
                  {item.type === "added" ? "+ " : item.type === "removed" ? "- " : "  "}
                  {item.line}
                </div>
              ),
            )}
          </pre>
        </div>
      ) : (
        <Alert variant="info">Nothing changes in the file.</Alert>
      )}

      <LabelToggle
        checked={restart}
        onChange={(ev) => setRestart(ev.target.checked)}
        disabled={isPending}
      >
        Restart server now
        <span className="block text-xs text-neutral-500 dark:text-neutral-400">
          New settings only apply after a restart. A backup is saved first, and
          it is restored automatically if the server fails to start.
        </span>
      </LabelToggle>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={isPending}
        >
          Back
        </Button>
        <PrimaryButton
          type="button"
          onClick={() => onConfirm(restart)}
          disabled={isPending || !hasChanges}
        >
          {isPending ? "Saving..." : "Save"}
        </PrimaryButton>
      </div>
    </div>
  );
}
