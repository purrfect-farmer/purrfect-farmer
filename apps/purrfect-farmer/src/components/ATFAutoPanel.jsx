import ATFAutoNewAccountDialog from "./ATFAutoNewAccountDialog";
import Container from "./Container";
import { Dialog } from "radix-ui";
import PrimaryButton from "./PrimaryButton";
import useATFAuto from "@/hooks/useATFAuto";

export default function ATFAutoPanel() {
  const { accounts } = useATFAuto();
  return (
    <Container className="flex flex-col gap-2">
      {/* New Account button */}
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <PrimaryButton>Add account</PrimaryButton>
        </Dialog.Trigger>
        <ATFAutoNewAccountDialog />
      </Dialog.Root>

      {/* Total accounts count */}
      <h3 className="text-center">Accounts: {accounts.length}</h3>

      {/* Accounts list */}
      <div className="flex flex-col gap-2">
        {accounts.map((item, index) => (
          <div key={item.id}>
            {item.title} {item.version} {item.address}
          </div>
        ))}
      </div>
    </Container>
  );
}
