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
        children: ShadowElement;
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

type PartialHtmlElement = Partial<HTMLElement>;

export function webcomponent<T extends { render: () => ShadowElement }>(
  name: string,
  Webcomponent: Webcomponent<T>,
): (
  properties: {
    [K in keyof T as Exclude<K, "render" | keyof WebComponent>]: T[K];
  } & PartialHtmlElement,
) => null {
  customElements.define(name, Webcomponent as any);

  return name as any;
}

const disconnect = Symbol("disconnect");
const shadowResult = Symbol("shadowResult");

export abstract class WebComponent extends (HTMLElement as any as null) {
  private [disconnect] = () => {};
  private [shadowResult]: ShadowCache = {
    value: false as const,
    node: null,
    nestedShadows: [],
  };
  connectedCallback(this: HTMLElement & WebComponent) {
    const shadowRoot = this.attachShadow({ mode: "open" });

    this[disconnect] = effect(() => {
      batch(() => {
        const result = this.render();
        reconcile(shadowRoot, null, this[shadowResult], result);
      });
    });
  }
  disconnectedCallback(this: HTMLElement & WebComponent) {
    // @TODO remove event-listener
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
