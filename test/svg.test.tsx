import { expect } from "@esm-bundle/chai";
import { createComponent, mount } from "@plusnew/webcomponent";

describe("svg", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("async event dispatch", async () => {
    const Component = createComponent(
      "test-svg",
      class Component extends HTMLElement {
        render(this: Component) {
          return (
            <svg>
              <svg:circle />
            </svg>
          );
        }
      },
    );

    mount(container, <Component />);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;
    const element = component.shadowRoot?.childNodes[0] as SVGElement;

    expect(element.tagName).to.eql("svg");
    expect(element.namespaceURI).to.eql("http://www.w3.org/2000/svg");
    expect((element.childNodes[0] as Element).tagName).to.eql("circle");
    expect((element.childNodes[0] as Element).namespaceURI).to.eql(
      "http://www.w3.org/2000/svg",
    );
  });
});
