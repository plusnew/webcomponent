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

  it("finds context", () => {
    class ProviderClass extends WebComponent {
      readonly foo = signal("bar");

      render() {
        return <slot />;
      }
    }

    const Provider = webcomponent("test-provider", ProviderClass);

    const Component = webcomponent(
      "test-consumer",
      class Component extends WebComponent {
        render() {
          const providerElement = this.findParent(ProviderClass);
          return providerElement?.foo.value ?? false;
        }
      },
    );

    mount(
      container,
      <Provider>
        <Component />
      </Provider>,
    );

    expect(container.childNodes.length).to.equal(1);

    const providerElement = container.childNodes[0] as InstanceType<
      typeof ProviderClass
    >;

    expect(providerElement.tagName).to.equal("TEST-PROVIDER");

    const component = (
      providerElement.shadowRoot?.childNodes[0] as HTMLSlotElement
    ).assignedNodes()[0] as HTMLElement;

    expect(component.tagName).to.equal("TEST-CONSUMER");
    expect(component.shadowRoot?.childNodes.length).to.equal(1);
    expect(component.shadowRoot?.textContent).to.equal("bar");

    providerElement.foo.value = "baz";

    expect(component.tagName).to.equal("TEST-CONSUMER");
    expect(component.shadowRoot?.childNodes.length).to.equal(1);
    expect(component.shadowRoot?.textContent).to.equal("baz");
  });
});
