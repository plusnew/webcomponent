import { PLUSNEW_ELEMENT_TYPE } from "./index.js";

export function jsx(type: string, props: any, key: any) {
  return {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: PLUSNEW_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type,
    key,
    props,
  };
}
