import { type ShadowElement } from "../types";
import { arrayReconcile } from "./array";
import { componentReconcile } from "./component";
import { falseReconcile } from "./false";
import { fragmentReconcile } from "./fragment";
import { hostReconcile } from "./host";
import { textReconcile } from "./text";
import type { ShadowCache } from "./utils";

export type Reconciler = (opt: {
  parentElement: ParentNode,
  previousSibling: Node | null,
  shadowCache: ShadowCache,
  shadowElement: ShadowElement,
  getParentOverwrite: (() => Element) | null
}) => Node | null | false;

export function reconcile(opt: Parameters<Reconciler>[0]): Node | null {
  for (const reconciler of [
    fragmentReconcile,
    hostReconcile,
    componentReconcile,
    textReconcile,
    arrayReconcile,
    falseReconcile,
  ]) {
    const result = reconciler(opt);
    if (result !== false) {
      return result;
    }
  }
  throw new Error(
    "Could not find fitting reconciler for " + opt.shadowElement.toString(),
  );
}
