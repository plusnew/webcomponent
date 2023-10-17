export const PLUSNEW_ELEMENT_TYPE = Symbol("plusnew-element-type");

export type ShadowHostElement = {
  $$typeof: typeof PLUSNEW_ELEMENT_TYPE;
  type: string;
  key: any;
  props: any;
  children: ShadowElement[];
};

export type ShadowElement =
  | ShadowHostElement
  | string
  | false
  | ShadowElement[];
