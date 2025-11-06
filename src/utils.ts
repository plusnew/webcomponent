const ERROR = "plusnewerror";
const ASYNC_EVENT = "plusnewasyncevent";

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

export class PlusnewAsyncEvent extends CustomEvent<{
  promise: Promise<unknown>;
  cause: Event;
}> {
  constructor(originalEvent: Event, promise: Promise<unknown>) {
    super(ASYNC_EVENT, {
      detail: { promise, cause: originalEvent },
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

export function dispatchAsyncEvent(
  element: Element,
  originalEvent: Event,
  promise: Promise<unknown>,
) {
  element.dispatchEvent(new PlusnewAsyncEvent(originalEvent, promise));
}
