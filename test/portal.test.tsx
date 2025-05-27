import { expect } from "@esm-bundle/chai";
import { PortalEntrance, createComponent, mount } from "@plusnew/webcomponent";
import { signal } from "@preact/signals-core";

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
});
