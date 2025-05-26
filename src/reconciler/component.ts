import { active } from "..";
import { type ShadowComponentElement, type ShadowElement, PLUSNEW_ELEMENT_TYPE} from "../types";
import { reconcile, type Reconciler } from "./index";
import { remove } from "./util";

export function isComponentElement(
  shadowElement: ShadowElement,
): shadowElement is ShadowComponentElement<{}> {
  return (
    typeof shadowElement === "object" &&
    "$$typeof" in shadowElement &&
    shadowElement.$$typeof === PLUSNEW_ELEMENT_TYPE &&
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
      shadowCache.nestedShadows = [{
        value: false as const,
        node: null,
        nestedShadows: [],
        unmount: null,
      }]
    }
    
    if (active.parentElement === null){
      throw new Error("there is currently nothing rendering");
    }

    const previousActiveElement = active.parentElement;
    const result = shadowElement.type({
      ...shadowElement.props,
      children: shadowElement.children.map((child) => child())
    });
    let nextSibling = reconcile(
      active.parentElement,
      active.parentElement === previousActiveElement ? previousSibling : null,
      shadowCache.nestedShadows[0],
      result
    );

    if (active.parentElement !== previousActiveElement) {
      nextSibling = previousSibling;
      active.parentElement;
    }

    return nextSibling;
  } else {
    return false;
  }
};
