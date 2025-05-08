import Draggable from "react-draggable";
import styled from "styled-components";
import { memo } from "react";
import { useCallback } from "react";
import { useRef } from "react";

const Wrapper = styled.div`
  position: fixed;
  z-index: 99920;
  overflow: visible !important;
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
  font-family: "Product Sans";

  &:disabled {
    pointer-events: none;
  }
`;

export default memo(function AutoClickerPoint({
  disabled = false,
  title,
  x,
  y,
  onClick,
  onDrag,
}) {
  const nodeRef = useRef(null);
  const wasDragged = useRef(false);
  const initialPosition = useRef({ x, y });

  const handleClick = useCallback(
    (ev) => {
      if (!wasDragged.current) {
        onClick(ev);
      }
    },
    [onClick]
  );

  return (
    <Draggable
      nodeRef={nodeRef}
      disabled={disabled}
      position={{ x, y }}
      onStart={(_e, { x, y }) => {
        wasDragged.current = false;
        initialPosition.current = { x, y };
      }}
      onStop={(_e, { x, y }) => {
        if (
          Math.abs(x - initialPosition.current.x) >= 2 ||
          Math.abs(y - initialPosition.current.y) >= 2
        ) {
          wasDragged.current = true;
        }
      }}
      onDrag={(_e, { x, y }) => {
        /** Call onDrag */
        onDrag({
          x,
          y,
        });
      }}
    >
      <Wrapper ref={nodeRef}>
        <Point
          disabled={disabled}
          onClick={handleClick}
          onTouchEnd={handleClick}
        >
          {title}
        </Point>
      </Wrapper>
    </Draggable>
  );
});
