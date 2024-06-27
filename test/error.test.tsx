import { expect } from "@esm-bundle/chai";
import { createComponent, mount } from "@plusnew/webcomponent";
import { signal } from "@preact/signals-core";

function error(): never {
  throw new Error("error!");
}

describe("webcomponent", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("creates broken component and should display error", () => {
    const Component = createComponent(
      "test-broken",
      class Component extends HTMLElement {
        #hasError = signal(false);
        render() {
          return this.#hasError.value ? (
            "error"
          ) : (
            <div
              onplusnewerror={(evt) => {
                this.#hasError.value = true;
                evt.preventDefault();
              }}
            >
              {error()}
            </div>
          );
        }
      },
    );

    mount(container, <Component />);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;

    expect(component.tagName).to.equal("TEST-BROKEN");
    expect((component.shadowRoot as ShadowRoot).textContent).to.equal("error");
  });

  // it("creates broken component and should display error", () => {
  //   const foo = signal(true);

  //   const Component = webcomponent(
  //     "test-later-broken",
  //     class Component extends HTMLElement {
  //       render() {
  //         if (foo.value === true) {
  //           return "good";
  //         }
  //         throw new Error("I'm broken");
  //       }
  //     },
  //   );

  //   mount(
  //     container,
  //     <ErrorBoundary>
  //       <Component />
  //       <span slot="errored">error</span>
  //     </ErrorBoundary>,
  //   );

  //   expect(container.childNodes.length).to.equal(1);

  //   // @TODO check if good is shown

  //   foo.value = false;

  //   // @TODO check if error is shown
  // });
});
