import Alert from "@/components/Alert";
import Container from "@/components/Container";
import PrimaryButton from "@/components/PrimaryButton";
import TelegramIcon from "@/assets/images/telegram-logo.svg";
import toast from "react-hot-toast";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useTelegramWebTransfer from "@/hooks/useTelegramWebTransfer";
import { LEGACY_PURRFECT_GRAM_URL } from "@/constants";
import { cn } from "@/utils";

const PURRFECT_GRAM_URL = import.meta.env.VITE_APP_TELEGRAM_WEB_URL;

export default function LegacyGramToPurrfectGram() {
  const { closeTelegramWeb, getLocalStorage, setLocalStorage } =
    useTelegramWebTransfer();

  const [, dispatchAndTransferData] = useMirroredCallback(
    "app.legacy-gram-to-purrfect-gram",
    async () => {
      /** Close Telegram Web Tabs */
      await closeTelegramWeb();

      /** Get Data (Legacy Purrfect Gram) */
      const data = await getLocalStorage(`${LEGACY_PURRFECT_GRAM_URL}/k`);

      /** Restore Data (Purrfect Gram) */
      await setLocalStorage(`${PURRFECT_GRAM_URL}/k`, data);

      toast.success("Data transferred successfully!");
    },
    [closeTelegramWeb, getLocalStorage, setLocalStorage],
  );

  return (
    <div className={cn("flex flex-col min-w-0 min-h-0 grow", "overflow-auto")}>
      <Container className="flex flex-col gap-4 p-4 my-auto">
        <div className="flex flex-col gap-2 justify-center items-center">
          <img src={TelegramIcon} className="size-24" />
          <h1 className="font-turret-road text-center text-2xl text-orange-500">
            Legacy Purrfect Gram
          </h1>
        </div>

        <Alert variant={"warning"} className="text-center">
          You are about to migrate all data from{" "}
          {new URL(LEGACY_PURRFECT_GRAM_URL).host} into the new Purrfect Gram.
          Existing data on the new Purrfect Gram will be replaced.
        </Alert>

        <PrimaryButton onClick={() => dispatchAndTransferData()}>
          Transfer Now
        </PrimaryButton>
      </Container>
    </div>
  );
}
