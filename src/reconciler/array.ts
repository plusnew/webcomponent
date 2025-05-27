import type { Reconciler } from "./index";
import { arrayReconcileWithoutSorting } from "./utils";

export const arrayReconcile: Reconciler = (
  parentElement,
  previousSibling,
  shadowCache,
  shadowElement,
) => {
  if (Array.isArray(shadowElement)) {
    if (Array.isArray(shadowCache.value) === false) {
      shadowCache.remove();
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
