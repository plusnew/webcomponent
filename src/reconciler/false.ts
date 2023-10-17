import { type ShadowElement } from "../types.js";
import { type ShadowCache } from "./index.js";
import { remove } from "./util.js";

export function falseReconcile(
  _parentElement: ParentNode,
  previousSibling: Node | null,
  shadowCache: ShadowCache,
  shadowElement: ShadowElement,
) {
  if (shadowElement === false) {
    if (shadowCache.value !== false) {
      remove(shadowCache);

      shadowCache.value = false;
    }

    return previousSibling;
  } else {
    return false;
  }
}
