import type { ShadowComponentElement, ShadowElement } from "../types.js";
import type { Reconciler } from "./index.js";
import { remove } from "./util.js";

export function isComponentElement(
  shadowElement: ShadowElement,
): shadowElement is ShadowComponentElement {
  return (
    typeof shadowElement === "object" &&
    "$$typeof" in shadowElement &&
    typeof shadowElement.type === "function"
  );
}

export const componentReconcile: Reconciler = (
  parentElement,
  previousSibling,
  shadowCache,
  shadowElement,
) => {
  // Check if new shadow is of type component-element
  if (isComponentElement(shadowElement)) {
    // Check if old shadow is of same shadow-type
    if (
      isComponentElement(shadowCache.value) &&
      shadowCache.value.type === shadowElement.type
    ) {
      // Nothing needs to be done
    } else {
      // remove old element
      remove(shadowCache);

      shadowCache.value = shadowElement;
    }
    return shadowElement.type(
      parentElement,
      previousSibling,
      shadowCache,
      shadowElement,
    );
  } else {
    return false;
  }
};
