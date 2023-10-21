import type { Signal } from "@preact/signals-core";
import { batch, effect, signal } from "@preact/signals-core";
import { reconcile, type ShadowCache } from "./reconciler/index.js";
import type { ShadowElement } from "./types.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    /**
     * the JSX.Element is a abstract representation of a Component
     */
    type Element = ShadowElement;

    interface ElementChildrenAttribute {
      // @FIXME children are always arrays, but typescript doesn't accept that because of react
      children: ShadowElement;
    }

    /**
     * All the DOM Nodes are here
     */
    interface IntrinsicElements {
      div: {
        [K in keyof HTMLDivElement as Exclude<
          K,
          "children"
        >]?: HTMLDivElement[K];
      } & {
        children?: ShadowElement;
      };

      slot: {
        [K in keyof HTMLSlotElement as Exclude<
          K,
          "children"
        >]?: HTMLSlotElement[K];
      } & {
        children?: ShadowElement;
      };
    }
  }
}

type Webcomponent<T extends { render: () => ShadowElement }> = {
  new (): T;
};

export function mount(parent: HTMLElement, JSXElement: ShadowElement) {
  const shadowResult: ShadowCache = {
    value: false as const,
    node: null,
    nestedShadows: [],
  };
  reconcile(parent, parent.lastElementChild, shadowResult, JSXElement);

  return shadowResult.node;
}

type PartialHtmlElement = {
  [K in keyof HTMLElement as Exclude<K, "children">]?: HTMLElement[K];
};

export function webcomponent<T extends { render: () => ShadowElement }>(
  name: string,
  Webcomponent: Webcomponent<T>,
): (
  properties: PartialHtmlElement & {
    [K in keyof T as Exclude<K, "render" | keyof WebComponent>]: T[K];
  },
) => null {
  customElements.define(name, Webcomponent as any);

  return name as any;
}

export abstract class WebComponent extends HTMLElement {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  findParent<T>(needle: { new (): T }): T | null {
    throw new Error("Element is not mounted and cant't find parents yet");
  }
  connectedCallback(this: HTMLElement & WebComponent) {
    const shadowRoot = this.attachShadow({ mode: "open" });
    const shadowCache: ShadowCache = {
      node: null,
      nestedShadows: [],
      value: false,
    };
    const parentsCache = new Map();

    const findParent = function <T>(
      haystack: ParentNode | null,
      needle: { new (): T },
    ): T | null {
      return haystack === null
        ? null
        : haystack instanceof needle
        ? haystack
        : haystack instanceof WebComponent
        ? haystack.findParent(needle)
        : findParent(haystack.parentNode, needle);
    };

    this.findParent = (needle) => {
      if (parentsCache.has(needle) === false) {
        parentsCache.set(needle, findParent(this.parentNode, needle));
      }
      return parentsCache.get(needle);
    };

    (this as any).disconnectedCallback = () => {
      disconnect();
      parentsCache.clear();

      // @TODO remove event-listeners of nestedShadowElements
    };

    const disconnect = effect(() => {
      batch(() => {
        const result = this.render();
        reconcile(shadowRoot, null, shadowCache, result);
      });
    });
  }
  abstract render(): ShadowElement;
}

export function prop() {
  return <T, U>(
    _decoratorTarget: ClassAccessorDecoratorTarget<T, U>,
    _accessor: ClassAccessorDecoratorContext<T, U>,
  ): ClassAccessorDecoratorResult<T, U> => {
    _decoratorTarget;
    _accessor;

    let storage: Signal<U> | null = null;
    return {
      set: function (value) {
        if (storage === null) {
          storage = signal(value);
        } else {
          storage.value = value;
        }
      },
      get: function () {
        return storage === null ? (undefined as U) : storage.value;
      },
    };
  };
}
