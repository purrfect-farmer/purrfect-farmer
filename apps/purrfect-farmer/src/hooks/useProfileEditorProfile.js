import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";
import { FARMER_MODE } from "@/constants/farmerMode";

export default function useProfileEditorProfile() {
  const { farmerMode, telegramClient, updateTelegramUser } = useAppContext();
  const [profile, setProfile] = useState(null);
  const ref = telegramClient.ref;

  /** Update Mutation */
  const mutation = useMutation({
    mutationKey: ["profile-editor", "update-profile"],
    mutationFn: async ({ username, ...fields }) => {
      if (!ref.current) throw new Error("Telegram client is not initialized");
      await ref.current.updateProfile(fields);

      /** Only touch the username when it changed */
      if (username !== (profile.username || "")) {
        await ref.current.updateUsername(username);
      }

      return { ...fields, username };
    },
    onSuccess: (data) => {
      setProfile((prev) => ({ ...prev, ...data }));
      updateTelegramUser(true);
    },
  });

  /** Fetch Profile */
  useEffect(() => {
    if (farmerMode !== FARMER_MODE.SESSION) return;
    /** @type {import("@purrfect/shared/lib/BaseTelegramWebClient.js").default} */
    const client = ref.current;

    client.getFullProfile().then(setProfile);
  }, [farmerMode, ref]);

  return { profile, setProfile, mutation };
}
