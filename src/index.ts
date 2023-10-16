import type { Signal } from "@preact/signals-core";
import { batch, effect, signal } from "@preact/signals-core";

type ShadowHostElement = {
  $$typeof: symbol;
  type: string;
  key: any;
  props: any;
};

type ShadowElement = ShadowHostElement | string | false | ShadowElement[];

type Webcomponent<T extends { render: () => ShadowElement }> = {
  new (): T;
};

export const PLUSNEW_ELEMENT_TYPE = Symbol("plusnew-element-type");

export function mount(parent: HTMLElement, JSXElement: ShadowElement) {
  const shadowResult: ShadowCache = {
    value: false as const,
    node: null,
    nestedShadows: [],
  };
  reconcile(parent, parent.lastElementChild, shadowResult, JSXElement);

  return shadowResult.node;
}

export function webcomponent<T extends { render: () => ShadowElement }>(
  name: string,
  Webcomponent: Webcomponent<T>,
): (properties: {
  [K in keyof T as Exclude<
    K,
    "render" | "connectedCallback" | keyof HTMLElement
  >]: T[K];
}) => null {
  customElements.define(name, Webcomponent as any);

  return name as any;
}

const disconnect = Symbol("disconnect");
const shadowResult = Symbol("shadowResult");

export abstract class WebComponent extends (HTMLElement as any as null) {
  private [disconnect] = () => {};
  private [shadowResult] = {
    value: false as const,
    nodes: [],
    nestedShadows: [],
  };
  connectedCallback(this: any) {
    const shadowRoot = this.attachShadow({ mode: "open" });

    this[disconnect] = effect(() => {
      batch(() => {
        const result = this.render();
        reconcile(shadowRoot, null, this[shadowResult], result);
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

type ShadowCache = {
  value: ShadowElement;
  node: Node | null;
  nestedShadows: ShadowCache[];
};

const reconcilers: ((
  parentElement: ParentNode,
  previousSibling: Node | null,
  shadowCache: ShadowCache,
  shadowElement: ShadowElement,
) => Node | null | false)[] = [
  (parentElement, previousSibling, shadowCache, shadowElement) => {
    function isHostElement(
      shadowElement: ShadowElement,
    ): shadowElement is ShadowHostElement {
      return (
        typeof shadowElement === "object" &&
        "$$typeof" in shadowElement &&
        typeof shadowElement.type === "string"
      );
    }

    // Check if new shadow is of type dom-element
    if (isHostElement(shadowElement)) {
      // Check if old shadow is of same shadow-type
      if (
        isHostElement(shadowCache.value) &&
        shadowElement.type === shadowElement.type
      ) {
        throw new Error("Updating is not yet implemented");
      } else {
        // remove old element
        // @TODO

        // create new element
        const element = document.createElement(shadowElement.type);

        append(parentElement, previousSibling, element);

        shadowCache.node = element;
      }

      shadowCache.value = shadowElement;
      return shadowCache.node;
    } else {
      return false;
    }
  },

  (parentElement, previousSibling, shadowCache, shadowElement) => {
    if (typeof shadowElement === "string") {
      if (typeof shadowCache.value === "string") {
        throw new Error("Updating is not yet implemented");

        return shadowCache.node;
      } else {
        // remove old element
        // @TODO

        // create new element
        const element = document.createTextNode(shadowElement);
        append(parentElement, previousSibling, element);

        shadowCache.node = element;
        shadowCache.value = shadowElement;

        return element;
      }
    } else {
      return false;
    }
  },
];

function append(
  parentElement: ParentNode,
  previousSibling: Node | null,
  target: Node,
) {
  if (previousSibling === null) {
    parentElement.insertBefore(target, parentElement.firstChild);
  } else {
    parentElement.insertBefore(target, previousSibling.nextSibling);
  }
}

function reconcile(
  parentElement: ParentNode,
  previousSibling: Node | null,
  shadowCache: ShadowCache,
  shadowElement: ShadowElement,
): Node | null {
  for (const reconciler of reconcilers) {
    const result = reconciler(
      parentElement,
      previousSibling,
      shadowCache,
      shadowElement,
    );
    if (result !== false) {
      return result;
    }
  }
  throw new Error(
    "Could not find fitting reconciler for " + shadowElement.toString(),
  );
}
