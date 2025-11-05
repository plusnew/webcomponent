import {
  type ShadowComponentElement,
  type ShadowElement,
  PLUSNEW_ELEMENT_TYPE,
} from "../types";
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

export const componentReconcile: Reconciler = (opt) => {
  // Check if new shadow is of type component-element
  if (isComponentElement(opt.shadowElement)) {
    // Check if old shadow is of same shadow-type
    if (
      isComponentElement(opt.shadowCache.value) &&
      opt.shadowCache.value.type === opt.shadowElement.type
    ) {
      // Nothing needs to be done
    } else {
      // remove old element
      opt.shadowCache.remove();

      opt.shadowCache.value = opt.shadowElement;
      opt.shadowCache.nestedShadows = [new ShadowCache(false)];
    }

    const result = (opt.shadowElement.type as any)(
      {
        ...opt.shadowElement.props,
        children: opt.shadowElement.children.map((child) => child()),
      },
      { shadowCache: opt.shadowCache, parentElement: opt.parentElement },
    );

    let nextSibling = reconcile({
      parentElement:
        (opt.shadowCache.node as ParentNode | null) ?? opt.parentElement,
      previousSibling:
        opt.shadowCache.node === null ? null : opt.previousSibling,
      shadowCache: opt.shadowCache.nestedShadows[0],
      shadowElement: result,
      getParentOverwrite: opt.shadowCache.getParentOverwrite,
    });

    return nextSibling;
  } else {
    return false;
  }
};
