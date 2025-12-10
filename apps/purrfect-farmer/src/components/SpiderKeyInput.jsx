import { useState } from "react";
import Input from "./Input";
import useAppContext from "@/hooks/useAppContext";
import { cn } from "@/lib/utils";
import Container from "./Container";

export default function SpiderKeyInput() {
  const { sharedSettings, dispatchAndConfigureSharedSettings } =
    useAppContext();
  const spiderApiKey = sharedSettings.spiderApiKey;
  const setSpiderApiKey = (key) =>
    dispatchAndConfigureSharedSettings("spiderApiKey", key);

  const [tempApiKey, setTempApiKey] = useState(spiderApiKey || "");

  const handleSave = () => {
    setSpiderApiKey(tempApiKey);
  };

  return (
    <Container className="flex flex-col gap-2 p-0 px-2">
      <div className="flex gap-2">
        <Input
          value={tempApiKey}
          onChange={(e) => setTempApiKey(e.target.value)}
          label="Spider API Key"
          placeholder="Enter your Spider API Key"
        />

        <button
          className={cn(
            "px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600",
            "shrink-0 rounded-xl font-bold"
          )}
          onClick={handleSave}
        >
          Save
        </button>
      </div>
      <p className="text-neutral-500 dark:text-neutral-400 text-center">
        Get your Spider API Key from the{" "}
        <a
          href="https://t.me/S_PIDERBot?start=1147265290"
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-500"
        >
          Spider Bot
        </a>
        .
      </p>
    </Container>
  );
}
