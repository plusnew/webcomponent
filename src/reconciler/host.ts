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
):
  | { type: "attribute"; key: string }
  | { type: "property"; key: string }
  | { type: "event"; key: string }
  | { type: "inputevent"; key: string } {
  if (key.startsWith(EVENT_PREFIX)) {
    const eventName = key.slice(EVENT_PREFIX.length);
    if (type === "input") {
      return { type: "inputevent", key: eventName };
    } else {
      return { type: "event", key: eventName };
    }
  } else if (key in CLASS_MAP === true) {
    return { type: "attribute", key: (CLASS_MAP as any)[key] };
  } else if (typeof type === "string") {
    if (type === "svg" || type.startsWith("svg:")) {
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

    const inputEvent = getPropertyKind(
      (opt.shadowCache.value as ShadowHostElement).type,
      "oninput",
    );
    if (inputEvent.type === "inputevent") {
      (opt.shadowCache.node as Element).addEventListener(
        inputEvent.key,
        (evt: Event) => {
          const shadowElement = opt.shadowElement as ShadowHostElement;
          const newValue = (evt.currentTarget as HTMLInputElement).value;

          shadowElement.props[`${EVENT_PREFIX}${inputEvent.key}`](evt);

          if (shadowElement.props.value !== newValue) {
            evt.preventDefault();
            (evt.currentTarget as HTMLInputElement).value =
              shadowElement.props.value;
          }
        },
        { signal: opt.shadowCache.abortController?.signal },
      );
    }

    for (const propKey in opt.shadowElement.props) {
      // Only set value if changed
      if (
        (opt.shadowCache.value as ShadowHostElement).props[propKey] !==
        opt.shadowElement.props[propKey]
      ) {
        const kind = getPropertyKind(
          (opt.shadowCache.value as ShadowHostElement).type,
          propKey,
        );

        untracked(() => {
          switch (kind.type) {
            case "attribute":
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
              break;
            case "property":
              (opt.shadowCache.node as any)[kind.key] = (
                opt.shadowElement as ShadowHostElement
              ).props[propKey];
              break;
            case "event":
              if (
                propKey in (opt.shadowCache.value as ShadowHostElement).props
              ) {
                (opt.shadowCache.node as Element).removeEventListener(
                  kind.key,
                  (opt.shadowCache.value as ShadowHostElement).props[propKey],
                );
              }
              (opt.shadowCache.node as Element).addEventListener(
                kind.key,
                (opt.shadowElement as ShadowHostElement).props[propKey],
                { signal: opt.shadowCache.abortController?.signal },
              );
              break;
          }
        });
        (opt.shadowCache.value as ShadowHostElement).props[propKey] = (
          opt.shadowElement as ShadowHostElement
        ).props[propKey];
      }
    }

    for (const propKey in (opt.shadowCache.value as ShadowHostElement).props) {
      if (propKey in opt.shadowElement.props === false) {
        const kind = getPropertyKind(
          (opt.shadowCache.value as ShadowHostElement).type,
          propKey,
        );

        untracked(() => {
          switch (kind.type) {
            case "attribute":
              (opt.shadowCache.node as Element).removeAttribute(kind.key);
              break;
            case "event":
              (opt.shadowCache.node as Element).removeEventListener(
                kind.key,
                (opt.shadowCache.value as ShadowHostElement).props[propKey],
              );
              break;
          }
        });
        delete (opt.shadowCache.value as ShadowHostElement).props[propKey];
      }
    }

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
