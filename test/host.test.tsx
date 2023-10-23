import { expect } from "@esm-bundle/chai";
import { mount, webcomponent, WebComponent } from "@plusnew/webcomponent";
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

  it("registers click event", async () => {
    const Component = webcomponent(
      "test-click",
      class Component extends WebComponent {
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

    mount(container, <Component />);

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
    const Component = webcomponent(
      "test-input-update",
      class Component extends WebComponent {
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

    mount(container, <Component />);

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
    ).to.equal("foo");
  });

  it("registers input event without updating", async () => {
    const Component = webcomponent(
      "test-input-reject",
      class Component extends WebComponent {
        #baz = signal("foo");

        render() {
          return <input oninput={() => null} value={this.#baz.value} />;
        }
      },
    );

    mount(container, <Component />);

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
});
