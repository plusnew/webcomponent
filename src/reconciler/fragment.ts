import { PLUSNEW_ELEMENT_TYPE, Fragment, type ShadowElement, type ShadowHostElement } from "../types";
import type { Reconciler } from "./index";
import { arrayReconcileWithoutSorting } from "./utils";


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
        shadowCache.remove();
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
