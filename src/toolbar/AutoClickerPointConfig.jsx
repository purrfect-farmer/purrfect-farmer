import * as Dialog from "@radix-ui/react-dialog";
import styled from "styled-components";

const DialogOverlay = styled(Dialog.Overlay)`
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  padding: 16px;
  background-color: rgb(0 0 0 / 60%);
  z-index: 99930;
`;

const DialogContent = styled(Dialog.Content)`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 384px;
  gap: 8px;
  padding: 16px;
  background-color: white;
  border-radius: 12px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
`;

const DialogTitle = styled(Dialog.Title)`
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  color: oklch(0.623 0.214 259.815);
`;

const DialogDescription = styled(Dialog.Description)`
  font-size: 12px;
  text-align: center;
  color: #252525;
`;

const DialogClose = styled(Dialog.Close)`
  font-size: 12px;
  background-color: oklch(0.623 0.214 259.815);
  color: white;
  padding: 8px;
  border-radius: 8px;
  border: 0px;
  outline: 0px;
  cursor: pointer;
`;

const Input = styled.input`
  font-size: 12px;
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 8px;
  border: 0px;
  outline: 0px;

  &:focus {
    box-shadow: 0px 0px 2px 2px oklch(0.623 0.214 259.815);
  }
`;

const Select = styled.select`
  font-size: 12px;
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 8px;
  border: 0px;
  outline: 0px;
  &:focus {
    box-shadow: 0px 0px 2px 2px oklch(0.623 0.214 259.815);
  }
`;

export default function AutoClickerPointConfig({
  point,
  updatePoint,
  onOpenChange,
}) {
  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <DialogOverlay>
          <DialogContent onOpenAutoFocus={(ev) => ev.preventDefault()}>
            <DialogTitle>Edit Target</DialogTitle>
            <DialogDescription>Configure Interval</DialogDescription>

            <Input
              type="number"
              min={1}
              value={point.interval}
              onChange={(ev) =>
                updatePoint({ ...point, interval: Number(ev.target.value) })
              }
            />

            <Select
              value={point.unit}
              onChange={(ev) =>
                updatePoint({ ...point, unit: ev.target.value })
              }
            >
              <option value={"ms"}>Milliseconds</option>
              <option value={"s"}>Seconds</option>
              <option value={"m"}>Minutes</option>
            </Select>

            <DialogClose>Done</DialogClose>
          </DialogContent>
        </DialogOverlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
