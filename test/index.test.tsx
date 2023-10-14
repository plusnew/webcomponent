import { expect } from '@esm-bundle/chai';
import { mount, prop, webcomponent } from "@plusnew/webcomponent"
import { signal } from '@preact/signals-core';

describe('webcomponent', () => {
  it('adds two numbers together', () => {

    const Component = webcomponent("foo-bar", class Component {
        @prop()
        accessor foo: string;

        #baz = signal("baz");

        render() {
            return this.#baz.value;
        }
    })

    const container = document.createElement("div");

    // @ts-expect-error
    <Component />;

    // @ts-expect-error
    <Component foo={2}  />;

    // @ts-expect-error
    <Component foo="bar" baz="mep" />;

    mount(container, <Component foo="mep"/>)

    expect(container.childNodes.length === 1)
  });
});
