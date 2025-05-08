import AppIcon from "@/assets/images/icon.png?inline&format=webp&w=72&h=72";
import AutoClicker from "@/toolbar/AutoClicker";
import Draggable from "react-draggable";
import styled from "styled-components";
import useAppContext from "@/hooks/useAppContext";
import useMirroredState from "@/hooks/useMirroredState";
import { Dialog } from "radix-ui";
import { HiOutlineArrowsPointingOut } from "react-icons/hi2";
import { PiHandTap } from "react-icons/pi";
import { RiDraggable } from "react-icons/ri";
import { useCallback } from "react";
import { useRef } from "react";

import AdvancePanel from "./AdvancePanel";

const Wrapper = styled.div`
  position: fixed;
  bottom: 12px;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 99910;
  overflow: visible !important;
`;

const Container = styled.div`
  background-color: black;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  gap: 6px;
  font-size: 12px;
  border-radius: 999px;
  box-sizing: border-box;
  position: absolute;
  bottom: 100%;
`;

const BaseButton = styled.button`
  box-sizing: border-box;
  background-color: transparent;
  cursor: pointer;
  border-radius: 999px;
  border: 0px;
  outline: 0px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Image = styled.img`
  border-radius: 999px;
  width: 36px;
  height: 36px;
`;

const Button = styled(BaseButton)`
  background-color: #262626;
  color: white;
  font-family: "Product Sans";

  &:hover,
  &.active {
    background-color: oklch(0.768 0.233 130.85);
    color: black;
  }
`;

const FullScreenIcon = styled(HiOutlineArrowsPointingOut)`
  width: 16px;
  height: 16px;
`;

const HandleIcon = styled(RiDraggable)`
  width: 16px;
  height: 16px;
`;

const ClickerIcon = styled(PiHandTap)`
  width: 16px;
  height: 16px;
`;

export default function ToolbarPanel() {
  const { url } = useAppContext();
  const dragHandleClass = "draggable-handle";
  const nodeRef = useRef(null);
  const [position, , dispatchAndSetPosition] = useMirroredState(
    "mini-app-toolbar:panel-draggable",
    {
      x: 0,
      y: 0,
    }
  );

  const [showClicker, , dispatchAndSetShowClicker] = useMirroredState(
    "mini-app-toolbar:show-clicker",
    false
  );

  const [showAdvancePanel, , dispatchAndSetShowAdvancePanel] = useMirroredState(
    "mini-app-toolbar:show-panel",
    false
  );

  /** Toggle FullScreen */
  const toggleFullScreen = useCallback(async function toggleFullScreen() {
    if (!document.fullscreenElement) {
      /** Request Fullscreen */
      await document.documentElement.requestFullscreen();

      /** Reset Position */
      dispatchAndSetPosition({
        x: 0,
        y: 0,
      });
    } else if (document.exitFullscreen) {
      /** Exit Fullscreen */
      await document.exitFullscreen();

      /** Reset Position */
      dispatchAndSetPosition({
        x: 0,
        y: 0,
      });
    }
  }, []);

  return (
    <>
      {showClicker ? <AutoClicker /> : null}
      <Wrapper>
        <Draggable
          position={position}
          onDrag={(e, { x, y }) =>
            dispatchAndSetPosition({
              x,
              y,
            })
          }
          handle={`.${dragHandleClass}`}
          nodeRef={nodeRef}
        >
          <Container ref={nodeRef}>
            {/* Panel */}
            <Dialog.Root
              open={showAdvancePanel}
              onOpenChange={dispatchAndSetShowAdvancePanel}
            >
              <Dialog.Trigger asChild title="Open Advance Panel">
                <BaseButton>
                  <Image src={AppIcon} draggable={false} />
                </BaseButton>
              </Dialog.Trigger>
              <AdvancePanel />
            </Dialog.Root>

            {/* Toggle Clicker */}
            <Button
              onClick={() => dispatchAndSetShowClicker(!showClicker)}
              className={showClicker ? "active" : ""}
              title="Toggle Clicker"
            >
              <ClickerIcon />
            </Button>

            {/* Toggle Fullscreen */}
            <Button onClick={toggleFullScreen} title="Toggle Fullscreen">
              <FullScreenIcon />
            </Button>

            {/* Drag */}
            <Button className={dragHandleClass} title="Drag">
              <HandleIcon />
            </Button>
          </Container>
        </Draggable>
      </Wrapper>
    </>
  );
}
