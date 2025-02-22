import { createElement, lazy } from "react";

/** Create Lazy Element */
export const createLazyElement = (callback) => {
  return createElement(lazy(callback));
};
