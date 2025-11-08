import { expect } from "@esm-bundle/chai";
import {
  createComponent,
  dispatchEvent,
  mount,
  prop,
} from "@plusnew/webcomponent";
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
        render(this: NestedComponent) {
          return (
            <button
              onclick={() => dispatchEvent(this, "foo", { detail: "mep" })}
            />
          );
        }
      },
    );

    mount(container, <Component />);

    const component = container.childNodes[0] as HTMLElement;
    (
      component.shadowRoot?.childNodes[0] as HTMLElement
    ).shadowRoot?.childNodes[0].dispatchEvent(new MouseEvent("click"));

    expect(counter).to.equal(1);

    component.remove();
    (
      component.shadowRoot?.childNodes[0] as HTMLElement
    ).shadowRoot?.childNodes[0].dispatchEvent(new MouseEvent("click"));

    expect(counter).to.equal(1);
  });

  it("updating eventListener reference", () => {
    let counter = 0;
    const Component = createComponent(
      "test-dereference-container",
      class Component extends HTMLElement {
        #counter = signal(0);
        render() {
          return (
            <NestedComponent
              foo={this.#counter.value}
              onfoo={(evt) => {
                counter++;
                expect(evt.detail).to.eql(this.#counter.value + 1);
                this.#counter.value = evt.detail;
              }}
            />
          );
        }
      },
    );

    const NestedComponent = createComponent(
      "test-deference",
      class NestedComponent extends HTMLElement {
        @prop() accessor foo: number;
        onfoo: (evt: CustomEvent<number>) => void;
        render(this: NestedComponent) {
          const derefence = (value: number) => (
            <button
              onclick={() => dispatchEvent(this, "foo", { detail: value + 1 })}
            >
              {value.toString()}
            </button>
          );
          return derefence(this.foo);
        }
      },
    );

    mount(container, <Component />);

    const component = container.childNodes[0] as HTMLElement;
    const nestedComponent = component.shadowRoot?.childNodes[0] as HTMLElement;
    const button = nestedComponent.shadowRoot?.childNodes[0];
    expect(button?.textContent).to.eql("0");
    expect(counter).to.eql(0);

    button?.dispatchEvent(new MouseEvent("click"));

    expect(button?.textContent).to.eql("1");
    expect(counter).to.eql(1);

    button?.dispatchEvent(new MouseEvent("click"));

    expect(button?.textContent).to.eql("2");
    expect(counter).to.eql(2);
  });
});
