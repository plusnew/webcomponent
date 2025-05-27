const ERROR_EVENT = "plusnewerror"

export function dispatchError(element: Element, error: unknown) {
  const result = element.dispatchEvent(
    new CustomEvent(ERROR_EVENT, {
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
