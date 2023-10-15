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
  const shadowResult = {
    value: false as const,
    nodes: [],
    nestedShadows: [],
  };
  reconcile(parent, parent.lastElementChild, shadowResult, JSXElement);

  return shadowResult.nodes;
}

export function webcomponent<T extends { render: () => ShadowElement }>(
  name: string,
  Webcomponent: Webcomponent<T>,
): (properties: {
  [K in Exclude<keyof T, "render" | keyof HTMLElement>]: T[K];
}) => null {
  const shadowResult = {
    value: false as const,
    nodes: [],
    nestedShadows: [],
  };

  let disconnect = () => {};

  Webcomponent.prototype.connectedCallback = function (this: HTMLElement & T) {
    const shadowRoot = this.attachShadow({ mode: "closed" });

    disconnect = effect(() => {
      batch(() => {
        const result = this.render();
        reconcile(shadowRoot, null, shadowResult, result);
      });
    });
  };
  Webcomponent.prototype.disconnectedCallback = () => disconnect();

  customElements.define(name, Webcomponent as any);

  return name as any;
}

export function prop() {
  return <T, U>(
    _decoratorTarget: ClassAccessorDecoratorTarget<T, U>,
    _accessor: ClassAccessorDecoratorContext<T, U>,
  ): ClassAccessorDecoratorResult<T, U> => {
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
  nodes: Node[];
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
        // remove old
        // @TODO

        // create new
        const element = document.createElement(shadowElement.type);

        append(parentElement, previousSibling, element);

        shadowCache.nodes = [element];
      }

      shadowCache.value = shadowElement;
      return shadowCache.nodes[0];
    }
    return false;
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
