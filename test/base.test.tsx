import { expect } from "@esm-bundle/chai";
import { createComponent, mount, prop } from "@plusnew/webcomponent";
import type { Signal } from "@preact/signals-core";
import { signal } from "@preact/signals-core";

describe("webcomponent", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("creates basic component and updating its props", () => {
    const Component = createComponent(
      "test-base",
      class Component extends HTMLElement {
        @prop() accessor foo: string;

        #baz = signal("baz");

        render() {
          return `${this.foo}-${this.#baz.value}`;
        }
      },
    );

    // @ts-expect-error component with no props given, should be an error
    <Component />;

    // @ts-expect-error component with foo as a number instead of string, should be an error
    <Component foo={2} />;

    // @ts-expect-error component with excessive property baz, should be an error
    <Component foo="bar" baz="mep" />;

    mount(container, <Component foo="mep" className="some-class" />);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;
    expect(component.tagName).to.equal("TEST-BASE");
    expect(component.className).to.equal("some-class");
    expect(component.childNodes.length).to.equal(0);
    expect(component.shadowRoot?.innerHTML).to.equal("mep-baz");

    (component as any).foo = "sup";

    expect(component.shadowRoot?.innerHTML).to.equal("sup-baz");
  });

  it("crates array based on given number", () => {
    const Component = createComponent(
      "test-array",
      class Component extends HTMLElement {
        @prop() accessor amount: number;

        render() {
          return [...Array(this.amount).keys()].map((value) => (
            <div>{value.toString()}</div>
          ));
        }
      },
    );

    mount(container, <Component amount={0} />);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;

    expect(component.tagName).to.equal("TEST-ARRAY");
    expect(component.shadowRoot?.childNodes.length).to.equal(0);

    (component as any).amount = 3;

    expect(component.shadowRoot?.childNodes.length).to.equal(3);
    expect(
      (component.shadowRoot?.childNodes[0] as HTMLElement).tagName,
    ).to.equal("DIV");
    expect(
      (component.shadowRoot?.childNodes[0] as HTMLElement).textContent,
    ).to.equal("0");

    expect(
      (component.shadowRoot?.childNodes[1] as HTMLElement).tagName,
    ).to.equal("DIV");
    expect(
      (component.shadowRoot?.childNodes[1] as HTMLElement).textContent,
    ).to.equal("1");

    expect(
      (component.shadowRoot?.childNodes[2] as HTMLElement).tagName,
    ).to.equal("DIV");
    expect(
      (component.shadowRoot?.childNodes[2] as HTMLElement).textContent,
    ).to.equal("2");

    (component as any).amount = 0;

    expect(component.shadowRoot?.childNodes.length).to.equal(0);
  });

  it("crates element if needed", () => {
    const Component = createComponent(
      "test-placeholder",
      class Component extends HTMLElement {
        @prop() accessor show: boolean;

        render() {
          return this.show === true && <div />;
        }
      },
    );

    mount(container, <Component show={false} />);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;

    expect(component.tagName).to.equal("TEST-PLACEHOLDER");
    expect(component.shadowRoot?.childNodes.length).to.equal(0);

    (component as any).show = true;

    expect(component.shadowRoot?.childNodes.length).to.equal(1);

    expect(
      (component.shadowRoot?.childNodes[0] as HTMLElement).tagName,
    ).to.equal("DIV");

    (component as any).show = false;

    expect(component.shadowRoot?.childNodes.length).to.equal(0);

    // Mounting same component a second time, should not interfer with the first
    mount(container, <Component show={true} />);

    expect(component.shadowRoot?.childNodes.length).to.equal(0);
  });

  it("parent component should not rerender when child signal changes", () => {
    const foo = signal(0);
    let containerRenderCount = 0;
    let nestedRenderCount = 0;

    const Component = createComponent(
      "test-container",
      class Component extends HTMLElement {
        render() {
          containerRenderCount++;
          return <NestedComponent />;
        }
      },
    );

    const NestedComponent = createComponent(
      "test-nest",
      class Component extends HTMLElement {
        render() {
          nestedRenderCount++;
          return `${foo.value}`;
        }
      },
    );

    mount(container, <Component />);

    expect(container.childNodes.length).to.equal(1);

    const containerComponent = container.childNodes[0] as HTMLElement;
    const nestedComponent = (containerComponent.shadowRoot as ShadowRoot)
      .childNodes[0] as HTMLElement;

    expect(containerComponent.tagName).to.equal("TEST-CONTAINER");
    expect(nestedComponent.tagName).to.equal("TEST-NEST");
    expect((nestedComponent.shadowRoot as ShadowRoot).textContent).to.equal(
      "0",
    );
    expect(containerRenderCount).to.equal(1);
    expect(nestedRenderCount).to.equal(1);

    foo.value = 1;

    expect((nestedComponent.shadowRoot as ShadowRoot).textContent).to.equal(
      "1",
    );
    expect(containerRenderCount).to.equal(1);
    expect(nestedRenderCount).to.equal(2);
  });

  it("creates basic component and updating its props", () => {
    let containerRenderCounter = 0;
    let nestedRenderCounter = 0;

    const NestedComponent = createComponent(
      "test-counter-constructor",
      class Component extends HTMLElement {
        #counter: Signal<number>;
        constructor() {
          super();

          this.#counter = signal(0);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          this.#counter.value;
        }
        render() {
          nestedRenderCounter += 1;
          return (
            <button
              onclick={() => {
                this.#counter.value = this.#counter.value + 1;
              }}
            >
              {this.#counter.value.toString()}
            </button>
          );
        }
      },
    );

    const Component = createComponent(
      "test-container-rerender",
      class Component extends HTMLElement {
        render() {
          containerRenderCounter += 1;
          return <NestedComponent />;
        }
      },
    );

    mount(container, <Component />);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;
    const nestedComponent = component.shadowRoot?.childNodes[0] as HTMLElement;
    const buttonElement = nestedComponent.shadowRoot?.childNodes[0] as ChildNode;

    expect(component.tagName).to.equal("TEST-CONTAINER-RERENDER");
    expect(component.childNodes.length).to.equal(0);
    expect(buttonElement.textContent).to.equal("0");
    expect(containerRenderCounter).to.equal(1);
    expect(nestedRenderCounter).to.equal(1);

    buttonElement.dispatchEvent(new Event("click"));

    expect(nestedComponent.shadowRoot?.childNodes[0] === buttonElement).to.equal(true);
    expect(buttonElement.textContent).to.equal("1");
    expect(containerRenderCounter).to.equal(1);
    expect(nestedRenderCounter).to.equal(2);
  });
});
