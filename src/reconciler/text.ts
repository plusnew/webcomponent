import type { Reconciler } from "./index.js";
import { append, remove } from "./util.js";

export const textReconcile: Reconciler = (
  parentElement,
  previousSibling,
  shadowCache,
  shadowElement,
) => {
  if (typeof shadowElement === "string") {
    if (typeof shadowCache.value === "string") {
      // Only update if needed
      if (shadowElement !== shadowCache.value) {
        (shadowCache.node as Text).textContent = shadowElement;
        shadowCache.value = shadowElement;
      }

      return shadowCache.node;
    } else {
      // remove old element
      remove(shadowCache);

      // create new element
      const element = document.createTextNode(shadowElement);
      append(parentElement, previousSibling, element);

      shadowCache.node = element;
      shadowCache.value = shadowElement;

      return element;
    }
  } else {
    return false;
  }
};
