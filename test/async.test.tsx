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

  it("async event dispatch", async () => {
    const { promise, resolve } = Promise.withResolvers<void>();

    const Component = createComponent(
      "test-async-dispatch",
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

    mount(container, <Component onfoo={() => promise} />);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;
    const element = component.shadowRoot?.childNodes[0] as HTMLSpanElement;

    expect(element.classList.contains("loading")).to.eql(false);

    element.dispatchEvent(new MouseEvent("click"));

    expect(element.classList.contains("loading")).to.eql(true);

    await Promise.resolve();

    expect(element.classList.contains("loading")).to.eql(true);

    resolve();
    await promise;
    await Promise.resolve();

    expect(element.classList.contains("loading")).to.eql(false);
  });

  it("async event listener", async () => {
    const { promise, resolve } = Promise.withResolvers<void>();

    const Component = createComponent(
      "test-async-listener",
      class Component extends HTMLElement {
        onfoo: (evt: CustomEvent<null>) => void;

        #loading = signal(false);
        render(this: Component) {
          return (
            <span
              className={this.#loading.value === true ? "loading" : ""}
              onplusnewasyncevent={async (evt) => {
                if (
                  (evt.target as HTMLElement).tagName === "BUTTON" &&
                  evt.detail.cause.type === "click"
                ) {
                  this.#loading.value = true;
                  try {
                    await evt.detail.promise;
                  } catch (_err) {}
                  this.#loading.value = false;
                }
              }}
            >
              <button onclick={() => promise} />
            </span>
          );
        }
      },
    );

    mount(container, <Component onfoo={() => promise} />);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;
    const element = component.shadowRoot?.childNodes[0] as HTMLSpanElement;
    const button = element.childNodes[0] as HTMLButtonElement;

    expect(element.classList.contains("loading")).to.eql(false);

    button.dispatchEvent(new MouseEvent("click"));

    expect(element.classList.contains("loading")).to.eql(true);

    await Promise.resolve();

    expect(element.classList.contains("loading")).to.eql(true);

    resolve();
    await promise;
    await Promise.resolve();

    expect(element.classList.contains("loading")).to.eql(false);
  });
});
