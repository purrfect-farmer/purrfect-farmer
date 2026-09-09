import Alert from "@/components/Alert";
import Container from "@/components/Container";
import PrimaryButton from "@/components/PrimaryButton";
import Tabs from "@/components/Tabs";
import TelegramIcon from "@/assets/images/telegram-logo.svg";
import toast from "react-hot-toast";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import useTelegramWebTransfer from "@/hooks/useTelegramWebTransfer";
import { cn } from "@/utils";

const TELEGRAM_WEB_URL = "https://web.telegram.org";
const PURRFECT_GRAM_URL = import.meta.env.VITE_APP_TELEGRAM_WEB_URL;

const TabContent = ({ title, children, ...props }) => (
  <Tabs.Content
    {...props}
    className={cn("flex flex-col min-w-0 min-h-0 grow", "overflow-auto")}
  >
    <Container className="flex flex-col gap-4 p-4 my-auto">
      <div className="flex flex-col gap-2 justify-center items-center">
        <img src={TelegramIcon} className="size-24" />
        <h1 className="font-turret-road text-center text-2xl text-orange-500">
          {title}
        </h1>
      </div>

      {children}
    </Container>
  </Tabs.Content>
);

export default function TelegramToPurrfectGram() {
  const tabs = useMirroredTabs("telegram-web-transfer", [
    "purrfect-gram",
    "telegram-web",
  ]);

  const { closeTelegramWeb, getLocalStorage, setLocalStorage } =
    useTelegramWebTransfer();

  const [, dispatchAndTransferData] = useMirroredCallback(
    "app.telegram-to-purrfect-gram",
    async (receiver = "telegram-web") => {
      const [sender, target] =
        receiver === "telegram-web"
          ? [PURRFECT_GRAM_URL, TELEGRAM_WEB_URL]
          : [TELEGRAM_WEB_URL, PURRFECT_GRAM_URL];

      /** Close Telegram Web Tabs */
      await closeTelegramWeb();

      /** Get Data */
      const data = await getLocalStorage(`${sender}/k`);

      /** Restore Data */
      await setLocalStorage(`${target}/k`, data);

      toast.success("Data transferred successfully!");
    },
    [closeTelegramWeb, getLocalStorage, setLocalStorage],
  );

  return (
    <Tabs tabs={tabs} rootClassName="grow overflow-auto">
      <TabContent value="purrfect-gram" title={"Purrfect Gram"}>
        <Alert variant={"warning"} className="text-center">
          You are about to migrate all data from Telegram Web into Purrfect
          Gram.
        </Alert>

        <PrimaryButton onClick={() => dispatchAndTransferData("purrfect-gram")}>
          Transfer Now
        </PrimaryButton>
      </TabContent>

      <TabContent value="telegram-web" title={"Telegram Web"}>
        <Alert variant={"warning"} className="text-center">
          You are about to migrate all data from Purrfect Gram into Telegram
          Web.
        </Alert>

        <PrimaryButton onClick={() => dispatchAndTransferData("telegram-web")}>
          Transfer Now
        </PrimaryButton>
      </TabContent>
    </Tabs>
  );
}
