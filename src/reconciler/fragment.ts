import {
  PLUSNEW_ELEMENT_TYPE,
  Fragment,
  type ShadowElement,
  type ShadowHostElement,
} from "../types";
import type { Reconciler } from "./index";
import { arrayReconcileWithoutSorting, getChildren } from "./utils";

export function isFragmentElement(
  shadowElement: ShadowElement,
): shadowElement is ShadowHostElement {
  return (
    typeof shadowElement === "object" &&
    "$$typeof" in shadowElement &&
    shadowElement.$$typeof === PLUSNEW_ELEMENT_TYPE &&
    shadowElement.type === Fragment
  );
}

export const fragmentReconcile: Reconciler = (opt) => {
  // Check if new shadow is of type dom-element
  if (isFragmentElement(opt.shadowElement)) {
    // Check if old shadow is of same shadow-type
    if (isFragmentElement(opt.shadowCache.value) === false) {
      opt.shadowCache.remove();

      opt.shadowCache.value = {
        $$typeof: PLUSNEW_ELEMENT_TYPE,
        type: Fragment,
        props: {},
        children: [],
      };
    }

    const children = getChildren(
      opt.parentElement instanceof ShadowRoot
        ? opt.parentElement.host
        : (opt.parentElement as Element),
      opt.shadowElement.children,
    );

    return arrayReconcileWithoutSorting({
      parentElement: opt.parentElement,
      previousSibling: opt.previousSibling,
      shadowCache: opt.shadowCache,
      shadowElement: children,
      getParentOverwrite: opt.getParentOverwrite,
    });
  } else {
    return false;
  }
};
