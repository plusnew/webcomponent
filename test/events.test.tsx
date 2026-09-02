import { expect } from "@esm-bundle/chai";
import {
  createComponent,
  define,
  dispatchEvent,
  mount,
  prop,
  WebComponent,
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
    @define("test-base")
    class Component extends WebComponent() {
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
    }

    @define("test-nested")
    class NestedComponent extends WebComponent({ onfoo: prop<(evt: CustomEvent) => void>() }) {
      render(this: NestedComponent) {
        return <button onclick={() => dispatchEvent(this, "foo", { detail: "mep" })} />;
      }
    }

    mount(() => <Component />, container);

    const component = container.childNodes[0] as HTMLElement;
    (component.shadowRoot?.childNodes[0] as HTMLElement).shadowRoot?.childNodes[0].dispatchEvent(
      new MouseEvent("click"),
    );

    expect(counter).to.equal(1);

    component.remove();
    (component.shadowRoot?.childNodes[0] as HTMLElement).shadowRoot?.childNodes[0].dispatchEvent(
      new MouseEvent("click"),
    );

    expect(counter).to.equal(1);
  });

  it("updating eventListener reference", () => {
    let counter = 0;
    @define("test-dereference-container")
    class Component extends WebComponent() {
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
    }

    @define("test-deference")
    class NestedComponent extends WebComponent({
      foo: prop<number>(),
      onfoo: prop<(value: CustomEvent<number>) => void>(),
    }) {
      render(this: NestedComponent) {
        const derefence = (value: number) => (
          <button onclick={() => dispatchEvent(this, "foo", { detail: value + 1 })}>
            {value.toString()}
          </button>
        );
        return derefence(this.foo);
      }
    }

    mount(() => <Component />, container);

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
