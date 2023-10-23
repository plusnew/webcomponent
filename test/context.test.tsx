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
