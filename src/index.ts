import {Signal, batch, effect, signal} from  "@preact/signals-core"

type JSXElement = string | false | JSXElement[];

type Webcomponent<T extends { render: () => JSXElement }> = {
    new ():  T
}

const dirtyFlag = Symbol("dirty")

export function mount(parent: HTMLElement, JSXElement: JSXElement) {

}

export function webcomponent<T extends { render: () => JSXElement}>(name: string, Webcomponent: Webcomponent<T>): (properties: {[K in (Exclude<keyof T, "render">)]: T[K]}) => null {
    Webcomponent.prototype = HTMLElement;
    Webcomponent.prototype.connectedCallback = function() {
        const scope = this;

        effect(() => {
            batch(() => {
                const result = scope.render();
                reconcile(result, false, null)
            });
        });
    }

    customElements.define("my-autonomous-element", Webcomponent as any);

    return {} as any
}


export function prop(){
    return <T, U>(decoratorTarget: ClassAccessorDecoratorTarget<T, U>, accessor: ClassAccessorDecoratorContext<T, U>): ClassAccessorDecoratorResult<T,U> => {
        let storage: Signal<U> | null =null;
        return {
            set: function(value) {
                if(storage === null ) {
                    storage = signal(value)
                } else {
                    storage.value = value
                }
            },
            get: function() {
                return storage === null ? undefined as U : storage.value;
            }
        }
    }
}

function reconcile(newShadowDom: JSXElement, oldShadowDom: JSXElement, previousSibling: Node | null): Node | null {
    return previousSibling;
}
