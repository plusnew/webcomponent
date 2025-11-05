import { expect } from "@esm-bundle/chai";
import { createComponent, mount, dispatchEvent } from "@plusnew/webcomponent";
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

  it("async event", async () => {
    const abortController = new AbortController();

    const Component = createComponent(
      "test-nested",
      class Component extends HTMLElement {
        onfoo: (evt: CustomEvent<null>) => void;

        #loading = signal(false);
        render(this: Component) {
          return (
            <span
              className={this.#loading.value === true ? "loading" : ""}
              onclick={async () => {
                this.#loading.value = true;
                try {
                  await Promise.all(dispatchEvent(this, "foo", null));
                } catch (_err) {}
                this.#loading.value = false;
              }}
            />
          );
        }
      },
    );

    mount(
      container,
      <Component
        onfoo={() =>
          new Promise((resolve) => {
            abortController.signal.addEventListener("abort", () => {
              resolve("done");
            });
          })
        }
      />,
    );

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;
    const element = component.shadowRoot?.childNodes[0] as HTMLSpanElement;

    expect(element.classList.contains("loading")).to.eql(false);

    element.dispatchEvent(new MouseEvent("click"));

    expect(element.classList.contains("loading")).to.eql(true);

    await Promise.resolve();

    expect(element.classList.contains("loading")).to.eql(true);

    abortController.abort("abort");

    expect(element.classList.contains("loading")).to.eql(false);
  });
});
