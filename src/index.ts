import { effect, Signal, signal } from "@preact/signals-core";
import { reconcile } from "./reconciler/index";
import { ShadowCache } from "./reconciler/utils";
import type {
  CustomEvents,
  ForbiddenHTMLProperties,
  ReadonlyKeys,
  ShadowElement,
} from "./types";
import {
  connectedCallback,
  disconnectedCallback,
  parentsCacheSymbol,
  PlusnewErrorEvent,
  active,
  addEventListener,
  removeEventListener,
} from "./utils";

export type { ShadowElement } from "./types";
export { active, connectedCallback, disconnectedCallback } from "./utils";

export function mount(
  render: () => ShadowElement,
  parent: HTMLElement,
): () => void {
  const shadowResult: ShadowCache = new ShadowCache(false);

  const disconnect = effect(() => {
    active.parentElement = parent;

    reconcile({
      parentElement: parent,
      previousSibling: null,
      shadowCache: shadowResult,
      shadowElement: render(),
      getParentOverwrite: null,
    });
  });

  return () => {
    disconnect();
    shadowResult.remove();
  };
}

export function createComponent<
  T extends HTMLElement & { render: (this: T) => ShadowElement },
>(
  name: string,
  Component: { new (): T },
): {
  new (
    properties: Omit<
      { [K in keyof T]?: T[K] } & {
        [K in keyof T as undefined extends T[K]
          ? never
          : K extends keyof HTMLElement
            ? never
            : K]-?: T[K];
      },
      | ReadonlyKeys<T>
      | ForbiddenHTMLProperties
      | keyof {
          [K in keyof T as T[K] extends Function
            ? K extends `on${any}`
              ? never
              : K
            : never]: K;
        }
    > & {
      children?: ShadowElement;
      onplusnewerror?: (evt: PlusnewErrorEvent) => void;
    },
  ): T;
} {
  if ("connectedCallback" in Component.prototype === false) {
    Component.prototype.connectedCallback = connectedCallback;
  }

  if ("disconnectedCallback" in Component.prototype === false) {
    Component.prototype.disconnectedCallback = disconnectedCallback;
  }

  Component.prototype.addEventListener = addEventListener;
  Component.prototype.removeEventListener = removeEventListener;

  customElements.define(name, Component as any);

  return name as any;
}

export const getParentSymbol = Symbol("getParent");

export function findParent<T = Element>(
  needle: { new (args: any): T } | string,
  haystack?: Element,
): T {
  function getParent(element: Element) {
    if (getParentSymbol in element) {
      return (element as any)[getParentSymbol]();
    }

    const parentNode =
      element.assignedSlot === null
        ? element.parentNode instanceof ShadowRoot
          ? element.parentNode.host
          : element.parentElement
        : element.assignedSlot;

    if (parentNode === null) {
      throw new Error(`Could not find parent ${needle.toString()}`);
    }

    return parentNode;
  }

  let target;
  if (haystack === undefined) {
    if (active.parentElement === null) {
      throw new Error("No element is being rendered currently");
    } else {
      target = active.parentElement;
    }
  } else {
    target = haystack;
  }

  if (
    (typeof needle === "string" && target.tagName === needle.toUpperCase()) ||
    (typeof needle === "function" && target instanceof needle)
  ) {
    return target as T;
  }

  if (parentsCacheSymbol in target) {
    const parentsCacheMap = target[parentsCacheSymbol] as any;
    if (parentsCacheMap.has(needle) === false) {
      parentsCacheMap.set(needle, findParent(needle, getParent(target)));
    }
    return parentsCacheMap.get(needle);
  } else {
    return findParent(needle, getParent(target));
  }
}

export function dispatchEvent<
  T extends HTMLElement,
  U extends keyof CustomEvents<T>,
>(
  target: T,
  eventName: U,
  customEventInit: CustomEventInit<CustomEvents<T>[U]>,
): Promise<unknown>[] {
  const previousEventPromises = active.eventPromises;
  const eventPromises: Promise<unknown>[] = [];
  active.eventPromises = eventPromises;
  const customEvent = new CustomEvent(eventName as string, customEventInit);
  target.dispatchEvent(customEvent);

  active.eventPromises = previousEventPromises;

  return eventPromises;
}

export function prop() {
  return <T, U>(
    decoratorTarget: ClassAccessorDecoratorTarget<T, U>,
    accessor: ClassAccessorDecoratorContext<T, U>,
  ): ClassAccessorDecoratorResult<T, U> => {
    return {
      set: function (value) {
        if (accessor.access.has(this)) {
          (decoratorTarget.get.call(this) as Signal<U>).value = value;
        } else {
          decoratorTarget.set.call(this, signal(value) as U);
        }
      },
      get: function () {
        return (decoratorTarget.get.call(this) as Signal<U>).value;
      },
      init(value) {
        return signal(value) as U;
      },
    };
  };
}
