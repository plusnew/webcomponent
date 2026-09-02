import { effect, Signal, signal } from "@preact/signals-core";
import { reconcile } from "./reconciler/index";
import { ShadowCache } from "./reconciler/utils";
import type { CustomEvents, ShadowElement } from "./types";
import { parentsCacheSymbol, active } from "./utils";

export type { ShadowElement } from "./types";
export { active, WebComponent, type BasePropsType } from "./utils";

export function mount(render: () => ShadowElement, parent: HTMLElement): () => void {
  const shadowResult: ShadowCache = new ShadowCache(false);

  const disconnect = effect(() => {
    const previousActiveElement = active.parentElement;
    active.parentElement = parent;

    reconcile({
      parentElement: parent,
      previousSibling: null,
      shadowCache: shadowResult,
      shadowElement: render(),
    });

    active.parentElement = previousActiveElement;
  });

  return () => {
    disconnect();
    shadowResult.remove();
  };
}

export function define(name: string): ClassDecorator {
  return (Component) => {
    customElements.define(name, Component as any);

    return Component;
  };
}

export function createComponent<T extends new (...args: any[]) => HTMLElement>(
  name: string,
  Component: T,
): T {
  customElements.define(name, Component as any);

  return name as any;
}

export const getParentSymbol = Symbol("getParent");

export function findParentOrNull<T = Element>(
  needle: { new (args: any): T } | string,
  haystack?: Element,
): T | null {
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
      return null;
    }

    return parentNode;
  }

  let target;
  if (haystack === undefined) {
    target = active.parentElement ?? active.eventElement;
    if (target === null) {
      throw new Error("No active context available");
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
      parentsCacheMap.set(needle, findParentOrNull(needle, getParent(target)));
    }
    return parentsCacheMap.get(needle);
  } else {
    const parent = getParent(target);
    if (parent === null) {
      return null;
    }
    return findParentOrNull(needle, parent);
  }
}

export function findParent<T = Element>(
  needle: { new (args: any): T } | string,
  haystack?: Element,
): T {
  const result = findParentOrNull(needle, haystack);
  if (result === null) {
    throw new Error(`Could not find parent ${needle.toString()}`);
  }
  return result;
}

export function dispatchEvent<T extends HTMLElement, U extends keyof CustomEvents<T>>(
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

export function prop<T>(): () => Signal<T> {
  return () => signal<T | undefined>() as Signal<T>;
}
