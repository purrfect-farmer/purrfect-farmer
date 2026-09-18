import Decimal from "decimal.js";

/** A drop figure is a string, and a drop that reports nothing yields a dash */
export const formatFigure = (value) => {
  try {
    return new Decimal(value || 0).toFixed(2);
  } catch {
    return "-.--";
  }
};

/** Whether the drop reports a figure above zero */
export const hasValue = (value) => {
  try {
    return new Decimal(value || 0).greaterThan(0);
  } catch {
    return false;
  }
};

/** Whether the pool has reached the drop's minimum, as the server decides it */
export const isWithdrawable = (snapshot, minimum) => {
  if (!minimum) return false;

  try {
    return new Decimal(snapshot.balance || 0).greaterThanOrEqualTo(minimum);
  } catch {
    return false;
  }
};
