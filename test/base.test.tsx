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
          return [...Array(this.amount).keys()].map((value) => {
            return <div>{value.toString()}</div>;
          });
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
      (component.shadowRoot?.childNodes[0] as HTMLElement).innerText,
    ).to.equal("0");

    expect(
      (component.shadowRoot?.childNodes[1] as HTMLElement).tagName,
    ).to.equal("DIV");
    expect(
      (component.shadowRoot?.childNodes[1] as HTMLElement).innerText,
    ).to.equal("1");

    expect(
      (component.shadowRoot?.childNodes[2] as HTMLElement).tagName,
    ).to.equal("DIV");
    expect(
      (component.shadowRoot?.childNodes[2] as HTMLElement).innerText,
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
});
