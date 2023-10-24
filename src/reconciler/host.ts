import { batch } from "@preact/signals-core";
import {
  PLUSNEW_ELEMENT_TYPE,
  type ShadowElement,
  type ShadowHostElement,
} from "../types.js";
import type { Reconciler } from "./index.js";
import { reconcile } from "./index.js";
import { append, remove } from "./util.js";

export const EVENT_PREFIX = "on";

export function isHostElement(
  shadowElement: ShadowElement,
): shadowElement is ShadowHostElement {
  return (
    typeof shadowElement === "object" &&
    "$$typeof" in shadowElement &&
    typeof shadowElement.type === "string"
  );
}

export const hostReconcile: Reconciler = (
  parentElement,
  previousSibling,
  shadowCache,
  shadowElement,
) => {
  // Check if new shadow is of type dom-element
  if (isHostElement(shadowElement)) {
    // Check if old shadow is of same shadow-type
    let elementNeedsAppending = null;
    if (
      isHostElement(shadowCache.value) &&
      shadowCache.value.type === shadowElement.type
    ) {
      // Nothing needs to be done
    } else {
      // remove old element
      remove(shadowCache);

      // create new element
      const element = document.createElement(shadowElement.type);

      shadowCache.node = element;
      shadowCache.value = {
        $$typeof: PLUSNEW_ELEMENT_TYPE,
        type: shadowElement.type,
        key: shadowElement.key,
        props: {},
        children: [],
      };

      elementNeedsAppending = true;
    }

    for (const propKey in shadowElement.props) {
      // Only set value if needed
      if (shadowCache.value.props[propKey] !== shadowElement.props[propKey]) {
        (shadowCache.node as any)[propKey] =
          propKey.startsWith(EVENT_PREFIX) === true
            ? shadowElement.type === "input" && propKey === "oninput"
              ? (evt: KeyboardEvent, ...args: any[]) => {
                  const newValue = (evt.currentTarget as HTMLInputElement)
                    .value;

                  batch(() => {
                    shadowElement.props[propKey](evt, ...args);
                  });

                  if (shadowElement.props.value !== newValue) {
                    evt.preventDefault();
                    (evt.currentTarget as HTMLInputElement).value =
                      shadowElement.props.value;
                  }
                }
              : (...args: any[]) => {
                  batch(() => {
                    shadowElement.props[propKey](...args);
                  });
                }
            : shadowElement.props[propKey];
        shadowCache.value.props[propKey] = shadowElement.props[propKey];
      }
    }

    // @TODO Remove unneded props

    let lastAddedSibling: Node | null = null;
    let i = 0;

    while (i < shadowElement.children.length) {
      if (shadowCache.nestedShadows.length <= i) {
        shadowCache.nestedShadows.push({
          node: null,
          value: false,
          nestedShadows: [],
        });
      }
      lastAddedSibling = reconcile(
        shadowCache.node as ParentNode,
        lastAddedSibling,
        shadowCache.nestedShadows[i],
        shadowElement.children[i],
      );
      i++;
    }

    while (i < shadowCache.nestedShadows.length) {
      remove(shadowCache.nestedShadows[i]);
      shadowCache.nestedShadows.splice(i, 1);
    }

    if (elementNeedsAppending) {
      append(parentElement, previousSibling, shadowCache.node as Node);
    }

    return shadowCache.node;
  } else {
    return false;
  }
};
