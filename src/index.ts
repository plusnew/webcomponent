import type { Signal } from "@preact/signals-core";
import { batch, effect, signal } from "@preact/signals-core";

export const PLUSNEW_ELEMENT_TYPE = Symbol("plusnew-element-type");

export type ShadowHostElement = {
  $$typeof: typeof PLUSNEW_ELEMENT_TYPE;
  type: string;
  key: any;
  props: any;
  children: ShadowElement[];
};

type ShadowElement = ShadowHostElement | string | false | ShadowElement[];

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

type ShadowCache = {
  value: ShadowElement;
  node: Node | null;
  nestedShadows: ShadowCache[];
};

function remove(oldShadowCache: ShadowCache) {
  if (oldShadowCache.node === null) {
    oldShadowCache.nestedShadows.forEach(remove);
  } else {
    oldShadowCache.node.parentNode?.removeChild(oldShadowCache.node);
  }
  oldShadowCache.node = null;
  oldShadowCache.nestedShadows = [];
}

const reconcilers: ((
  parentElement: ParentNode,
  previousSibling: Node | null,
  shadowCache: ShadowCache,
  shadowElement: ShadowElement,
) => Node | null | false)[] = [
  // Host reconciler
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
      let elementNeedsAppending = null;
      if (
        isHostElement(shadowCache.value) &&
        shadowCache.value.type === shadowElement.type
      ) {
        // Nothing needs to be done
      } else {
        // remove old element
        remove(shadowCache);

        // create new element
        const element = document.createElement(shadowElement.type);

        shadowCache.node = element;
        shadowCache.value = {
          $$typeof: PLUSNEW_ELEMENT_TYPE,
          type: shadowElement.type,
          key: shadowElement.key,
          props: {},
          children: [],
        };

        elementNeedsAppending = true;
      }

      for (const propKey in shadowElement.props) {
        // Only set value if needed
        if (shadowCache.value.props[propKey] !== shadowElement.props[propKey]) {
          (shadowCache.node as any)[propKey] = shadowElement.props[propKey];
        }
      }

      // @TODO Remove unneded props

      shadowCache.value.props = shadowElement.props;

      let lastAddedSibling: Node | null = null;
      let i = 0;
      while (i < shadowElement.children.length) {
        if (shadowCache.nestedShadows.length <= i) {
          shadowCache.nestedShadows.push({
            node: null,
            value: false,
            nestedShadows: [],
          });
        }
        lastAddedSibling = reconcile(
          shadowCache.node as ParentNode,
          lastAddedSibling,
          shadowCache.nestedShadows[i],
          shadowElement.children[i],
        );
        i++;
      }

      while (i < shadowCache.nestedShadows.length) {
        remove(shadowCache.nestedShadows[i]);
        shadowCache.nestedShadows.splice(i, 1);
      }

      if (elementNeedsAppending) {
        append(parentElement, previousSibling, shadowCache.node as Node);
      }

      shadowCache.value = shadowElement;
      return shadowCache.node;
    } else {
      return false;
    }
  },

  // Text reconciler
  (parentElement, previousSibling, shadowCache, shadowElement) => {
    if (typeof shadowElement === "string") {
      if (typeof shadowCache.value === "string") {
        // Only update if needed
        if (shadowElement !== shadowCache.value) {
          (shadowCache.node as Text).textContent = shadowElement;
          shadowCache.value = shadowElement;
        }

        return shadowCache.node;
      } else {
        // remove old element
        remove(shadowCache);

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

  // Array reconciler
  (parentElement, previousSibling, shadowCache, shadowElement) => {
    if (Array.isArray(shadowElement)) {
      let lastAddedSibling = previousSibling;
      if (Array.isArray(shadowCache.value) === false) {
        remove(shadowCache);
      }
      shadowCache.value = [];

      let i = 0;
      while (i < shadowElement.length) {
        if (shadowCache.nestedShadows.length <= i) {
          shadowCache.nestedShadows.push({
            node: null,
            value: false,
            nestedShadows: [],
          });
        }
        lastAddedSibling = reconcile(
          parentElement,
          lastAddedSibling,
          shadowCache.nestedShadows[i],
          shadowElement[i],
        );
        i++;
      }
      while (i < shadowCache.nestedShadows.length) {
        remove(shadowCache.nestedShadows[i]);
        shadowCache.nestedShadows.splice(i, 1);
      }
      return lastAddedSibling;
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
