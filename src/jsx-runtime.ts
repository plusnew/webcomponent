import type { ShadowHostElement } from "./types.js";
import { PLUSNEW_ELEMENT_TYPE } from "./types.js";

export { PLUSNEW_FRAGMENT_TYPE as Fragment } from "./types.js"

export function jsx(
  type: string,
  props: object,
  ...children: (() => ShadowHostElement)[]
): ShadowHostElement {
  return {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: PLUSNEW_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type,
    props,
    children,
  };
}

export const jsxs = jsx;
export const jsxDEV = jsx;

