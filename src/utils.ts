import { batch, effect, Signal, untracked } from "@preact/signals-core";
import { ShadowCache } from "./reconciler/utils";
import type { ForbiddenHTMLProperties, ShadowElement } from "./types";
import { reconcile } from "./reconciler";

const ERROR = "plusnewerror";

export const active = {
  parentElement: null as null | Element,
  eventElement: null as null | Element,
  eventPromises: null as null | Promise<unknown>[],
};

export class PlusnewErrorEvent extends CustomEvent<unknown> {
  constructor(error: unknown) {
    super(ERROR, {
      detail: error,
      cancelable: true,
      bubbles: true,
      composed: true,
    });
  }
}

export function dispatchError(element: Element, error: unknown) {
  const result = element.dispatchEvent(new PlusnewErrorEvent(error));

  if (result === true) {
    throw error;
  }
}

const disconnect = Symbol("disconnect");
const shadowCache = Symbol("shadowCache");
const eventListenerSymbol = Symbol("eventListner");
export const parentsCacheSymbol = Symbol("parentsCache");

export type BasePropsType = Omit<Partial<HTMLElement>, ForbiddenHTMLProperties | "children"> & {
  children?: ShadowElement;
};

type PropType<T extends { [key: string]: () => Signal<any> }> = {
  [Prop in keyof T as undefined extends ReturnType<T[Prop]>["value"] ? Prop : never]?: Exclude<
    ReturnType<T[Prop]>["value"],
    undefined
  >;
} & {
  [Prop in keyof T as undefined extends ReturnType<T[Prop]>["value"] ? never : Prop]: ReturnType<
    T[Prop]
  >["value"];
};

interface IComponent extends HTMLElement {
  connectedCallback(opt?: { shadowRootInit: Partial<ShadowRootInit> }): ShadowRoot;
  disconnectedCallback(): void;
}

export function WebComponent<T extends { [key: string]: () => Signal<any> } = {}>(
  props?: T,
): abstract new (props: PropType<T> & BasePropsType) => PropType<T> & IComponent {
  abstract class Component extends HTMLElement implements IComponent {
    constructor(_props: PropType<T> & BasePropsType) {
      super();
      if (props !== undefined) {
        Object.defineProperties(
          this,
          Object.fromEntries(
            Object.entries(props).map(([key, init]) => {
              const signal = init();

              return [
                key,
                {
                  get: () => {
                    return signal.value;
                  },
                  set: (value) => {
                    signal.value = value;
                  },
                },
              ];
            }),
          ),
        );
      }
    }

    abstract render(): ShadowElement;

    connectedCallback(opt?: { shadowRootInit?: Partial<ShadowRootInit> }) {
      let shadowRoot: null | ShadowRoot = null;
      if (this.shadowRoot === null) {
        shadowRoot = this.attachShadow({ mode: "open", ...opt?.shadowRootInit });

        (this as any)[parentsCacheSymbol] = new Map();
        (this as any)[shadowCache] = new ShadowCache(false);
      } else {
        shadowRoot = this.shadowRoot;
      }

      (this as any)[disconnect] = effect(() => {
        batch(() => {
          const previousActiveElement = active.parentElement;
          let result: ShadowElement;
          try {
            active.parentElement = this;
            result = this.render();
            active.parentElement = previousActiveElement;
          } catch (error) {
            active.parentElement = previousActiveElement;
            untracked(() => dispatchError(this, error));

            return;
          }

          reconcile({
            parentElement: this.shadowRoot as ShadowRoot,
            previousSibling: null,
            shadowCache: (this as any)[shadowCache],
            shadowElement: result,
          });
        });
      });

      return shadowRoot;
    }

    disconnectedCallback() {
      if (disconnect in this) {
        (this as any)[disconnect]();
      }
      if (parentsCacheSymbol in this) {
        (this as any)[parentsCacheSymbol].clear();
      }
      if (shadowCache in this) {
        (this as any)[shadowCache].unmount();
      }
    }

    addEventListener(
      eventName: string,
      listener: (event: Event) => unknown,
      options?: boolean | AddEventListenerOptions,
    ) {
      if (eventListenerSymbol in this === false) {
        (this as any)[eventListenerSymbol] = {};
      }
      if (eventName in (this as any)[eventListenerSymbol] === false) {
        (this as any)[eventListenerSymbol][eventName] = new WeakMap();
      }

      const listenerOverwrite = (evt: Event) => {
        if (typeof options === "object" && options !== null && options?.once === true) {
          (this as any)[eventListenerSymbol]?.[eventName]?.delete(listener);
        }

        const result = listener(evt);

        if (result instanceof Promise && active.eventPromises !== null) {
          active.eventPromises.push(result);
        }
      };

      (this as any)[eventListenerSymbol][eventName].set(listener, listenerOverwrite);

      super.addEventListener(eventName, listenerOverwrite, options);
    }

    removeEventListener(this: HTMLElement, eventName: string, listener: (event: Event) => void) {
      if (
        eventListenerSymbol in this === true &&
        eventName in (this as any)[eventListenerSymbol] === true
      ) {
        const listenerOverwrite = (this as any)[eventListenerSymbol][eventName].get(listener);

        if (listenerOverwrite !== undefined) {
          (this as any)[eventListenerSymbol][eventName].delete(listener);

          super.removeEventListener(eventName, listenerOverwrite);
        }
      }
    }
  }

  return Component as any;
}
