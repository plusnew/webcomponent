import { expect } from "@esm-bundle/chai";
import { mount, webcomponent, WebComponent } from "@plusnew/webcomponent";
import { signal } from "@preact/signals-core";

const Provider = webcomponent(
  "test-provider",
  class Component extends WebComponent {
    readonly foo = signal("bar");

    render() {
      return <slot />;
    }
  },
);

const Consumer = webcomponent(
  "test-consumer",
  class Component extends WebComponent {
    render() {
      try {
        return this.findParent(Provider).foo.value;
      } catch (_error) {
        return "not-found";
      }
    }
  },
);

describe("webcomponent", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("finds context", () => {
    mount(
      container,
      <Provider>
        <Consumer />
      </Provider>,
    );

    expect(container.childNodes.length).to.equal(1);

    const providerElement = container.childNodes[0] as InstanceType<
      typeof Provider
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

  it("no context", () => {
    mount(container, <Consumer />);

    expect(container.childNodes.length).to.equal(1);
    expect((container.childNodes[0] as HTMLElement).tagName).to.equal(
      "TEST-CONSUMER",
    );
    expect(
      (container.childNodes[0] as HTMLElement).shadowRoot?.textContent,
    ).to.equal("not-found");
  });
});
