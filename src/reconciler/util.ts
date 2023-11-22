import type { ShadowElement } from "../types.js";
import { reconcile, type ShadowCache } from "./index.js";

export function remove(oldShadowCache: ShadowCache) {
  if (oldShadowCache.node === null) {
    oldShadowCache.nestedShadows.forEach(remove);
  } else {
    oldShadowCache.node.parentNode?.removeChild(oldShadowCache.node);
  }
  oldShadowCache.node = null;
  oldShadowCache.nestedShadows = [];
}

export const arrayReconcileWithoutSorting = (
  parentElement: ParentNode,
  previousSibling: Node | null,
  shadowCache: ShadowCache,
  shadowElement: ShadowElement[],
) => {
  let lastAddedSibling = previousSibling;

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
};

export function append(
  parentElement: ParentNode,
  previousSibling: Node | null,
  target: Node,
) {
  if (previousSibling === null) {
    parentElement.insertBefore(target, parentElement.firstChild);
  } else {
    parentElement.insertBefore(target, previousSibling.nextSibling);
  }
}
