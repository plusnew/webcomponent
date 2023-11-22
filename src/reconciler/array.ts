import type { Reconciler } from "./index.js";
import { arrayReconcileWithoutSorting, remove } from "./util.js";

export const arrayReconcile: Reconciler = (
  parentElement,
  previousSibling,
  shadowCache,
  shadowElement,
) => {
  if (Array.isArray(shadowElement)) {
    if (Array.isArray(shadowCache.value) === false) {
      remove(shadowCache);
    }
    shadowCache.value = [];

    return arrayReconcileWithoutSorting(
      parentElement,
      previousSibling,
      shadowCache,
      shadowElement,
    );
  } else {
    return false;
  }
};
