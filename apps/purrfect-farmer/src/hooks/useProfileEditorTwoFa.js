import toast from "react-hot-toast";
import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useProfileEditorTwoFa() {
  const { farmerMode, telegramClient } = useAppContext();
  const [state, setState] = useState(null);
  const ref = telegramClient.ref;

  /** Load 2FA State */
  const loadState = useCallback(
    () => ref.current.getPasswordState().then(setState),
    [ref],
  );

  /** Update Mutation (no newPassword removes it) */
  const mutation = useMutation({
    mutationKey: ["profile-editor", "update-2fa"],
    mutationFn: (data) => ref.current.updateTwoFa(data),
    onSuccess: () => loadState(),
  });

  useEffect(() => {
    if (farmerMode !== "session") return;

    loadState().catch((err) =>
      toast.error(`Error loading 2FA: ${err.message}`),
    );
  }, [farmerMode, loadState]);

  return { state, mutation };
}
