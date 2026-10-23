import {
  PROFILE_CLEAN_TEXT_MAX,
  PROFILE_FIELDS,
} from "@purrfect/shared/utils/profile.js";

import Input from "./Input";
import LabelToggle from "./LabelToggle";
import PrimaryButton from "./PrimaryButton";
import useProfileEditorClean from "@/hooks/useProfileEditorClean";

/** Fields the text can be removed from */
const FIELD_OPTIONS = [
  { value: PROFILE_FIELDS.NAME, label: "Name" },
  { value: PROFILE_FIELDS.BIO, label: "Bio" },
];

export default function ProfileEditorCleanForm({ profile, setProfile }) {
  const { text, fields, isPending, setText, toggleField, clean } =
    useProfileEditorClean({ setProfile });

  const canClean = Boolean(text.trim()) && fields.length > 0;
  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  /** Submit without passing the event to mirrors */
  const handleSubmit = (e) => {
    e.preventDefault();
    clean();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-2">
      <p className="text-center text-neutral-500 dark:text-neutral-400">
        Remove text from your name and bio (case-insensitive).
      </p>

      {/* Current Profile */}
      <div className="flex flex-col gap-1 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 min-w-0">
        <p className="font-bold wrap-break-word">{fullName || "-"}</p>
        <p className="text-neutral-500 dark:text-neutral-400 wrap-break-word whitespace-pre-wrap">
          {profile.about || "No bio"}
        </p>
      </div>

      <Input
        value={text}
        disabled={isPending}
        autoComplete="off"
        maxLength={PROFILE_CLEAN_TEXT_MAX}
        placeholder="Text to remove"
        onChange={(ev) => setText(ev.target.value)}
      />

      {FIELD_OPTIONS.map(({ value, label }) => (
        <LabelToggle
          key={value}
          disabled={isPending}
          checked={fields.includes(value)}
          onChange={(ev) => toggleField(value, ev.target.checked)}
        >
          {label}
        </LabelToggle>
      ))}

      <PrimaryButton type="submit" disabled={isPending || !canClean}>
        {isPending ? "Cleaning..." : "Remove Text"}
      </PrimaryButton>
    </form>
  );
}
