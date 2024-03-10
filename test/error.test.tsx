import { expect } from "@esm-bundle/chai";
import { mount, webcomponent, WebComponent } from "@plusnew/webcomponent";
import { signal } from "@preact/signals-core";

const ErrorBoundary = webcomponent(
  "test-boundary",
  class Component extends WebComponent {
    throw() {
      this.#errored.value = true;
    }
    #errored = signal(false);
    render() {
      return this.#errored.value ? <slot name="errored" /> : <slot />;
    }
  },
);

xdescribe("webcomponent", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("creates broken component and should display error", () => {
    const Component = webcomponent(
      "test-broken",
      class Component extends WebComponent {
        render(): string {
          throw new Error("I'm broken");
        }
      },
    );

    mount(
      container,
      <ErrorBoundary>
        <Component />
        <span slot="errored">error</span>
      </ErrorBoundary>,
    );

    expect(container.childNodes.length).to.equal(1);

    expect(container.textContent).to.equal("error");
  });

  it("creates broken component and should display error", () => {
    const foo = signal(true);

    const Component = webcomponent(
      "test-later-broken",
      class Component extends WebComponent {
        render() {
          if (foo.value === true) {
            return "good";
          }
          throw new Error("I'm broken");
        }
      },
    );

    mount(
      container,
      <ErrorBoundary>
        <Component />
        <span slot="errored">error</span>
      </ErrorBoundary>,
    );

    expect(container.childNodes.length).to.equal(1);

    // @TODO check if good is shown

    foo.value = false;

    // @TODO check if error is shown
  });
});
