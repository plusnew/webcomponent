import { type ShadowElement } from "../types.js";
import { reconcile, type ShadowCache } from "./index.js";
import { remove } from "./util.js";

export function arrayReconcile(
  parentElement: ParentNode,
  previousSibling: Node | null,
  shadowCache: ShadowCache,
  shadowElement: ShadowElement,
) {
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
}
