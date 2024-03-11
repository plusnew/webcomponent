import { batch } from "@preact/signals-core";
import {
  PLUSNEW_ELEMENT_TYPE,
  type ShadowElement,
  type ShadowHostElement,
} from "../types.js";
import type { Reconciler } from "./index.js";
import { append, arrayReconcileWithoutSorting, remove } from "./util.js";
import { active } from "../index.js";

const EVENT_PREFIX = "on";

function isHostElement(
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
        key: shadowElement.props.key,
        props: {},
        children: [],
      };
      shadowCache.unmount = () => {
        for (const propKey in (shadowCache.value as ShadowHostElement).props) {
          if (propKey.startsWith(EVENT_PREFIX)) {
            (shadowCache.node as any)[propKey] = null;
            (shadowCache.value as ShadowHostElement).props[propKey] = null;
          }
        }
      };

      elementNeedsAppending = true;
    }

    for (const propKey in shadowElement.props) {
      // Only set value if needed
      if (
        (shadowCache.value as ShadowHostElement).props[propKey] !==
        shadowElement.props[propKey]
      ) {
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
        (shadowCache.value as ShadowHostElement).props[propKey] =
          shadowElement.props[propKey];
      }
    }

    // @TODO Remove unneded props

    const previousActiveElement = active.parentElement;
    active.parentElement = shadowCache.node as Element;

    arrayReconcileWithoutSorting(
      shadowCache.node as ParentNode,
      null,
      shadowCache,
      shadowElement.children.map((child) => child()),
    );

    active.parentElement = previousActiveElement;

    if (elementNeedsAppending) {
      append(parentElement, previousSibling, shadowCache.node as Node);
    }

    return shadowCache.node;
  } else {
    return false;
  }
};
