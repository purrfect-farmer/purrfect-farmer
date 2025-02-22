import copy from "copy-to-clipboard";
import styled from "styled-components";
import {
  HiOutlineArrowTopRightOnSquare,
  HiOutlineClipboard,
} from "react-icons/hi2";
import { useCallback } from "react";

const Container = styled.div`
  background-color: oklch(0.768 0.233 130.85);
  color: black;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  font-size: 12px;
  z-index: 99999;
`;

const Button = styled.button`
  background-color: oklch(0.841 0.238 128.85);
  color: black;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 0px;
  outline: 0px;
  cursor: pointer;
  font-weight: bold;
`;

const OpenURLIcon = styled(HiOutlineArrowTopRightOnSquare)`
  width: 16px;
  height: 16px;
`;

const ClipboardIcon = styled(HiOutlineClipboard)`
  width: 16px;
  height: 16px;
`;

export default function MiniAppToolbar({ url }) {
  const openURL = useCallback(() => {
    window.open(url);
  }, [url]);

  const copyURL = useCallback(() => {
    copy(url);
  }, [url]);
  return (
    <>
      <Container>
        <Button onClick={openURL}>
          <OpenURLIcon /> Open URL
        </Button>
        <Button onClick={copyURL}>
          <ClipboardIcon /> Copy URL
        </Button>
      </Container>
    </>
  );
}
