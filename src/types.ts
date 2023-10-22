export const PLUSNEW_ELEMENT_TYPE = Symbol("plusnew-element-type");

type Expect<T extends true> = T;

type IsEqual<CheckA, CheckB, Then, Else> = (<T>() => T extends CheckA
  ? 1
  : 2) extends <T>() => T extends CheckB ? 1 : 2
  ? Then
  : Else;

type ReadonlyKeys<T> = {
  [P in keyof T]-?: IsEqual<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    never,
    P
  >;
}[keyof T];

type FunctionKeys<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [P in keyof T]: T[P] extends Function ? P : never;
}[keyof T];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type checkReadonly = Expect<
  IsEqual<
    ReadonlyKeys<{
      foo: string;
      readonly bar: number;
      readonly baz: string;
      mep: number;
    }>,
    "bar" | "baz",
    true,
    false
  >
>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type checkFunctions = Expect<
  IsEqual<
    FunctionKeys<{
      foo: string;
      bar: () => number;
      baz: () => string;
      mep: number;
    }>,
    "bar" | "baz",
    true,
    false
  >
>;

export type RemoveUnneededProperties<T> = Pick<
  T,
  Exclude<keyof T, ReadonlyKeys<T> | FunctionKeys<T>>
>;

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
      [Tag in keyof HTMLElementTagNameMap]: Partial<
        RemoveUnneededProperties<HTMLElementTagNameMap[Tag]>
      > & { children?: ShadowElement };
    } & {
      [Tag in keyof SVGElementTagNameMap]: Partial<
        RemoveUnneededProperties<SVGElementTagNameMap[Tag]>
      > & { children?: ShadowElement };
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
