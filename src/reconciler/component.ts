import { type ShadowComponentElement, type ShadowElement, PLUSNEW_ELEMENT_TYPE} from "../types";
import { reconcile, type Reconciler } from "./index";
import { ShadowCache } from "./utils";

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
      shadowCache.remove();

      shadowCache.value = shadowElement;
      shadowCache.nestedShadows = [new ShadowCache(false)]
    }
    

    const result = (shadowElement.type as any)({
      ...shadowElement.props,
      children: shadowElement.children.map((child) => child())
    }, { shadowCache });

    let nextSibling = reconcile(
      (shadowCache.node as ParentNode | null) ?? parentElement,
      shadowCache.node === null ? null : previousSibling,
      shadowCache.nestedShadows[0],
      result
    );

    return nextSibling;
  } else {
    return false;
  }
};
