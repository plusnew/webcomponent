import { untracked } from "@preact/signals-core";
import { active, getParentSymbol } from "../index";
import {
  PLUSNEW_ELEMENT_TYPE,
  type ShadowElement,
  type ShadowHostElement,
} from "../types";
import type { Reconciler } from "./index";
import { append, arrayReconcileWithoutSorting } from "./utils";
import { dispatchError } from "../utils";

const EVENT_PREFIX = "on";

function isHostElement(
  shadowElement: ShadowElement,
): shadowElement is ShadowHostElement {
  return (
    typeof shadowElement === "object" &&
    "$$typeof" in shadowElement &&
    (typeof shadowElement.type === "string" || Element.isPrototypeOf(shadowElement.type))
  );
}

export const hostReconcile: Reconciler = (opt) => {
  // Check if new shadow is of type dom-element
  if (isHostElement(opt.shadowElement)) {
    // Check if old shadow is of same shadow-type
    let elementNeedsAppending = null;
    if (
      isHostElement(opt.shadowCache.value) &&
      opt.shadowCache.value.type === opt.shadowElement.type
    ) {
      // Nothing needs to be done
    } else {
      // remove old element
      opt.shadowCache.remove();

      // create new element
      const element = untracked(() => {
        const shadowElement = opt.shadowElement as ShadowHostElement;
        return typeof shadowElement.type === "string" ? document.createElement(shadowElement.type) : new (shadowElement.type)();
      });

      opt.shadowCache.node = element;
      opt.shadowCache.value = {
        $$typeof: PLUSNEW_ELEMENT_TYPE,
        type: opt.shadowElement.type,
        props: {},
        children: [],
      };
      opt.shadowCache.unmount = function () {
        delete (this.node as any)[getParentSymbol];
        delete (this as any).unmount;
        for (const propKey in (this.value as ShadowHostElement).props) {
          if (propKey.startsWith(EVENT_PREFIX)) {
            (this.node as any).removeEventListener(
              propKey.slice(EVENT_PREFIX.length),
              (this.value as ShadowHostElement).props[propKey],
            );
            delete (this.value as ShadowHostElement).props[propKey];
          }
        }
        this.unmount();
      };

      elementNeedsAppending = true;
    }

    if (opt.getParentOverwrite !== null) {
      (opt.shadowCache.node as any)[getParentSymbol] = opt.getParentOverwrite;
    }

    for (const propKey in opt.shadowElement.props) {
      // Only set value if needed
      if (
        (opt.shadowCache.value as ShadowHostElement).props[propKey] !==
        opt.shadowElement.props[propKey]
      ) {
        if (propKey.startsWith(EVENT_PREFIX) === true) {
          if (opt.shadowElement.type === "input" && propKey === "oninput") {
            const callback = opt.shadowElement.props[propKey];
            opt.shadowElement.props[propKey] = (
              evt: KeyboardEvent,
              ...args: any[]
            ) => {
              const newValue = (evt.currentTarget as HTMLInputElement).value;

              callback(evt, ...args);

              if ((opt.shadowElement as ShadowHostElement).props.value !== newValue) {
                evt.preventDefault();
                (evt.currentTarget as HTMLInputElement).value =
                  (opt.shadowElement as ShadowHostElement).props.value;
              }
            };
          }

          const eventName = propKey.slice(EVENT_PREFIX.length);
          if (propKey in (opt.shadowCache.value as ShadowHostElement).props) {
            (opt.shadowCache.node as Element).removeEventListener(
              eventName,
              (opt.shadowCache.value as ShadowHostElement).props[propKey], // @TODO doesnt work for oninput
            );
          }

          (opt.shadowCache.node as Element).addEventListener(
            eventName,
            opt.shadowElement.type === "input" && propKey === "oninput"
              ? (evt: KeyboardEvent, ...args: any[]) => {
                  const shadowElement = opt.shadowElement as ShadowHostElement;
                  const newValue = (evt.currentTarget as HTMLInputElement)
                    .value;

                  shadowElement.props[propKey](evt, ...args);

                  if (shadowElement.props.value !== newValue) {
                    evt.preventDefault();
                    (evt.currentTarget as HTMLInputElement).value =
                      shadowElement.props.value;
                  }
                }
              : (opt.shadowElement).props[propKey],
          );
        } else {
          untracked(() => {
             if(propKey === "style") {
                (opt.shadowCache.node as any).setAttribute("style", Object.entries((opt.shadowElement as ShadowHostElement).props[propKey]).map(([key, value]) => `${key}: ${value}`).join(";"));
             } else {
                (opt.shadowCache.node as any)[propKey] = (opt.shadowElement as ShadowHostElement).props[propKey];
            }
          });
        }

        (opt.shadowCache.value as ShadowHostElement).props[propKey] =
          opt.shadowElement.props[propKey];
      }
    }

    // @TODO Remove unneded props

    const previousActiveElement = active.parentElement;
    active.parentElement = opt.shadowCache.node as Element;

    const children: ShadowElement[] = [];
    for (const childCallback of opt.shadowElement.children) {
      try {
        children.push(childCallback());
      } catch (error) {
        children.push(false);
        dispatchError(opt.shadowCache.node as Element, error);
      }
    }
    active.parentElement = previousActiveElement;

    arrayReconcileWithoutSorting({
      parentElement: opt.shadowCache.node as ParentNode,
      previousSibling: null,
      shadowCache: opt.shadowCache,
      shadowElement: children,
      getParentOverwrite: null,
    });

    if (elementNeedsAppending) {
      append(opt.parentElement, opt.previousSibling, opt.shadowCache.node as Node);
    }

    return opt.shadowCache.node;
  } else {
    return false;
  }
};
