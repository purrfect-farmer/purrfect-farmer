import "react-diff-view/style/index.css";

import {
  Decoration,
  Diff,
  Hunk,
  markEdits,
  parseDiff,
  tokenize,
} from "react-diff-view";
import Alert from "@/components/Alert";
import Button from "@/components/Button";
import LabelToggle from "@/components/LabelToggle";
import PrimaryButton from "@/components/PrimaryButton";
import { useMemo } from "react";
import { useState } from "react";

/** Parse the server patch, the parser needs a git header */
const parsePatch = (patch) => {
  if (!patch) return null;

  const [file] = parseDiff(`diff --git a/.env b/.env\n${patch}`);
  if (!file) return null;

  return {
    file,
    tokens: tokenize(file.hunks, {
      enhancers: [markEdits(file.hunks, { type: "block" })],
    }),
  };
};

export default function CloudEnvReview({ preview, isPending, onBack, onConfirm }) {
  const [restart, setRestart] = useState(true);
  const diff = useMemo(() => parsePatch(preview.patch), [preview.patch]);
  const hasChanges = Boolean(diff);

  return (
    <div className="flex flex-col gap-2">
      {preview.warnings.map((warning, index) => (
        <Alert key={index} variant="warning">
          {warning}
        </Alert>
      ))}

      {hasChanges ? (
        <div className="env-diff overflow-auto text-xs rounded-lg bg-neutral-100 dark:bg-neutral-900 max-h-96">
          <Diff
            viewType="unified"
            diffType={diff.file.type}
            hunks={diff.file.hunks}
            tokens={diff.tokens}
          >
            {(hunks) =>
              hunks.flatMap((hunk) => [
                <Decoration key={`decoration-${hunk.content}`}>
                  <span className="text-neutral-400">{hunk.content}</span>
                </Decoration>,
                <Hunk key={hunk.content} hunk={hunk} />,
              ])
            }
          </Diff>
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
