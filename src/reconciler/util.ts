import type { ShadowElement } from "../types";
import { reconcile, type ShadowCache } from "./index";

export function unmount(oldShadowCache: ShadowCache) {
  if (oldShadowCache.unmount !== null) {
    oldShadowCache.unmount();
    oldShadowCache.unmount = null;
  }
  for (const nestedShadow of oldShadowCache.nestedShadows) {
    unmount(nestedShadow);
  }
  if (oldShadowCache.node !== null) {
    
  }
}

export function remove(oldShadowCache: ShadowCache) {
  unmount(oldShadowCache);

  if (oldShadowCache.node === null) {
    for (const nestedShadow of oldShadowCache.nestedShadows) {
      remove(nestedShadow);
    }
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
        unmount: null,
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
