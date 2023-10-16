import { expect } from "@esm-bundle/chai";
import { mount, prop, webcomponent, WebComponent } from "@plusnew/webcomponent";
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
    const Component = webcomponent(
      "foo-bar",
      class Component extends WebComponent {
        @prop()
        accessor foo: string;

        #baz = signal("baz");

        render() {
          return `${this.foo}-${this.#baz.value}`;
        }
      },
    );

    // @ts-expect-error component with no props given, should be an error
    <Component />;

    // @ts-expect-error component with foo as a number instead of string, should be an error
    <Component foo={2} />;

    // @ts-expect-error component with excessive property baz, should be an error
    <Component foo="bar" baz="mep" />;

    mount(container, <Component foo="mep" />);

    expect(container.childNodes.length).to.equal(1);

    const component = container.childNodes[0] as HTMLElement;
    expect(component.tagName).to.equal("FOO-BAR");
    expect(component.childNodes.length).to.equal(0);
    expect(component.shadowRoot?.innerHTML).to.equal("mep-baz");

    (component as any).foo = "sup";

    expect(component.shadowRoot?.innerHTML).to.equal("sup-baz");
  });
});
