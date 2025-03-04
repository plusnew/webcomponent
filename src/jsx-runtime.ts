import type { ShadowHostElement } from "./types";
import { PLUSNEW_ELEMENT_TYPE } from "./types";

export { Fragment } from "./types";

export function jsx(
  type: string,
  props: object,
  ...children: (() => ShadowHostElement)[]
): ShadowHostElement {
  return {
    // This tag allows us to uniquely identify this as a JSX Element
    $$typeof: PLUSNEW_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type,
    props,
    children,
  };
}

export const jsxs = jsx;
export const jsxDEV = jsx;

