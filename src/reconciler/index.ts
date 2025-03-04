import { type ShadowElement } from "../types";
import { arrayReconcile } from "./array";
import { componentReconcile } from "./component";
import { falseReconcile } from "./false";
import { fragmentReconcile } from "./fragment";
import { hostReconcile } from "./host";
import { textReconcile } from "./text";

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
    fragmentReconcile,
    hostReconcile,
    componentReconcile,
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
