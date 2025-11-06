const ERROR = "plusnewerror";
const ASYNC_EVENT = "plusnewasyncevent";

export function dispatchError(element: Element, error: unknown) {
  const result = element.dispatchEvent(
    new CustomEvent(ERROR, {
      detail: error,
      cancelable: true,
      bubbles: true,
      composed: true,
    }),
  );

  if (result === true) {
    throw error;
  }
}

export function dispatchAsyncEvent(
  element: Element,
  promise: Promise<unknown>,
) {
  element.dispatchEvent(
    new CustomEvent(ASYNC_EVENT, {
      detail: promise,
      cancelable: true,
      bubbles: true,
      composed: true,
    }),
  );
}
