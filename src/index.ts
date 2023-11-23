import type { Signal } from "@preact/signals-core";
import { batch, effect, signal } from "@preact/signals-core";
import { reconcile, type ShadowCache } from "./reconciler/index.js";
import type {
  ForbiddenHTMLProperties,
  RemoveUnneededProperties,
  ShadowElement,
  Webcomponent,
} from "./types.js";
import { unmount } from "./reconciler/util.js";

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
    unmount: null,
  };

  throw(error: unknown, instance: WebComponent) {
    this.findParent(WebComponent as { new (): WebComponent }).throw(
      error,
      instance,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  findParent<T = Element>(needle: { new (args: any): T } | string): T {
    const findParent = function <T = Element>(
      haystack: Element,
      needle: { new (args: any): T } | string,
    ): T {
      const parentNode =
        haystack.assignedSlot === null
          ? haystack.parentNode instanceof ShadowRoot
            ? haystack.parentNode.host
            : haystack.parentElement
          : haystack.assignedSlot;

      if (parentNode === null) {
        throw new Error(`Could not find parent ${needle.toString()}`);
      }

      if (
        (typeof needle === "string" &&
          parentNode.tagName === needle.toUpperCase()) ||
        (typeof needle === "function" && parentNode instanceof needle)
      ) {
        return parentNode as T;
      }

      if (parentNode instanceof WebComponent) {
        return parentNode.findParent(needle);
      }

      return findParent(parentNode, needle);
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
    this.#disconnect();
    this.#parentsCache.clear();
    unmount(this.#shadowCache);
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
