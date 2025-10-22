import { Dialog } from "radix-ui";
import Input from "@/components/Input";
import { useState } from "react";
import PromptDialog from "@/components/PromptDialog";

export const TerminalFarmerPrompt = ({ context, userInputPrompt }) => {
  const { show, question, answer, cancel } = userInputPrompt;
  const [value, setValue] = useState("");

  if (!show) return null;

  return (
    <Dialog.Root
      open={true}
      onOpenChange={() => {
        cancel();
        setValue("");
      }}
    >
      <PromptDialog
        title={context.title}
        description={question}
        icon={context.icon}
      >
        {/* User Input */}
        <Input
          type="text"
          onChange={(e) => setValue(e.target.value)}
          value={value}
          className="w-full"
        />

        {/* Submit Button */}
        <Dialog.Close
          onClick={() => {
            answer(value);
            setValue("");
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Submit
        </Dialog.Close>
      </PromptDialog>
    </Dialog.Root>
  );
};
