import AppIcon from "@/assets/images/icon.png?inline&format=webp&w=72&h=72";
import Draggable from "react-draggable";
import copy from "copy-to-clipboard";
import styled from "styled-components";
import { AiOutlineDrag } from "react-icons/ai";
import {
  HiOutlineArrowTopRightOnSquare,
  HiOutlineClipboard,
} from "react-icons/hi2";
import { useCallback } from "react";
import { useRef } from "react";

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

const OpenURLIcon = styled(HiOutlineArrowTopRightOnSquare)`
  width: 16px;
  height: 16px;
`;

const ClipboardIcon = styled(HiOutlineClipboard)`
  width: 16px;
  height: 16px;
`;

const HandleIcon = styled(AiOutlineDrag)`
  width: 16px;
  height: 16px;
`;

export default function MiniAppToolbar({ url }) {
  const dragHandleClass = "draggable-handle";
  const nodeRef = useRef(null);

  const openURL = useCallback(() => {
    window.open(url);
  }, [url]);

  const copyURL = useCallback(() => {
    copy(url);
  }, [url]);

  return (
    <>
      <Wrapper>
        <Draggable handle={`.${dragHandleClass}`} nodeRef={nodeRef}>
          <Container ref={nodeRef}>
            <Image src={AppIcon} />

            {/* Open */}
            <Button onClick={openURL} title="Open URL">
              <OpenURLIcon />
            </Button>

            {/* Copy */}
            <Button onClick={copyURL} title="Copy URL">
              <ClipboardIcon />
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
