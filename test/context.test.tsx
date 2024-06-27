import { expect } from "@esm-bundle/chai";
import {
  mount,
  createComponent,
  findParent,
} from "@plusnew/webcomponent";
import { signal } from "@preact/signals-core";

const Provider = createComponent(
  "test-provider",
  class Component extends HTMLElement {
    readonly foo = signal("bar");

    render() {
      return <slot />;
    }
  },
);

const Consumer = createComponent(
  "test-consumer",
  class Component extends HTMLElement {
    render() {
      try {
        return findParent(Provider).foo.value;
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

    const component = providerElement.childNodes[0] as HTMLElement;

    expect(component.tagName).to.equal("TEST-CONSUMER");
    expect(component.shadowRoot?.childNodes.length).to.equal(1);
    expect(component.shadowRoot?.textContent).to.equal("bar");

    providerElement.foo.value = "baz";

    expect(component.tagName).to.equal("TEST-CONSUMER");
    expect(component.shadowRoot?.childNodes.length).to.equal(1);
    expect(component.shadowRoot?.textContent).to.equal("baz");
  });

  it("finds context inline", () => {
    const Component = createComponent(
      "test-inline",
      class Component extends HTMLElement {
        render() {
          return <Provider>{findParent(Provider).foo.value}</Provider>;
        }
      },
    );

    mount(container, <Component />);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;
    expect(component.innerHTML);

    const providerElement = component.shadowRoot?.childNodes[0] as InstanceType<
      typeof Provider
    >;

    expect(providerElement.textContent).to.equal("bar");

    providerElement.foo.value = "baz";

    expect(providerElement.textContent).to.equal("baz");
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

  it("no context", () => {
    const Injection = createComponent(
      "test-injection",
      class Component extends HTMLElement {
        render() {
          return (
            <Provider>
              <slot />
            </Provider>
          );
        }
      },
    );

    mount(
      container,
      <Injection>
        <Consumer />
      </Injection>,
    );

    expect(container.childNodes.length).to.equal(1);

    const injectionElement = container.childNodes[0] as InstanceType<
      typeof Provider
    >;

    expect(injectionElement.tagName).to.equal("TEST-INJECTION");

    const component = injectionElement.childNodes[0] as HTMLElement;

    expect(component.tagName).to.equal("TEST-CONSUMER");
    expect(component.shadowRoot?.childNodes.length).to.equal(1);
    expect(component.shadowRoot?.textContent).to.equal("bar");

    (
      injectionElement.shadowRoot?.childNodes[0] as InstanceType<
        typeof Provider
      >
    ).foo.value = "baz";

    expect(component.tagName).to.equal("TEST-CONSUMER");
    expect(component.shadowRoot?.childNodes.length).to.equal(1);
    expect(component.shadowRoot?.textContent).to.equal("baz");
  });
});
