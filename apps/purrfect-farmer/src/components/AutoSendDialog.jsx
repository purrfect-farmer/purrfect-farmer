import AutoSendForm from "./AutoSendForm";
import CenteredDialog from "./CenteredDialog";
import { LuSend } from "react-icons/lu";

export default function AutoSendDialog() {
  return (
    <CenteredDialog
      icon={LuSend}
      title={"Send"}
      description={"Send tokens from any wallet"}
    >
      <AutoSendForm />
    </CenteredDialog>
  );
}
