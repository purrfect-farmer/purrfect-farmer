import PasswordInput from "@/components/PasswordInput";
import PromptDialog from "@/components/PromptDialog";
import TelegramIcon from "@/assets/images/telegram-logo.svg";
import { Dialog } from "radix-ui";
import { useState } from "react";

/** Ask for the 2FA password, re-asking while Telegram rejects it */
export default function TwoFactorPrompt({ prompt, onSubmit, onCancel }) {
  const [password, setPassword] = useState("");

  if (!prompt) return null;

  return (
    <Dialog.Root open={true} onOpenChange={() => onCancel()}>
      <PromptDialog
        icon={TelegramIcon}
        title="Two-Factor Authentication"
        description={
          prompt.attempt > 0
            ? "That password was rejected. Try again."
            : "Enter your Telegram cloud password to finish signing in."
        }
        onCloseButtonClick={() => onCancel()}
      >
        <PasswordInput
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Cloud password"
        />

        <Dialog.Close
          onClick={() => {
            onSubmit(password);
            setPassword("");
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Submit
        </Dialog.Close>
      </PromptDialog>
    </Dialog.Root>
  );
}
