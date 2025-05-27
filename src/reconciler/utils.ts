import type { ShadowElement } from "../types";
import { reconcile } from "./index";

export  class ShadowCache {
  value: ShadowElement;
  node: Node | null = null;
  nestedShadows: ShadowCache[] = []

  constructor(value: ShadowElement) {
    this.value = value;
  }
  remove() {
    this.unmount();


    if (this.node === null) {
      for (const nestedShadow of this.nestedShadows) {
        nestedShadow.remove();
      }
    } else {
      this.node.parentNode?.removeChild(this.node);
    }

    this.node = null;
    this.nestedShadows = [];
  }
  unmount() {
    for (const nestedShadow of this.nestedShadows) {
      nestedShadow.unmount();
    }
  }
};

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
      shadowCache.nestedShadows.push(new ShadowCache(false));
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
    shadowCache.nestedShadows[i].remove();
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
