import { createElement, lazy } from "react";

const TerminalFarmer = lazy(() => import("@/partials/TerminalFarmer"));

/**
 * Get all static properties from a class and its parent classes
 */
function getAllStaticProperties(Class) {
  const properties = {};
  let currentClass = Class;

  /* Walk up the prototype chain */
  while (currentClass && currentClass !== Function.prototype) {
    /* Get all static property names */
    const propertyNames = Object.getOwnPropertyNames(currentClass);

    /* Copy static properties except built-in ones */
    for (const key of propertyNames) {
      if (
        !["prototype", "length", "name", "constructor"].includes(key) &&
        !(key in properties)
      ) {
        properties[key] = currentClass[key];
      }
    }

    /* Move to parent class */
    currentClass = Object.getPrototypeOf(currentClass);
  }

  return properties;
}

export function createFarmer(FarmerClass, options) {
  return {
    FarmerClass,
    ...getAllStaticProperties(FarmerClass),
    netRequest: {
      origin: `https://${FarmerClass.host}`,
      domains: FarmerClass.domains,
    },
    component: createElement(TerminalFarmer),
    ...options,
  };
}
