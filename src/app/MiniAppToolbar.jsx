import copy from "copy-to-clipboard";
import styled from "styled-components";
import {
  HiOutlineArrowTopRightOnSquare,
  HiOutlineClipboard,
} from "react-icons/hi2";
import { useCallback } from "react";

const Container = styled.div`
  background-color: oklch(0.496 0.265 301.924);
  color: white;
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
  background-color: oklch(0.627 0.265 303.9);
  color: white;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 0px;
  outline: 0px;
  cursor: pointer;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
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
