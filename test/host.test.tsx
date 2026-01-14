import { expect } from "@esm-bundle/chai";
import { createComponent, mount } from "@plusnew/webcomponent";
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

  xit("adds property and removes it", async () => {
    const add = signal(false);

    const Component = createComponent(
      "test-property",
      class Component extends HTMLElement {
        render() {
          return add.value ? <span className="foo" /> : <span />;
        }
      },
    );
    mount(() => <Component />, container);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;
    const element = component.shadowRoot?.childNodes[0] as HTMLSpanElement;

    expect(element.className).to.equal("");

    add.value = true;

    expect(element.className).to.equal("foo");

    add.value = false;

    expect(element.className).to.equal("");
  });

  it("registers click event", async () => {
    const Component = createComponent(
      "test-click",
      class Component extends HTMLElement {
        #baz = signal(0);

        render() {
          return (
            <button onclick={() => (this.#baz.value = this.#baz.value + 1)}>
              {this.#baz.value.toString()}
            </button>
          );
        }
      },
    );

    mount(() => <Component />, container);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;

    expect(component.tagName).to.equal("TEST-CLICK");
    expect(component.shadowRoot?.childNodes.length).to.equal(1);
    expect(
      (component.shadowRoot?.childNodes[0] as HTMLElement).tagName,
    ).to.equal("BUTTON");

    expect(
      (component.shadowRoot?.childNodes[0] as HTMLElement).textContent,
    ).to.equal("0");

    (component.shadowRoot?.childNodes[0] as HTMLElement).dispatchEvent(
      new MouseEvent("click"),
    );

    expect(component.shadowRoot?.childNodes.length).to.equal(1);
    expect(
      (component.shadowRoot?.childNodes[0] as HTMLElement).tagName,
    ).to.equal("BUTTON");

    expect(
      (component.shadowRoot?.childNodes[0] as HTMLElement).textContent,
    ).to.equal("1");

    component.remove();

    (component.shadowRoot?.childNodes[0] as HTMLElement).dispatchEvent(
      new MouseEvent("click"),
    );

    expect(component.shadowRoot?.childNodes.length).to.equal(1);
    expect(
      (component.shadowRoot?.childNodes[0] as HTMLElement).tagName,
    ).to.equal("BUTTON");

    expect(
      (component.shadowRoot?.childNodes[0] as HTMLElement).textContent,
    ).to.equal("1");
  });

  it("registers input event and updating", async () => {
    const Component = createComponent(
      "test-input-update",
      class Component extends HTMLElement {
        #baz = signal("foo");

        render() {
          return (
            <input
              oninput={(evt) =>
                (this.#baz.value = (
                  evt.currentTarget as HTMLInputElement
                ).value)
              }
              value={this.#baz.value}
            />
          );
        }
      },
    );

    mount(() => <Component />, container);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;

    expect(component.tagName).to.equal("TEST-INPUT-UPDATE");
    expect(component.shadowRoot?.childNodes.length).to.equal(1);
    expect(
      (component.shadowRoot?.childNodes[0] as HTMLElement).tagName,
    ).to.equal("INPUT");

    expect(
      (component.shadowRoot?.childNodes[0] as HTMLInputElement).value,
    ).to.equal("foo");

    (component.shadowRoot?.childNodes[0] as HTMLInputElement).value = "foobar";

    (component.shadowRoot?.childNodes[0] as HTMLElement).dispatchEvent(
      new KeyboardEvent("input"),
    );

    expect(component.shadowRoot?.childNodes.length).to.equal(1);
    expect(
      (component.shadowRoot?.childNodes[0] as HTMLElement).tagName,
    ).to.equal("INPUT");

    expect(
      (component.shadowRoot?.childNodes[0] as HTMLInputElement).value,
    ).to.equal("foobar");
  });

  it("registers input event without updating", async () => {
    const Component = createComponent(
      "test-input-reject",
      class Component extends HTMLElement {
        #baz = signal("foo");

        render() {
          return <input oninput={() => null} value={this.#baz.value} />;
        }
      },
    );

    mount(() => <Component />, container);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;

    expect(component.tagName).to.equal("TEST-INPUT-REJECT");
    expect(component.shadowRoot?.childNodes.length).to.equal(1);
    expect(
      (component.shadowRoot?.childNodes[0] as HTMLElement).tagName,
    ).to.equal("INPUT");

    expect(
      (component.shadowRoot?.childNodes[0] as HTMLInputElement).value,
    ).to.equal("foo");

    (component.shadowRoot?.childNodes[0] as HTMLInputElement).value = "foobar";

    (component.shadowRoot?.childNodes[0] as HTMLElement).dispatchEvent(
      new KeyboardEvent("input"),
    );

    expect(component.shadowRoot?.childNodes.length).to.equal(1);
    expect(
      (component.shadowRoot?.childNodes[0] as HTMLElement).tagName,
    ).to.equal("INPUT");

    expect(
      (component.shadowRoot?.childNodes[0] as HTMLInputElement).value,
    ).to.equal("foo");
  });

  it("adds style attribute", async () => {
    const backgroundColor = signal<null | string>(null);
    const fontColor = signal<null | string>(null);

    const Component = createComponent(
      "test-style",
      class Component extends HTMLElement {
        render() {
          return backgroundColor.value === null && fontColor.value === null ? (
            <span />
          ) : (
            <span
              style={{
                ...(backgroundColor.value !== null &&
                  ({ "background-color": backgroundColor.value } as any)),
                ...(fontColor.value !== null &&
                  ({ color: fontColor.value } as any)),
              }}
            />
          );
        }
      },
    );

    mount(() => <Component />, container);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;
    const element = component.shadowRoot?.childNodes[0] as HTMLSpanElement;
    let computedStyle = getComputedStyle(element);

    expect(computedStyle.backgroundColor).to.eql("rgba(0, 0, 0, 0)");
    expect(computedStyle.color).to.eql("rgb(0, 0, 0)");

    backgroundColor.value = "rgba(255, 0, 0, 0)";
    computedStyle = getComputedStyle(element);

    expect(computedStyle.backgroundColor).to.eql(backgroundColor.value);
    expect(computedStyle.color).to.eql("rgb(0, 0, 0)");

    fontColor.value = "rgb(255, 0, 0)";
    computedStyle = getComputedStyle(element);

    expect(computedStyle.backgroundColor).to.eql(backgroundColor.value);
    expect(computedStyle.color).to.eql(fontColor.value);

    backgroundColor.value = null;
    computedStyle = getComputedStyle(element);

    expect(computedStyle.backgroundColor).to.eql("rgba(0, 0, 0, 0)");
    expect(computedStyle.color).to.eql(fontColor.value);

    fontColor.value = null;
    computedStyle = getComputedStyle(element);

    expect(computedStyle.backgroundColor).to.eql("rgba(0, 0, 0, 0)");
    expect(computedStyle.color).to.eql("rgb(0, 0, 0)");
  });
});
