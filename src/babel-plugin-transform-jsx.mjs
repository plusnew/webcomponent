import { addNamed } from "@babel/helper-module-imports";

export default function (babel) {
  const { types: t } = babel;

  return {
    name: "ast-transform", // not required
    visitor: {
      Program: {
        enter: (path, state) => {
          state.set(
            "id/createElement",
            addNamed(
              path,
              "createElement",
              "@plusnew/webcomponent/jsx-runtime",
            ),
          );
        },
      },
      JSXFragment(path, state) {
        if (!state.get("id/Fragment")) {
          state.set(
            "id/Fragment",
            addNamed(
              path,
              "Fragment",
              "@plusnew/webcomponent/jsx-runtime",
            ),
          );
        }

        path.replaceWith(
          t.callExpression(state.get("id/createElement"), [
            state.get("id/Fragment"),
            t.objectExpression([]),
            ...t.react
              .buildChildren(path.node)
              .map((child) => t.arrowFunctionExpression([], child))
          ]),
        );
      },
      JSXElement(path, state) {
        const openingElement = path.get("openingElement");
        const typeValue = openingElement.node.name.name;
        const type = t.react.isCompatTag(typeValue)
          ? t.stringLiteral(typeValue)
          : t.identifier(typeValue);
        const children = t.react
          .buildChildren(path.node)
          .map((child) => t.arrowFunctionExpression([], child));

        const properties = [];
        for (const attribute of openingElement.get("attributes")) {
          if (
            attribute.isJSXAttribute() &&
            t.isJSXIdentifier(attribute.node.name)
          ) {
            const value = t.isJSXExpressionContainer(attribute.node.value)
              ? attribute.node.value.expression
              : attribute.node.value;

            if (
              t.isStringLiteral(value) &&
              !t.isJSXExpressionContainer(attribute.node.value)
            ) {
              value.value = value.value.replace(/\n\s+/g, " ");

              // "raw" JSXText should not be used from a StringLiteral because it needs to be escaped.
              delete value.extra?.raw;
            }

            if (t.isJSXNamespacedName(attribute.node.name)) {
              // @ts-expect-error mutating AST
              attribute.node.name = t.stringLiteral(
                `${attribute.node.name.namespace.name}:${attribute.node.name.name.name}`,
              );
            } else if (t.isValidIdentifier(attribute.node.name.name, false)) {
              // @ts-expect-error mutating AST
              attribute.node.name.type = "Identifier";
            } else {
              // @ts-expect-error mutating AST
              attribute.node.name = t.stringLiteral(attribute.node.name.name);
            }

            properties.push(
              t.inherits(
                t.objectProperty(
                  // @ts-expect-error The attribute.node.name is an Identifier now
                  attribute.node.name,
                  value,
                ),
                attribute.node,
              ),
            );
          } else if (t.isJSXSpreadAttribute(attribute.node.name)) {
            throw new Error("not yet jmplemented");
          } else {
            throw new Error("Unknown type");
          }
        }

        path.replaceWith(
          t.callExpression(state.get("id/createElement"), [
            type,
            t.objectExpression(properties),
            ...children,
          ]),
        );
      },
    },
  };
}
