import toast from "react-hot-toast";
import {
  PROFILE_FIELDS,
  stripProfileText,
} from "@purrfect/shared/utils/profile.js";
import { useCallback, useState } from "react";

import useAppContext from "./useAppContext";
import useMirroredCallback from "./useMirroredCallback";
import useMirroredState from "./useMirroredState";

/** Fields cleaned by default */
const DEFAULT_FIELDS = [PROFILE_FIELDS.NAME, PROFILE_FIELDS.BIO];

export default function useProfileEditorClean({ setProfile }) {
  const { telegramClient, updateTelegramUser } = useAppContext();
  const ref = telegramClient.ref;
  const [isPending, setIsPending] = useState(false);
  const [text, , dispatchAndSetText] = useMirroredState(
    "profile-editor.clean-text",
    "",
  );
  const [fields, , dispatchAndSetFields] = useMirroredState(
    "profile-editor.clean-fields",
    DEFAULT_FIELDS,
  );

  /** Add or remove a field */
  const toggleField = useCallback(
    (field, checked) =>
      dispatchAndSetFields(
        checked
          ? [...new Set([...fields, field])]
          : fields.filter((item) => item !== field),
      ),
    [fields, dispatchAndSetFields],
  );

  /** Strip the text from the chosen fields, each mirror cleans its own account */
  const [, dispatchAndClean] = useMirroredCallback(
    "profile-editor.clean",
    async (text, fields) => {
      /** @type {import("@purrfect/shared/lib/BaseTelegramWebClient").default} */
      const client = ref.current;
      const cleanText = text.trim();

      if (!cleanText || !fields.length) return;

      setIsPending(true);

      try {
        await toast.promise(
          (async () => {
            const profile = await client.getFullProfile();
            const { changes, changed } = stripProfileText(
              profile,
              cleanText,
              fields,
            );

            if (!changed) throw new Error("Profile doesn't contain the text");

            await client.updateProfile(changes);
            setProfile((prev) => ({ ...prev, ...changes }));
            updateTelegramUser(true);
          })(),
          {
            loading: "Cleaning profile...",
            success: "Profile cleaned!",
            error: (error) => `Failed to clean profile: ${error.message}`,
          },
        );
      } catch (error) {
        console.error("Failed to clean profile:", error);
      } finally {
        setIsPending(false);
      }
    },
    [ref, setProfile, updateTelegramUser],
  );

  /** Clean with the current values */
  const clean = useCallback(
    () => dispatchAndClean(text, fields),
    [text, fields, dispatchAndClean],
  );

  return {
    text,
    fields,
    isPending,
    setText: dispatchAndSetText,
    toggleField,
    clean,
  };
}
