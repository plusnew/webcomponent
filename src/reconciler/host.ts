import { untracked } from "@preact/signals-core";
import { active } from "../index";
import {
  PLUSNEW_ELEMENT_TYPE,
  type ShadowElement,
  type ShadowHostElement,
} from "../types";
import type { Reconciler } from "./index";
import { append, arrayReconcileWithoutSorting, remove } from "./util";
import { dispatchError } from "../utils";

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
      const element = untracked(() =>
        document.createElement(shadowElement.type),
      );

      shadowCache.node = element;
      shadowCache.value = {
        $$typeof: PLUSNEW_ELEMENT_TYPE,
        type: shadowElement.type,
        props: {},
        children: [],
      };
      shadowCache.unmount = () => {
        for (const propKey in (shadowCache.value as ShadowHostElement).props) {
          if (propKey.startsWith(EVENT_PREFIX)) {
            (shadowCache.node as any).removeEventListener(
              propKey.slice(EVENT_PREFIX.length),
              (shadowCache.value as ShadowHostElement).props[propKey],
            );
            delete (shadowCache.value as ShadowHostElement).props[propKey];
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
        if (propKey.startsWith(EVENT_PREFIX) === true) {
          if (shadowElement.type === "input" && propKey === "oninput") {
            const callback = shadowElement.props[propKey];
            shadowElement.props[propKey] = (
              evt: KeyboardEvent,
              ...args: any[]
            ) => {
              const newValue = (evt.currentTarget as HTMLInputElement).value;

              callback(evt, ...args);

              if (shadowElement.props.value !== newValue) {
                evt.preventDefault();
                (evt.currentTarget as HTMLInputElement).value =
                  shadowElement.props.value;
              }
            };
          }

          const eventName = propKey.slice(EVENT_PREFIX.length);
          if (propKey in (shadowCache.value as ShadowHostElement).props) {
            (shadowCache.node as Element).removeEventListener(
              eventName,
              (shadowCache.value as ShadowHostElement).props[propKey], // @TODO doesnt work for oninput
            );
          }

          (shadowCache.node as Element).addEventListener(
            eventName,
            shadowElement.type === "input" && propKey === "oninput"
              ? (evt: KeyboardEvent, ...args: any[]) => {
                  const newValue = (evt.currentTarget as HTMLInputElement)
                    .value;

                  shadowElement.props[propKey](evt, ...args);

                  if (shadowElement.props.value !== newValue) {
                    evt.preventDefault();
                    (evt.currentTarget as HTMLInputElement).value =
                      shadowElement.props.value;
                  }
                }
              : shadowElement.props[propKey],
          );
        } else {
          untracked(() => {
            (shadowCache.node as any)[propKey] = shadowElement.props[propKey];
          });
        }

        (shadowCache.value as ShadowHostElement).props[propKey] =
          shadowElement.props[propKey];
      }
    }

    // @TODO Remove unneded props

    const previousActiveElement = active.parentElement;
    active.parentElement = shadowCache.node as Element;

    const children: ShadowElement[] = [];
    for (const childCallback of shadowElement.children) {
      try {
        children.push(childCallback());
      } catch (error) {
        children.push(false);
        dispatchError(shadowCache.node as Element, error);
      }
    }
    active.parentElement = previousActiveElement;

    arrayReconcileWithoutSorting(
      shadowCache.node as ParentNode,
      null,
      shadowCache,
      children,
    );

    if (elementNeedsAppending) {
      append(parentElement, previousSibling, shadowCache.node as Node);
    }

    return shadowCache.node;
  } else {
    return false;
  }
};
