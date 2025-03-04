import type { Reconciler } from "./index";
import { remove } from "./util";

export const falseReconcile: Reconciler = (
  _parentElement,
  previousSibling,
  shadowCache,
  shadowElement,
  // abortSignal,
) => {
  if (shadowElement === false) {
    if (shadowCache.value !== false) {
      remove(shadowCache);

      shadowCache.value = false;
    }

    return previousSibling;
  } else {
    return false;
  }
};
