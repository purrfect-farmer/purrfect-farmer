import AppIcon from "@/assets/images/icon.png?inline&format=webp&w=128&h=128";
import copy from "copy-to-clipboard";
import styled from "styled-components";
import useAppContext from "@/hooks/useAppContext";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import { Dialog } from "radix-ui";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineClipboard,
  HiOutlineGlobeAlt,
} from "react-icons/hi2";
import { memo } from "react";
import { useCallback } from "react";

const DialogOverlay = styled(Dialog.Overlay)`
  position: fixed;
  inset: 0px;
  z-index: 999910;
  background-color: rgba(0 0 0 / 50%);
`;

const DialogContent = styled(Dialog.Content)`
  position: fixed;
  inset-inline: 0px;
  z-index: 999920;
  background-color: #262626;
  color: white;
  display: flex;
  flex-direction: column;
  height: 75%;
  bottom: 0;
  border-radius: 12px 12px 0px 0px;
  padding: 16px;
  gap: 16px;
  font-size: 12px;
  font-family: "Noto Sans";
`;

const DialogHeader = styled.div`
  display: flex;
  flex-direction: column;
`;

const DialogHeaderImage = styled.img`
  width: 64px;
  height: 64px;
`;

const DialogTitle = styled(Dialog.Title)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  font-family: "Turret Road";
`;

const DialogDescription = styled(Dialog.Description)`
  color: #ccc;
  text-align: center;
  font-size: 12px;
`;

const BaseToolbarButton = styled.button`
  background-color: #404040;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  padding: 10px;
  font-size: 12px;
  border: 0px;
  outline: 0px;
  cursor: pointer;
  box-sizing: border-box;

  &:hover,
  &:focus,
  &.active {
    background-color: oklch(0.78 0.16 64.67);
    color: black;
  }
`;

const DialogMainArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0px;
  min-width: 0px;
  flex-grow: 1;
  overflow: auto;
`;

const DialogClose = styled(BaseToolbarButton)`
  justify-content: center;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const [CopyIcon, OpenURLIcon, GlobeIcon, ArrowLeftIcon] = [
  HiOutlineClipboard,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineGlobeAlt,
  HiOutlineArrowLeft,
].map(
  (item) => styled(item)`
    flex-shrink: 0px;
    width: 18px;
    height: 18px;
  `
);

const ToolbarButton = ({ icon: Icon, children, ...props }) => (
  <BaseToolbarButton {...props}>
    <Icon />
    {children}
  </BaseToolbarButton>
);

export default memo(function AdvancePanel() {
  const { url, host, port } = useAppContext();

  const openURL = useCallback(() => {
    window.open(url);
  }, [url]);

  const copyURL = useCallback(() => {
    copy(url);
  }, [url]);

  const [, dispatchAndLaunchInFarmer] = useMirroredCallback(
    "mini-app-toolbar:launch-in-farmer",
    () => {
      const favicons = [...document.querySelectorAll('link[rel~="icon"]')].map(
        (link) => new URL(link.href, url).href
      );
      port.postMessage({
        action: "farmer:launch-in-app-browser",
        data: {
          id: host,
          title: document.title,
          icon: favicons[0],
          url,
        },
      });
    },
    [url, host, port]
  );

  const [, dispatchAndFocusFarmer] = useMirroredCallback(
    "mini-app-toolbar:focus-farmer",
    () => {
      port.postMessage({
        action: "farmer:focus-farmer",
        data: {
          status: true,
        },
      });
    },
    [port]
  );

  return (
    <Dialog.Portal>
      <DialogOverlay />
      <DialogContent onOpenAutoFocus={(ev) => ev.preventDefault()}>
        <DialogMainArea>
          <DialogHeader>
            <DialogTitle>
              <DialogHeaderImage src={AppIcon} />{" "}
              {import.meta.env.VITE_APP_NAME}
            </DialogTitle>
            <DialogDescription>Advance Toolbar Panel</DialogDescription>
          </DialogHeader>

          <ButtonsContainer>
            {/* Launch in Farmer */}
            <ToolbarButton
              icon={GlobeIcon}
              onClick={() => dispatchAndLaunchInFarmer()}
            >
              Launch in Farmer
            </ToolbarButton>

            {/* Copy URL */}
            <ToolbarButton icon={CopyIcon} onClick={() => copyURL()}>
              Copy URL
            </ToolbarButton>

            {/* Open URL */}
            <ToolbarButton icon={OpenURLIcon} onClick={() => openURL()}>
              Open URL
            </ToolbarButton>

            {/* Return to Farmer */}
            <ToolbarButton
              icon={ArrowLeftIcon}
              onClick={() => dispatchAndFocusFarmer()}
            >
              Return to Farmer
            </ToolbarButton>
          </ButtonsContainer>
        </DialogMainArea>

        <Dialog.Close asChild>
          <DialogClose>Close</DialogClose>
        </Dialog.Close>
      </DialogContent>
    </Dialog.Portal>
  );
});
