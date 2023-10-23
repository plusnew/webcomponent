import type { Reconciler } from "./index.js";
import { reconcile } from "./index.js";
import { remove } from "./util.js";

export const arrayReconcile: Reconciler = (
  parentElement,
  previousSibling,
  shadowCache,
  shadowElement,
) => {
  if (Array.isArray(shadowElement)) {
    let lastAddedSibling = previousSibling;
    if (Array.isArray(shadowCache.value) === false) {
      remove(shadowCache);
    }
    shadowCache.value = [];

    let i = 0;
    while (i < shadowElement.length) {
      if (shadowCache.nestedShadows.length <= i) {
        shadowCache.nestedShadows.push({
          node: null,
          value: false,
          nestedShadows: [],
        });
      }
      lastAddedSibling = reconcile(
        parentElement,
        lastAddedSibling,
        shadowCache.nestedShadows[i],
        shadowElement[i],
      );
      i++;
    }
    while (i < shadowCache.nestedShadows.length) {
      remove(shadowCache.nestedShadows[i]);
      shadowCache.nestedShadows.splice(i, 1);
    }
    return lastAddedSibling;
  } else {
    return false;
  }
};
