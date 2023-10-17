import type { ShadowCache } from "./index.js";

export function remove(oldShadowCache: ShadowCache) {
  if (oldShadowCache.node === null) {
    oldShadowCache.nestedShadows.forEach(remove);
  } else {
    oldShadowCache.node.parentNode?.removeChild(oldShadowCache.node);
  }
  oldShadowCache.node = null;
  oldShadowCache.nestedShadows = [];
}

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
