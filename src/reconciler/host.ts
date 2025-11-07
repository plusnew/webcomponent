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
    (typeof shadowElement.type === "string" ||
      Element.isPrototypeOf(shadowElement.type))
  );
}

const CLASS_MAP = { className: "class", style: "style" };
function getPropertyKind(
  type: ShadowHostElement["type"],
  key: string,
): { type: "attribute"; key: string } | { type: "property"; key: string } {
  if (typeof type === "string") {
    if (key in CLASS_MAP === true) {
      return { type: "attribute", key: (CLASS_MAP as any)[key] };
    } else if (type === "svg" || type.startsWith("svg:")) {
      return { type: "attribute", key };
    } else {
      return { type: "property", key };
    }
  } else {
    return { type: "property", key: key };
  }
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
      opt.shadowCache.abortController = new AbortController();

      // create new element
      const element = untracked(() => {
        const shadowElement = opt.shadowElement as ShadowHostElement;

        if (typeof shadowElement.type === "string") {
          const elementParts = shadowElement.type.split(":");
          if (
            elementParts.length === 2 ||
            (elementParts.length === 1 && elementParts[0] === "svg")
          ) {
            if (elementParts[0] === "svg") {
              return document.createElementNS(
                "http://www.w3.org/2000/svg",
                elementParts[elementParts.length - 1],
              );
            } else {
              throw new Error(`Unsupported namespace: ${elementParts[0]}`);
            }
          } else if (elementParts.length === 1) {
            return document.createElement(shadowElement.type);
          } else {
            throw new Error("element cant have several namespaces");
          }
        }
        return new shadowElement.type();
      });

      opt.shadowCache.node = element;
      opt.shadowCache.value = {
        $$typeof: PLUSNEW_ELEMENT_TYPE,
        type: opt.shadowElement.type,
        props: {},
        children: [],
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
          if (
            propKey in (opt.shadowCache.value as ShadowHostElement).props ===
            false
          ) {
            const eventName = propKey.slice(EVENT_PREFIX.length);

            (opt.shadowCache.node as Element).addEventListener(
              eventName,
              opt.shadowElement.type === "input" && propKey === "oninput"
                ? (evt: KeyboardEvent, ...args: any[]) => {
                    const shadowElement =
                      opt.shadowElement as ShadowHostElement;
                    const newValue = (evt.currentTarget as HTMLInputElement)
                      .value;

                    shadowElement.props[propKey](evt, ...args);

                    if (shadowElement.props.value !== newValue) {
                      evt.preventDefault();
                      (evt.currentTarget as HTMLInputElement).value =
                        shadowElement.props.value;
                    }
                  }
                : opt.shadowElement.props[propKey],
              { signal: opt.shadowCache.abortController?.signal },
            );
          }
        } else {
          untracked(() => {
            const kind = getPropertyKind(
              (opt.shadowCache.value as ShadowHostElement).type,
              propKey,
            );

            if (kind.type === "attribute") {
              (opt.shadowCache.node as Element).setAttribute(
                kind.key,
                kind.key === "style"
                  ? Object.entries(
                      (opt.shadowElement as ShadowHostElement).props[propKey],
                    )
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(";")
                  : (opt.shadowElement as ShadowHostElement).props[propKey],
              );
            } else if (kind.type === "property") {
              (opt.shadowCache.node as any)[kind.key] = (
                opt.shadowElement as ShadowHostElement
              ).props[propKey];
            }
          });
        }

        (opt.shadowCache.value as ShadowHostElement).props[propKey] = (
          opt.shadowElement as ShadowHostElement
        ).props[propKey];
      }
    }

    for (const propKey in (opt.shadowCache.value as ShadowHostElement).props) {
      if (propKey in opt.shadowElement.props === false) {
        untracked(() => {
          if (propKey === "style") {
            (opt.shadowCache.node as any).removeAttribute("style");
          }
        });
        delete (opt.shadowCache.value as ShadowHostElement).props[propKey];
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
      append(
        opt.parentElement,
        opt.previousSibling,
        opt.shadowCache.node as Node,
      );
    }

    return opt.shadowCache.node;
  } else {
    return false;
  }
};
