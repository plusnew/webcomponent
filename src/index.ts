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
): (
  properties: PartialHtmlElement &
    RemoveUnneededProperties<T, "render" | keyof WebComponent>,
) => null {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  findParent<T>(needle: { new (): T }): T | null {
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

    if (this.#parentsCache.has(needle) === false) {
      this.#parentsCache.set(needle, findParent(this.parentNode, needle));
    }
    return this.#parentsCache.get(needle);
  }
  connectedCallback(this: HTMLElement & WebComponent) {
    const shadowRoot = this.attachShadow({ mode: "open" });

    this.#disconnect = effect(() => {
      batch(() => {
        const result = this.render();
        reconcile(shadowRoot, null, this.#shadowCache, result);
      });
    });
  }
  disconnectedCallback() {
    function removeEventListeners(shadowCache: ShadowCache) {
      if (isHostElement(shadowCache.value)) {
        for (const propKey in shadowCache.value.props) {
          if (propKey.startsWith(EVENT_PREFIX)) {
            (shadowCache.node as any)[propKey] = null;
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
