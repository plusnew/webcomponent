import type { Reconciler } from "./index";
import { append } from "./utils";

export const textReconcile: Reconciler = (opt) => {
  if (typeof opt.shadowElement === "string") {
    if (typeof opt.shadowCache.value === "string") {
      // Only update if needed
      if (opt.shadowElement !== opt.shadowCache.value) {
        (opt.shadowCache.node as Text).textContent = opt.shadowElement;
        opt.shadowCache.value = opt.shadowElement;
      }

      return opt.shadowCache.node;
    } else {
      // remove old element
      opt.shadowCache.remove();

      // create new element
      const element = document.createTextNode(opt.shadowElement);
      append(opt.parentElement, opt.previousSibling, element);

      opt.shadowCache.node = element;
      opt.shadowCache.value = opt.shadowElement;

      return element;
    }
  } else {
    return false;
  }
};
