import { expect } from "@esm-bundle/chai";
import { mount, prop, webcomponent } from "@plusnew/webcomponent";
import { signal } from "@preact/signals-core";

describe("webcomponent", () => {
  it("adds two numbers together", () => {
    const Component = webcomponent(
      "foo-bar",
      class Component extends HTMLElement {
        @prop()
        accessor foo: string;

        #baz = signal("baz");

        render() {
          return this.#baz.value;
        }
      },
    );

    const container = document.createElement("div");

    // @ts-expect-error component with no props given, should be an error
    <Component />;

    // @ts-expect-error component with foo as a number instead of string, should be an error
    <Component foo={2} />;

    // @ts-expect-error component with excessive property baz, should be an error
    <Component foo="bar" baz="mep" />;

    mount(container, <Component foo="mep" />);

    expect(container.childNodes.length).to.equal(1);
    expect((container.childNodes[0] as HTMLElement).tagName).to.equal(
      "FOO-BAR",
    );
  });
});
