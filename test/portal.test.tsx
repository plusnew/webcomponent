import { expect } from "@esm-bundle/chai";
import { PortalEntrance, createComponent, findParent, mount } from "@plusnew/webcomponent";
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        return "not-found";
      }
    }
  },
);

describe("webcomponent", () => {
  let container: HTMLElement;
  let portal: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);

    portal = document.createElement("div");
    portal.id = "portal-exit";
    document.body.appendChild(portal);
  });

  afterEach(() => {
    container.remove();
    portal.remove();
  });

  it("moves element to portal", () => {
    const show = signal(true);

    const Component = createComponent(
      "test-base",
      class Component extends HTMLElement {
        render() {
          return (
            show.value && (
              <PortalEntrance target="portal-exit">
                <span>foo</span>
              </PortalEntrance>
            )
          );
        }
      },
    );

    mount(container, <Component />);

    expect(container.childNodes.length).to.equal(1);
    expect(portal.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;

    expect(component.tagName).to.equal("TEST-BASE");
    expect(component.shadowRoot?.childNodes.length).to.equal(0);

    expect(portal.childNodes.length).to.equal(1);

    expect((portal.childNodes[0] as HTMLElement).tagName).to.equal("SPAN");
    expect((portal.childNodes[0] as HTMLElement).textContent).to.equal("foo");

    show.value = false;

    expect(container.childNodes.length).to.equal(1);
    expect(portal.childNodes.length).to.equal(0);
  });

   it("moves nested element to portal", () => {
    const show = signal(true);

    const Component = createComponent(
      "test-base-nested",
      class Component extends HTMLElement {
        render() {
          return (
            show.value && (
              <div>
                <PortalEntrance target="portal-exit">
                  <span>foo</span>
                </PortalEntrance>
              </div>
            )
          );
        }
      },
    );

    mount(container, <Component />);

    expect(container.childNodes.length).to.equal(1);
    expect(portal.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;

    expect(component.tagName).to.equal("TEST-BASE-NESTED");
    expect(component.shadowRoot?.childNodes.length).to.equal(1);
    expect(component.shadowRoot?.childNodes[0].childNodes.length).to.equal(0);

    expect(portal.childNodes.length).to.equal(1);

    expect((portal.childNodes[0] as HTMLElement).tagName).to.equal("SPAN");
    expect((portal.childNodes[0] as HTMLElement).textContent).to.equal("foo");

    show.value = false;

    expect(container.childNodes.length).to.equal(1);
    expect(portal.childNodes.length).to.equal(0);
  });

  it("context inside portal", ()=> {
    mount(
      container,
      <Provider>
        <PortalEntrance target="portal-exit">
          <Consumer />
        </PortalEntrance>
      </Provider>,
    );


    expect(container.childNodes.length).to.equal(1);
    expect(portal.childNodes.length).to.equal(1);

    const providerElement = container.childNodes[0] as InstanceType<
      typeof Provider
    >;

    expect(providerElement.tagName).to.equal("TEST-PROVIDER");
    expect(providerElement.childNodes.length).to.equal(0);

    expect((portal.childNodes[0] as HTMLElement).tagName).to.equal("TEST-CONSUMER");
    expect((portal.childNodes[0] as HTMLElement).shadowRoot?.textContent).to.equal("foo");

    providerElement.foo.value = "baz";

    expect((portal.childNodes[0] as HTMLElement).shadowRoot?.textContent).to.equal("baz");
  })
});
