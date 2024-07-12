import type { Signal } from "@preact/signals-core";
import { batch, effect, signal, untracked } from "@preact/signals-core";
import { reconcile, type ShadowCache } from "./reconciler/index.js";
import { unmount } from "./reconciler/util.js";
import type {
  ForbiddenHTMLProperties,
  RemoveUnneededProperties,
  ShadowElement,
} from "./types.js";
import { dispatchError } from "./utils.js";

export { ShadowElement } from "./types.js";

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

const disconnect = Symbol("disconnect");
const shadowCache = Symbol("shadowCache");

export function createComponent<
  T extends HTMLElement & { render: () => ShadowElement },
>(
  name: string,
  Component: { new (): T },
): {
  new (
    properties: PartialHtmlElement &
      RemoveUnneededProperties<T, keyof HTMLElement>,
  ): T;
} {
  Component.prototype.connectedCallback = function (this: T) {
    if (this.shadowRoot === null) {
      this.attachShadow({ mode: "open" });

      (this as any)[parentsCache] = new Map();
      (this as any)[shadowCache] = {
        node: null,
        nestedShadows: [],
        value: false,
        unmount: null,
      };
    }

    (this as any)[disconnect] = effect(() => {
      batch(() => {
        const previousActiveElement = active.parentElement;
        let errored = false;
        let result: ShadowElement;
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
          reconcile(
            this.shadowRoot as ShadowRoot,
            null,
            (this as any)[shadowCache],
            result,
          );
        }
      });
    });
  };
  Component.prototype.disconnectedCallback = function (this: T) {
    (this as any)[disconnect]();
    (this as any)[parentsCache].clear();
    unmount((this as any)[shadowCache]);
  };
  customElements.define(name, Component as any);

  return name as any;
}

const parentsCache = Symbol("parentsCache");

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
