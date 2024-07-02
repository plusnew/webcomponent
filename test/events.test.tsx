import { expect } from "@esm-bundle/chai";
import { createComponent, dispatchEvent, mount } from "@plusnew/webcomponent";

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
    let counter = 0;
    const Component = createComponent(
      "test-base",
      class Component extends HTMLElement {
        render() {
          return (
            <NestedComponent
              onfoo={(evt) => {
                counter++;
                expect(evt.detail).to.equal("mep");
              }}
            />
          );
        }
      },
    );

    const NestedComponent = createComponent(
      "test-nested",
      class NestedComponent extends HTMLElement {
        onfoo: (evt: CustomEvent<string>) => void;
        render() {
          return (
            <button
              onclick={() => {
                return dispatchEvent(this as NestedComponent, "onfoo", "mep");
              }}
            />
          );
        }
      },
    );

    mount(container, <Component />);

    (
      (container.childNodes[0] as HTMLElement).shadowRoot
        ?.childNodes[0] as HTMLElement
    ).shadowRoot?.childNodes[0].dispatchEvent(new MouseEvent("click"));

    expect(counter).to.equal(1);
  });
});
