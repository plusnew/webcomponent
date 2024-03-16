import type { Signal } from "@preact/signals-core";
import { batch, effect, signal, untracked } from "@preact/signals-core";
import { reconcile, type ShadowCache } from "./reconciler/index.js";
import { unmount } from "./reconciler/util.js";
import type {
  ForbiddenHTMLProperties,
  RemoveUnneededProperties,
  ShadowElement,
  Webcomponent,
} from "./types.js";

export { default as PortalEntrance } from "./components/PortalEntrance.js";

export function mount(parent: HTMLElement, JSXElement: ShadowElement) {
  const shadowResult: ShadowCache = {
    value: false as const,
    node: null,
    nestedShadows: [],
    unmount: null,
  };
  reconcile(parent, parent.lastElementChild, shadowResult, JSXElement);

  return shadowResult.node;
}

type PartialHtmlElement = Partial<
  RemoveUnneededProperties<HTMLElement, ForbiddenHTMLProperties>
>;

export function createComponent<T extends { render: () => ShadowElement }>(
  name: string,
  Webcomponent: Webcomponent<T>,
): {
  new (
    properties: PartialHtmlElement &
      RemoveUnneededProperties<T, "render" | keyof WebComponent>,
  ): T;
} {
  customElements.define(name, Webcomponent as any);

  return name as any;
}

const parentsCache = Symbol("parentsCache");

export abstract class WebComponent extends HTMLElement {
  #disconnect = () => {};
  [parentsCache] = new Map();
  #shadowCache: ShadowCache = {
    node: null,
    nestedShadows: [],
    value: false,
    unmount: null,
  };

  connectedCallback(this: HTMLElement & WebComponent) {
    const shadowRoot = this.attachShadow({ mode: "open" });

    this.#disconnect = effect(() => {
      batch(() => {
        const previousActiveElement = active.parentElement;
        let errored = false;
        let result;
        try {
          active.parentElement = this;
          result = this.render();
          active.parentElement = previousActiveElement;
        } catch (error) {
          errored = true;
          untracked(() => dispatchError(this, error));

          return;
        }
        if (errored === false) {
          reconcile(shadowRoot, null, this.#shadowCache, result);
        }
      });
    });
  }

  disconnectedCallback() {
    this.#disconnect();
    this[parentsCache].clear();
    unmount(this.#shadowCache);
  }
  abstract render(): ShadowElement;
}

export function dispatchError(element: Element, error: unknown) {
  const result = element.dispatchEvent(
    new CustomEvent("plusnewerror", {
      detail: error,
      cancelable: true,
      bubbles: true,
      composed: true,
    }),
  );

  if (result === true) {
    throw error;
  }
}

export const active = { parentElement: null as null | Element };

export function findParent<T = Element>(
  needle: { new (args: any): T } | string,
  haystack?: Element,
): T {
  function getParent(element: Element) {
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

  if (parentsCache in target) {
    const parentsCacheMap = target[parentsCache] as any;
    if (parentsCacheMap.has(needle) === false) {
      parentsCacheMap.set(needle, findParent(needle, getParent(target)));
    }
    return parentsCacheMap.get(needle);
  } else {
    return findParent(needle, getParent(target));
  }
}

export function prop() {
  return <T, U>(
    decoratorTarget: ClassAccessorDecoratorTarget<T, U>,
    accessor: ClassAccessorDecoratorContext<T, U>,
  ): ClassAccessorDecoratorResult<T, U> => {
    accessor;
    const storage: Signal<number> = signal(0);

    return {
      set: function (value) {
        decoratorTarget.set.call(this, value);
        storage.value = storage.value + 1;
      },
      get: function () {
        storage.value;
        return decoratorTarget.get.call(this);
      },
    };
  };
}
