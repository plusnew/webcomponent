import type { ShadowElement } from "../types";
import { reconcile } from "./index";

export class ShadowCache {
  value: ShadowElement;
  node: Node | null = null;
  nestedShadows: ShadowCache[] = [];
  getParentOverwrite: (() => Element) | null = null;
  abortController: AbortController | null = null;

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
    if (this.abortController !== null) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.value = false;

    for (const nestedShadow of this.nestedShadows) {
      nestedShadow.unmount();
    }
  }
}

export const arrayReconcileWithoutSorting = (opt: {
  parentElement: ParentNode;
  previousSibling: Node | null;
  shadowCache: ShadowCache;
  shadowElement: ShadowElement[];
  getParentOverwrite: (() => Element) | null;
}) => {
  let lastAddedSibling = opt.previousSibling;

  let i = 0;
  while (i < opt.shadowElement.length) {
    if (opt.shadowCache.nestedShadows.length <= i) {
      opt.shadowCache.nestedShadows.push(new ShadowCache(false));
    }
    lastAddedSibling = reconcile({
      parentElement: opt.parentElement,
      previousSibling: lastAddedSibling,
      shadowCache: opt.shadowCache.nestedShadows[i],
      shadowElement: opt.shadowElement[i],
      getParentOverwrite: opt.getParentOverwrite,
    });
    i++;
  }
  while (i < opt.shadowCache.nestedShadows.length) {
    opt.shadowCache.nestedShadows[i].remove();
    opt.shadowCache.nestedShadows.splice(i, 1);
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
