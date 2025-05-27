import type { Reconciler } from "./index";

export const falseReconcile: Reconciler = (opt) => {
  if (opt.shadowElement === false) {
    if (opt.shadowCache.value !== false) {
      opt.shadowCache.remove();

      opt.shadowCache.value = false;
    }

    return opt.previousSibling;
  } else {
    return false;
  }
};
