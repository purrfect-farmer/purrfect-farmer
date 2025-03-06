import Draggable from "react-draggable";
import styled from "styled-components";
import { useRef } from "react";

const Wrapper = styled.div`
  position: fixed;
  z-index: 99993;
  left: 0;
  top: 0;
`;
const Point = styled.button`
  box-sizing: border-box;
  border: 0px;
  outline: 0px;
  cursor: pointer;
  position: absolute;
  left: 0;
  top: 0;
  transform: translateX(-50%) translateY(-50%);
  background-color: rgb(252 159 48 / 60%);
  color: black;
  border: 2px solid red;
  border-radius: 999px;
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;

  &:disabled {
    pointer-events: none;
  }
`;

export default function AutoClickerPoint({
  disabled = false,
  title,
  x,
  y,
  onDrag,
}) {
  const nodeRef = useRef(null);

  return (
    <Draggable
      disabled={disabled}
      position={{ x, y }}
      onDrag={(e, { x, y }) => {
        onDrag({
          x,
          y,
        });
      }}
      nodeRef={nodeRef}
    >
      <Wrapper ref={nodeRef}>
        <Point disabled={disabled}>{title}</Point>
      </Wrapper>
    </Draggable>
  );
}
