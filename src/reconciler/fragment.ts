import { PLUSNEW_FRAGMENT_TYPE, type ShadowFragmentElement, type ShadowElement } from "../types.js";
import type { Reconciler } from "./index.js";
import { arrayReconcileWithoutSorting, remove } from "./util.js";


export function isFragmentElement(
    shadowElement: ShadowElement,
  ): shadowElement is ShadowFragmentElement {
    return (
      typeof shadowElement === "object" &&
      "$$typeof" in shadowElement &&
       shadowElement.type === PLUSNEW_FRAGMENT_TYPE
    );
  }

  
export const fragmentReconcile: Reconciler = (
  parentElement,
  previousSibling,
  shadowCache,
  shadowElement,
) => {
  // Check if new shadow is of type dom-element
  if (isFragmentElement(shadowElement)) {
    // Check if old shadow is of same shadow-type
    if (isFragmentElement(shadowCache.value) === false) {
        remove(shadowCache);
    }

    return arrayReconcileWithoutSorting(
      parentElement,
      previousSibling,
      shadowCache,
      shadowElement.children.map(child => child()),
    );
  } else {
    return false;
  }
};
