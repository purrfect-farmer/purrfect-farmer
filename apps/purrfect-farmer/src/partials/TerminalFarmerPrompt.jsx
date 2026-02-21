import { Dialog } from "radix-ui";
import Input from "@/components/Input";
import PromptDialog from "@/components/PromptDialog";
import Select from "@/components/Select";
import { useState } from "react";

export const TerminalFarmerPrompt = ({ context, userInputPrompt }) => {
  const { show, question, answer, cancel } = userInputPrompt;
  const [value, setValue] = useState(question?.defaultValue || "");

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
        description={question.text}
        icon={context.icon}
      >
        {/* Image */}
        {question.image ? (
          <img src={question.image} alt={question.text} className="mx-auto" />
        ) : null}

        {/* User Input */}
        {question.type === "text" ? (
          <Input
            type="text"
            onChange={(e) => setValue(e.target.value)}
            value={value}
            className="w-full"
          />
        ) : question.type === "select" ? (
          <Select
            onChange={(e) => setValue(e.target.value)}
            value={value}
            className="w-full"
          >
            <Select.Item value="" disabled>
              --Select an option--
            </Select.Item>
            {question.options.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select>
        ) : null}

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
