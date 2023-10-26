import type { Signal } from "@preact/signals-core";
import { batch, effect, signal } from "@preact/signals-core";
import { reconcile, type ShadowCache } from "./reconciler/index.js";
import type {
  ForbiddenHTMLProperties,
  RemoveUnneededProperties,
  ShadowElement,
  Webcomponent,
} from "./types.js";
import { EVENT_PREFIX, isHostElement } from "./reconciler/host.js";

export function mount(parent: HTMLElement, JSXElement: ShadowElement) {
  const shadowResult: ShadowCache = {
    value: false as const,
    node: null,
    nestedShadows: [],
  };
  reconcile(parent, parent.lastElementChild, shadowResult, JSXElement);

  return shadowResult.node;
}

type PartialHtmlElement = Partial<
  RemoveUnneededProperties<HTMLElement, ForbiddenHTMLProperties>
>;

export function webcomponent<T extends { render: () => ShadowElement }>(
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

export abstract class WebComponent extends HTMLElement {
  #disconnect = () => {};
  #parentsCache = new Map();
  #shadowCache: ShadowCache = {
    node: null,
    nestedShadows: [],
    value: false,
  };

  throw(error: unknown, instance: WebComponent) {
    this.findParent(WebComponent as { new (): WebComponent }).throw(
      error,
      instance,
    );
  }

  findParent<T = HTMLElement>(needle: { new (args: any): T } | string): T {
    const findParent = function <T = HTMLElement>(
      haystack: Element,
      needle: { new (args: any): T } | string,
    ): T {
      if (haystack.parentElement === null) {
        throw new Error(`Could not find parent ${needle.toString()}`);
      }

      if (
        (typeof needle === "string" &&
          (haystack.parentElement as Element).tagName ===
            needle.toUpperCase()) ||
        (typeof needle === "function" &&
          haystack.parentElement instanceof needle)
      ) {
        return haystack.parentElement as T;
      }
      if (haystack.parentElement instanceof WebComponent) {
        return haystack.parentElement.findParent(needle);
      }
      return findParent(haystack.parentElement, needle);
    };

    if (this.#parentsCache.has(needle) === false) {
      this.#parentsCache.set(needle, findParent(this, needle));
    }
    return this.#parentsCache.get(needle);
  }

  connectedCallback(this: HTMLElement & WebComponent) {
    const shadowRoot = this.attachShadow({ mode: "open" });

    this.#disconnect = effect(() => {
      batch(() => {
        try {
          const result = this.render();
          reconcile(shadowRoot, null, this.#shadowCache, result);
        } catch (error) {
          this.throw(error, this);
        }
      });
    });
  }

  disconnectedCallback() {
    function removeEventListeners(shadowCache: ShadowCache) {
      if (isHostElement(shadowCache.value)) {
        for (const propKey in shadowCache.value.props) {
          if (propKey.startsWith(EVENT_PREFIX)) {
            (shadowCache.node as any)[propKey] = null;
            shadowCache.value.props[propKey] = null;
          }
        }
      }
      shadowCache.nestedShadows.forEach(removeEventListeners);
    }

    this.#disconnect();
    this.#parentsCache.clear();
    removeEventListeners(this.#shadowCache);
  }
  abstract render(): ShadowElement;
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
