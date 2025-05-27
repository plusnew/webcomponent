import type { Reconciler } from "./index";

export const falseReconcile: Reconciler = (
  _parentElement,
  previousSibling,
  shadowCache,
  shadowElement,
  // abortSignal,
) => {
  if (shadowElement === false) {
    if (shadowCache.value !== false) {
      shadowCache.remove();

      shadowCache.value = false;
    }

    return previousSibling;
  } else {
    return false;
  }
};
