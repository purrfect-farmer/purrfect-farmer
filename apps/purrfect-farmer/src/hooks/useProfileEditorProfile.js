import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useProfileEditorProfile() {
  const { farmerMode, telegramClient, updateTelegramUser } = useAppContext();
  const [profile, setProfile] = useState(null);
  const ref = telegramClient.ref;

  /** Update Mutation */
  const mutation = useMutation({
    mutationKey: ["profile-editor", "update-profile"],
    mutationFn: async ({ username, ...names }) => {
      if (!ref.current) throw new Error("Telegram client is not initialized");
      await ref.current.updateProfile(names);

      /** Only touch the username when it changed */
      if (username !== (profile.username || "")) {
        await ref.current.updateUsername(username);
      }

      return { ...names, username };
    },
    onSuccess: (data) => {
      setProfile(data);
      updateTelegramUser(true);
    },
  });

  /** Fetch Profile */
  useEffect(() => {
    if (farmerMode !== "session") return;
    /** @type {import("@purrfect/shared/lib/BaseTelegramWebClient.js").default} */
    const client = ref.current;

    client.execute(() => client.getMe()).then(setProfile);
  }, [farmerMode, ref]);

  return { profile, mutation };
}
