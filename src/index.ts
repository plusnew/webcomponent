import { batch, effect, Signal, signal, untracked } from "@preact/signals-core";
import { reconcile, } from "./reconciler/index";
import { ShadowCache } from "./reconciler/utils";
import type {
  CustomEvents,
  IntrinsicElementAttributes,
  ReadonlyKeys,
  ShadowElement,
} from "./types";
import { dispatchError } from "./utils";

export type { ShadowElement } from "./types";

export { default as PortalEntrance } from "./components/PortalEntrance";

export function mount(parent: HTMLElement, JSXElement: ShadowElement) {
  const shadowResult: ShadowCache = new ShadowCache(false);

  active.parentElement = parent;
  reconcile(parent, parent.lastElementChild, shadowResult, JSXElement);

  return shadowResult.node;
}

const disconnect = Symbol("disconnect");
const shadowCache = Symbol("shadowCache");

export function connectedCallback(this: HTMLElement & {render: ()=> ShadowElement}) {
  if (this.shadowRoot === null) {
      this.attachShadow({ mode: "open" });

      (this as any)[parentsCache] = new Map();
      (this as any)[shadowCache] = new ShadowCache(false);
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
}

export function disconnectedCallback(this: HTMLElement & {render: () => ShadowElement}) {
   (this as any)[disconnect]();
   (this as any)[parentsCache].clear();
   (this as any)[shadowCache].unmount();
}

export function createComponent<
  T extends HTMLElement & { render: (this: T) => ShadowElement },
>(
  name: string,
  Component: { new (): T },
): {
  new (
    properties: IntrinsicElementAttributes<HTMLElement> & {
      [Prop in keyof T as Prop extends keyof HTMLElement
        ? never
        : Prop extends ReadonlyKeys<T>
          ? never
          : Prop extends `on${any}`
            ? Prop
            : T[Prop] extends () => any
              ? never
              : Prop]: T[Prop];
    } & {
      children?: ShadowElement;
      onplusnewerror?: (evt: CustomEvent<unknown>) => void;
    },
  ): T;
} {
  if("connectedCallback" in Component.prototype === false) {
    Component.prototype.connectedCallback = connectedCallback;
  }

  if("disconnectedCallback" in Component.prototype === false) {
    Component.prototype.disconnectedCallback = disconnectedCallback;
  }

  customElements.define(name, Component as any);

  return Component;
}

const parentsCache = Symbol("parentsCache");

export const active = { parentElement: null as null | Element };

export function findParent<T = Element>(
  needle: { new (args: any): T },
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

  if (target instanceof needle) {
    return target;
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

export function dispatchEvent<
  T extends HTMLElement,
  U extends keyof CustomEvents<T>,
>(target: T, eventName: U, detail: CustomEvents<T>[U]) {
  target.dispatchEvent(
    new CustomEvent(eventName as string, { detail: detail }),
  );
}

export function prop() {
  return <T, U>(
    decoratorTarget: ClassAccessorDecoratorTarget<T, U>,
    accessor: ClassAccessorDecoratorContext<T, U>,
  ): ClassAccessorDecoratorResult<T, U> => {
    return {
      set: function (value) {
        if (accessor.access.has(this)) {
          (decoratorTarget.get.call(this) as Signal<U>).value = value
        } else {
          decoratorTarget.set.call(this, signal(value) as U)
        }
        
      },
      get: function () {
        return (decoratorTarget.get.call(this) as Signal<U>).value
      },
      init(value) {
        return signal(value) as U
      },
    };
  };
}
