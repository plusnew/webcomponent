export const PLUSNEW_ELEMENT_TYPE = Symbol("plusnew-element-type");

type IfEquals<X, Y, A, B> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? A
  : B;

type AllowedKeys<T> = {
  [P in keyof T]: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    // eslint-disable-next-line @typescript-eslint/ban-types
    T[P] extends Function
      ? never
      : P extends "innerHTML" | "outerHTML" | "innerText" | "outerText"
      ? never
      : P,
    never
  >;
}[keyof T];

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    /**
     * the JSX.Element is a abstract representation of a Component
     */
    type Element = ShadowElement;

    interface ElementChildrenAttribute {
      // @FIXME children are always arrays, but typescript doesn't accept that because of react
      children: ShadowElement;
    }

    /**
     * All the DOM Nodes are here
     */
    type IntrinsicElements = {
      [Tag in keyof HTMLElementTagNameMap]: {
        [Prop in keyof HTMLElementTagNameMap[Tag] as Extract<
          Prop,
          AllowedKeys<HTMLElementTagNameMap[Tag]>
        >]?: HTMLElementTagNameMap[Tag][Prop];
      } & { children?: ShadowElement };
    };
  }
}

export type Webcomponent<T extends { render: () => ShadowElement }> = {
  new (): T;
};

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
