import { type ShadowElement } from "../types.js";
import { arrayReconcile } from "./array.js";
import { componentReconcile } from "./component.js";
import { falseReconcile } from "./false.js";
import { fragmentReconcile } from "./fragment.js";
import { hostReconcile } from "./host.js";
import { textReconcile } from "./text.js";

export type ShadowCache = {
  value: ShadowElement;
  node: Node | null;
  nestedShadows: ShadowCache[];
  unmount: (() => void) | null;
};

export type Reconciler = (
  parentElement: ParentNode,
  previousSibling: Node | null,
  shadowCache: ShadowCache,
  shadowElement: ShadowElement,
) => Node | null | false;

export function reconcile(
  parentElement: ParentNode,
  previousSibling: Node | null,
  shadowCache: ShadowCache,
  shadowElement: ShadowElement,
): Node | null {
  for (const reconciler of [
    hostReconcile,
    componentReconcile,
    fragmentReconcile,
    textReconcile,
    arrayReconcile,
    falseReconcile,
  ]) {
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
