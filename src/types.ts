import type { PlusnewErrorEvent } from "./utils";

export const PLUSNEW_ELEMENT_TYPE = Symbol("plusnew-element-type");

export function Fragment(props: { children: ShadowElement }) {
  return props.children;
}

// type Expect<T extends true> = T;

type IsEqual<CheckA, CheckB, Then, Else> =
  (<T>() => T extends CheckA ? 1 : 2) extends <T>() => T extends CheckB ? 1 : 2
    ? Then
    : Else;

export type ReadonlyKeys<T> = {
  [P in keyof T]-?: IsEqual<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    never,
    P
  >;
}[keyof T];

// type FunctionKeys<T> = {
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
//   [P in keyof T]: T[P] extends Function ? P : never;
// }[keyof T];

// type checkReadonly = Expect<
//   IsEqual<
//     ReadonlyKeys<{
//       foo: string;
//       readonly bar: number;
//       readonly baz: string;
//       mep: number;
//     }>,
//     "bar" | "baz",
//     true,
//     false
//   >
// >;

// type checkFunctions = Expect<
//   IsEqual<
//     FunctionKeys<{
//       foo: string;
//       bar: () => number;
//       baz: () => string;
//       mep: number;
//     }>,
//     "bar" | "baz",
//     true,
//     false
//   >
// >;

export type ForbiddenHTMLProperties =
  | "innerHTML"
  | "outerHTML"
  | "innerText"
  | "outerText";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace JSX {
  /**
   * the JSX.Element is a abstract representation of a Component
   */
  export type Element = ShadowElement;

  export interface ElementChildrenAttribute {
    // @FIXME children are always arrays, but typescript doesn't accept that because of react
    children: ShadowElement;
  }

  /**
   * All the DOM Nodes are here
   */
  export type IntrinsicElements = {
    [Tag in keyof HTMLElementTagNameMap]: IntrinsicElementAttributes<
      HTMLElementTagNameMap[Tag]
    > & {
      children?: ShadowElement;
      onplusnewerror?: (evt: PlusnewErrorEvent) => void;
    };
  } & {
    [Tag in keyof SVGElementTagNameMap as Tag extends "svg"
      ? Tag
      : `svg:${Tag}`]: { [key: string]: any } & {
      children?: ShadowElement;
      className: string;
      onplusnewerror?: (evt: PlusnewErrorEvent) => void;
    };
  };

  export interface IntrinsicAttributes {
    onplusnewerror?: (evt: PlusnewErrorEvent) => void;
  }
}

export type IntrinsicElementAttributes<T> = {
  [Prop in keyof T as Prop extends ReadonlyKeys<T>
    ? never
    : Prop extends ForbiddenHTMLProperties
      ? never
      : Prop extends `on${any}`
        ? Prop
        : T[Prop] extends () => any
          ? never
          : Prop]?: T[Prop] | null;
};

export type ShadowHostElement = {
  $$typeof: typeof PLUSNEW_ELEMENT_TYPE;
  type: string | { new (): HTMLElement };
  props: any;
  children: (() => ShadowElement)[];
};

export type ShadowComponentElement<T> = {
  $$typeof: typeof PLUSNEW_ELEMENT_TYPE;
  type: (props: T) => ShadowElement;
  props: T;
  children: (() => ShadowElement)[];
};

export type ShadowFragmentElement = {
  $$typeof: typeof PLUSNEW_ELEMENT_TYPE;
  type: typeof Fragment;
  props: any;
  children: (() => ShadowElement)[];
};

export type ShadowElement =
  | ShadowHostElement
  | ShadowComponentElement<{}>
  | ShadowFragmentElement
  | string
  | false
  | ShadowElement[];

export type CustomEvents<C> = {
  [Key in keyof C as Key extends `on${infer Event}`
    ? ((evt: CustomEvent<any>) => any) extends C[Key]
      ? Event
      : never
    : never]: C[Key] extends (evt: CustomEvent<infer R>) => void ? R : never;
};
