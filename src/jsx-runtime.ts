import type { ShadowHostElement } from "./types.js";
import { PLUSNEW_ELEMENT_TYPE } from "./types.js";

export function jsx(type: string, props: any, key: any): ShadowHostElement {
  const sanitizedProps = props === undefined ? {} : { ...props };
  let children: ShadowHostElement["children"] = [];

  if ("children" in sanitizedProps) {
    children = Array.isArray(sanitizedProps.children)
      ? sanitizedProps.children
      : [sanitizedProps.children];
    delete sanitizedProps.children;
  }

  return {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: PLUSNEW_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type,
    key,
    props: sanitizedProps,
    children,
  };
}

export const jsxs = jsx;
