import { expect } from "@esm-bundle/chai";
import { mount, prop, webcomponent, WebComponent } from "@plusnew/webcomponent";
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
    const Component = webcomponent(
      "test-base",
      class Component extends WebComponent {
        @prop()
        accessor foo: string;

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
    const Component = webcomponent(
      "test-array",
      class Component extends WebComponent {
        @prop()
        accessor amount: number;

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
    const Component = webcomponent(
      "test-placeholder",
      class Component extends WebComponent {
        @prop()
        accessor show: boolean;

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
  });

  it("parent component should not rerender when child signal changes", () => {
    const foo = signal(0);
    let containerRenderCount = 0;
    let nestedRenderCount = 0;

    const Component = webcomponent(
      "test-container",
      class Component extends WebComponent {
        render() {
          containerRenderCount++;
          return <NestedComponent />;
        }
      },
    );

    const NestedComponent = webcomponent(
      "test-nest",
      class Component extends WebComponent {
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
});
