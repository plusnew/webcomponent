import { batch, effect, untracked } from "@preact/signals-core";
import { ShadowCache } from "./reconciler/utils";
import type { ShadowElement } from "./types";
import { reconcile } from "./reconciler";

const ERROR = "plusnewerror";

export const active = {
  parentElement: null as null | Element,
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

export function connectedCallback(
  this: HTMLElement & { render: () => ShadowElement },
  opt?: { shadowRootInit?: Partial<ShadowRootInit> },
) {
  if (this.shadowRoot === null) {
    this.attachShadow({ mode: "open", ...opt?.shadowRootInit });

    (this as any)[parentsCacheSymbol] = new Map();
    (this as any)[shadowCache] = new ShadowCache(false);
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
        getParentOverwrite: null,
      });
    });
  });
}

export function disconnectedCallback(
  this: HTMLElement & { render: () => ShadowElement },
) {
  (this as any)[disconnect]();
  (this as any)[parentsCacheSymbol].clear();
  (this as any)[shadowCache].unmount();
}

export function addEventListener(
  this: HTMLElement,
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
    if (
      typeof options === "object" &&
      options !== null &&
      options?.once === true
    ) {
      (this as any)[eventListenerSymbol]?.[eventName]?.delete(listener);
    }

    const result = listener(evt);

    if (result instanceof Promise && active.eventPromises !== null) {
      active.eventPromises.push(result);
    }
  };

  (this as any)[eventListenerSymbol][eventName].set(
    listener,
    listenerOverwrite,
  );

  HTMLElement.prototype.addEventListener.call(
    this,
    eventName,
    listenerOverwrite,
    options,
  );
}

export function removeEventListener(
  this: HTMLElement,
  eventName: string,
  listener: (event: Event) => void,
) {
  if (
    eventListenerSymbol in this === true &&
    eventName in (this as any)[eventListenerSymbol] === true
  ) {
    const listenerOverwrite = (this as any)[eventListenerSymbol][eventName].get(
      listener,
    );

    if (listenerOverwrite !== undefined) {
      (this as any)[eventListenerSymbol][eventName].delete(listener);

      HTMLElement.prototype.removeEventListener.call(
        this,
        eventName,
        listenerOverwrite,
      );
    }
  }
}
