import { type ShadowElement } from "../types.js";
import { arrayReconcile } from "./array.js";
import { hostReconcile } from "./host.js";
import { textReconcile } from "./text.js";

export type ShadowCache = {
  value: ShadowElement;
  node: Node | null;
  nestedShadows: ShadowCache[];
};

export function reconcile(
  parentElement: ParentNode,
  previousSibling: Node | null,
  shadowCache: ShadowCache,
  shadowElement: ShadowElement,
): Node | null {
  for (const reconciler of [hostReconcile, textReconcile, arrayReconcile]) {
    const result = reconciler(
      parentElement,
      previousSibling,
      shadowCache,
      shadowElement,
    );
    if (result !== false) {
      return result;
    }
  }
  throw new Error(
    "Could not find fitting reconciler for " + shadowElement.toString(),
  );
}
