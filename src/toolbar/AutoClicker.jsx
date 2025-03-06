import Draggable from "react-draggable";
import styled from "styled-components";
import {
  HiOutlineMinus,
  HiOutlinePause,
  HiOutlinePlay,
  HiOutlinePlus,
} from "react-icons/hi2";
import { RiDraggable } from "react-icons/ri";
import { customLogger, dispatchClickEventOnElement } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

import AutoClickerPoint from "./AutoClickerPoint";
import AutoClickerPointConfig from "./AutoClickerPointConfig";

const DEFAULT_INTERVAL = 100;
const DEFAULT_UNIT = "ms";
const CLICK_TIMEOUTS = {
  m: 60_000,
  s: 1000,
  ms: 1,
};

const Wrapper = styled.div`
  position: fixed;
  top: 0;
  right: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 99910;
`;

const Container = styled.div`
  background-color: black;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px;
  gap: 6px;
  font-size: 12px;
  border-radius: 999px;
  box-sizing: border-box;
  position: absolute;
  right: 100%;
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

  &:hover,
  &.active {
    background-color: oklch(0.78 0.16 64.67);
    color: black;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const PlusIcon = styled(HiOutlinePlus)`
  width: 16px;
  height: 16px;
`;

const MinusIcon = styled(HiOutlineMinus)`
  width: 16px;
  height: 16px;
`;

const HandleIcon = styled(RiDraggable)`
  width: 16px;
  height: 16px;
`;

const StartIcon = styled(HiOutlinePlay)`
  width: 16px;
  height: 16px;
`;

const PauseIcon = styled(HiOutlinePause)`
  width: 16px;
  height: 16px;
`;

export default memo(function AutoClicker() {
  const dragHandleClass = "draggable-handle";
  const nodeRef = useRef(null);
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  const [points, setPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [autoClick, setAutoClick] = useState(false);

  const toggleAutoClick = useCallback(() => setAutoClick((prev) => !prev));
  const addPoint = useCallback(() => {
    setPoints((prev) => [
      ...prev,
      {
        x: Math.floor(window.innerWidth / 2),
        y: Math.floor(window.innerHeight / 2),
        interval: DEFAULT_INTERVAL,
        unit: DEFAULT_UNIT,
      },
    ]);
  }, []);

  const removePoint = useCallback(() => {
    setPoints((prev) => {
      const result = [...prev];

      result.pop();

      return result;
    });
  }, []);

  const updatePointData = useCallback(
    (index, data) =>
      setPoints((prev) =>
        prev.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                ...data,
              }
            : item
        )
      ),
    []
  );

  const clickPoint = useCallback((point) => {
    /** Get Element */
    const element = document.elementFromPoint(point.x, point.y);

    /** Click */
    dispatchClickEventOnElement(element, {
      clientX: point.x,
      clientY: point.y,
    });

    /** Log */
    customLogger("AUTO-CLICKER", point, element);
  }, []);

  /** Start Clicking */
  useEffect(() => {
    if (!autoClick) return;

    /** Initial Click */
    points.forEach(clickPoint);

    /** Set Intervals */
    const intervals = points.map((point) =>
      setInterval(
        clickPoint,
        point.interval * CLICK_TIMEOUTS[point.unit],
        point
      )
    );

    return () => {
      /** Clear Intervals */
      intervals.forEach((interval) => clearInterval(interval));
    };
  }, [autoClick, points, clickPoint]);

  return (
    <>
      {/* Config */}
      {selectedPoint !== null ? (
        <AutoClickerPointConfig
          point={points[selectedPoint]}
          onOpenChange={() => setSelectedPoint(null)}
          updatePoint={(data) => updatePointData(selectedPoint, data)}
        />
      ) : null}

      {/* Points */}
      {points.map((point, index) => (
        <AutoClickerPoint
          key={index}
          title={index + 1}
          x={point.x}
          y={point.y}
          disabled={autoClick}
          onDrag={(position) => updatePointData(index, position)}
          onClick={() => {
            setSelectedPoint(index);
          }}
        />
      ))}

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
            {/* Start / Stop */}
            <Button
              title={autoClick ? "Stop" : "Start"}
              onClick={toggleAutoClick}
              className={autoClick ? "active" : ""}
            >
              {autoClick ? <PauseIcon /> : <StartIcon />}
            </Button>

            {/* Add */}
            <Button disabled={autoClick} title="Add Point" onClick={addPoint}>
              <PlusIcon />
            </Button>

            {/* Minus */}
            <Button
              disabled={autoClick}
              title="Remove Point"
              onClick={removePoint}
            >
              <MinusIcon />
            </Button>

            {/* Drag */}
            <Button
              disabled={autoClick}
              className={dragHandleClass}
              title="Drag"
            >
              <HandleIcon />
            </Button>
          </Container>
        </Draggable>
      </Wrapper>
    </>
  );
});
