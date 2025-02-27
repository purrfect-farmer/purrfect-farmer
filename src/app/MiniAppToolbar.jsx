import AppIcon from "@/assets/images/icon.png?inline&format=webp&w=72&h=72";
import Draggable from "react-draggable";
import MinimizedAppIcon from "@/assets/images/icon-toolbar-minimized.png?inline&format=webp&w=72&h=72";
import copy from "copy-to-clipboard";
import styled from "styled-components";
import {
  HiOutlineArrowTopRightOnSquare,
  HiOutlineArrowsPointingOut,
  HiOutlineClipboard,
} from "react-icons/hi2";
import { RiDraggable } from "react-icons/ri";
import { useCallback } from "react";
import { useRef } from "react";
import { useState } from "react";

const Wrapper = styled.div`
  position: fixed;
  bottom: 12px;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 99999;
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
  z-index: 99999;
  border-radius: 999px;
  box-sizing: border-box;
`;

const Image = styled.img`
  border-radius: 999px;
  width: 36px;
  height: 36px;
  cursor: pointer;
`;

const Button = styled.button`
  box-sizing: border-box;
  background-color: #262626;
  color: white;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0px;
  outline: 0px;
  cursor: pointer;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;

  &:hover {
    background-color: oklch(0.768 0.233 130.85);
    color: black;
  }
`;

const FullScreenIcon = styled(HiOutlineArrowsPointingOut)`
  width: 16px;
  height: 16px;
`;

const OpenURLIcon = styled(HiOutlineArrowTopRightOnSquare)`
  width: 16px;
  height: 16px;
`;

const ClipboardIcon = styled(HiOutlineClipboard)`
  width: 16px;
  height: 16px;
`;

const HandleIcon = styled(RiDraggable)`
  width: 16px;
  height: 16px;
`;

export default function MiniAppToolbar({ url }) {
  const dragHandleClass = "draggable-handle";
  const nodeRef = useRef(null);
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  const [showFullUi, setShowFullUi] = useState(true);

  const toggleFullUi = useCallback(() => setShowFullUi((prev) => !prev));

  const openURL = useCallback(() => {
    window.open(url);
  }, [url]);

  const copyURL = useCallback(() => {
    copy(url);
  }, [url]);

  /** Toggle FullScreen */
  const toggleFullScreen = useCallback(async function toggleFullScreen() {
    if (!document.fullscreenElement) {
      /** Request Fullscreen */
      await document.documentElement.requestFullscreen();

      /** Reset Position */
      setPosition({
        x: 0,
        y: 0,
      });
    } else if (document.exitFullscreen) {
      /** Exit Fullscreen */
      await document.exitFullscreen();

      /** Reset Position */
      setPosition({
        x: 0,
        y: 0,
      });
    }
  }, []);

  return (
    <>
      <Wrapper>
        <Draggable
          position={position}
          onDrag={(e, { x, y }) =>
            setPosition({
              x,
              y,
            })
          }
          handle={`.${dragHandleClass}`}
          nodeRef={nodeRef}
        >
          <Container ref={nodeRef}>
            <Image
              src={showFullUi ? AppIcon : MinimizedAppIcon}
              onClick={toggleFullUi}
              draggable={false}
            />

            {showFullUi ? (
              <>
                {/* Toggle Fullscreen */}
                <Button onClick={toggleFullScreen} title="Toggle Fullscreen">
                  <FullScreenIcon />
                </Button>

                {/* Open */}
                <Button onClick={openURL} title="Open URL">
                  <OpenURLIcon />
                </Button>

                {/* Copy */}
                <Button onClick={copyURL} title="Copy URL">
                  <ClipboardIcon />
                </Button>
              </>
            ) : null}
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
