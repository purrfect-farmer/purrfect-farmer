import Draggable from "react-draggable";
import styled from "styled-components";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useMirroredState from "@/hooks/useMirroredState";
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
  const [position, , dispatchAndSetPosition] = useMirroredState(
    "mini-app-toolbar:clicker-draggable",
    {
      x: 0,
      y: 0,
    }
  );

  const [points, setPoints] = useState([]);
  const [selectedPoint, , dispatchAndSetSelectedPoint] = useMirroredState(
    "mini-app-toolbar:clicker-selected-point",
    null
  );
  const [enabled, setEnabled] = useState(false);

  const [, dispatchAndToggleAutoClicks] = useMirroredCallback(
    "mini-app-toolbar:clicker-auto-clicks",
    () => setEnabled((prev) => !prev)
  );
  const [, dispatchAndAddPoint] = useMirroredCallback(
    "mini-app-toolbar:clicker-add-point",
    () => {
      setPoints((prev) => [
        ...prev,
        {
          x: Math.floor(window.innerWidth / 2),
          y: Math.floor(window.innerHeight / 2),
          interval: DEFAULT_INTERVAL,
          unit: DEFAULT_UNIT,
        },
      ]);
    },
    []
  );

  const [, dispatchAndRemovePoint] = useMirroredCallback(
    "mini-app-toolbar:clicker-remove-point",
    () => {
      setPoints((prev) => {
        const result = [...prev];

        result.pop();

        return result;
      });
    },
    []
  );

  const [, dispatchAndUpdatePointData] = useMirroredCallback(
    "mini-app-toolbar:clicker-update-point",
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
    if (!enabled) return;

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
  }, [enabled, points, clickPoint]);

  return (
    <>
      {/* Config */}
      {selectedPoint !== null ? (
        <AutoClickerPointConfig
          point={points[selectedPoint]}
          onOpenChange={() => dispatchAndSetSelectedPoint(null)}
          updatePoint={(data) =>
            dispatchAndUpdatePointData(selectedPoint, data)
          }
        />
      ) : null}

      {/* Points */}
      {points.map((point, index) => (
        <AutoClickerPoint
          key={index}
          title={index + 1}
          x={point.x}
          y={point.y}
          disabled={enabled}
          onDrag={(position) => dispatchAndUpdatePointData(index, position)}
          onClick={() => {
            dispatchAndSetSelectedPoint(index);
          }}
        />
      ))}

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
            {/* Start / Stop */}
            <Button
              title={enabled ? "Stop" : "Start"}
              onClick={() => dispatchAndToggleAutoClicks()}
              className={enabled ? "active" : ""}
            >
              {enabled ? <PauseIcon /> : <StartIcon />}
            </Button>

            {/* Add */}
            <Button
              disabled={enabled}
              title="Add Point"
              onClick={() => dispatchAndAddPoint()}
            >
              <PlusIcon />
            </Button>

            {/* Minus */}
            <Button
              disabled={enabled}
              title="Remove Point"
              onClick={() => dispatchAndRemovePoint()}
            >
              <MinusIcon />
            </Button>

            {/* Drag */}
            <Button disabled={enabled} className={dragHandleClass} title="Drag">
              <HandleIcon />
            </Button>
          </Container>
        </Draggable>
      </Wrapper>
    </>
  );
});
