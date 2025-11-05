import { expect } from "@esm-bundle/chai";
import { createComponent, mount, prop } from "@plusnew/webcomponent";
import { signal } from "@preact/signals-core";

describe("fragment", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("creates basic component with fragment", () => {
    const baz = signal("foo");
    const Component = createComponent(
      "test-base",
      class Component extends HTMLElement {
        @prop() accessor foo: string;

        render() {
          return (
            <>
              <div>{baz.value}</div>
              <span />
            </>
          );
        }
      },
    );

    mount(container, <Component foo="mep" className="some-class" />);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;
    const buttonElement = component.shadowRoot?.childNodes[0] as HTMLElement;
    expect(component.tagName).to.equal("TEST-BASE");
    expect(component.className).to.equal("some-class");
    expect(component.childNodes.length).to.equal(0);
    expect(component.shadowRoot?.childNodes.length).to.equal(2);
    expect(buttonElement.tagName).to.equal("DIV");
    expect(buttonElement.textContent).to.equal("foo");
    expect(
      (component.shadowRoot?.childNodes[1] as HTMLElement).tagName,
    ).to.equal("SPAN");

    baz.value = "bar";

    expect(component.shadowRoot?.childNodes[0] === buttonElement).to.equal(
      true,
    );
    expect(buttonElement.textContent).to.equal("bar");
  });
});
