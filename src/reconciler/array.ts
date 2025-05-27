import type { Reconciler } from "./index";
import { arrayReconcileWithoutSorting } from "./utils";

export const arrayReconcile: Reconciler = (opt) => {
  if (Array.isArray(opt.shadowElement)) {
    if (Array.isArray(opt.shadowCache.value) === false) {
      opt.shadowCache.remove();
    }
    opt.shadowCache.value = [];

    return arrayReconcileWithoutSorting({
      parentElement: opt.parentElement,
      previousSibling: opt.previousSibling,
      shadowCache: opt.shadowCache,
      shadowElement: opt.shadowElement,
      getParentOverwrite: opt.getParentOverwrite,
    });
  } else {
    return false;
  }
};
