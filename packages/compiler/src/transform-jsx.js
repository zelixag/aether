// Aether Compiler - JSX 转换
// 将 JSX 转换为细粒度 DOM 操作调用
//
// 输入: <div class={cls}>{count} items</div>
// 输出:
//   const __el0 = __createElement("div");
//   __bindAttr(__el0, "class", () => cls.value);
//   const __t0 = __createText("");
//   __bindText(__t0, () => cls.value);
//   __el0.appendChild(__t0);
//   __el0.appendChild(__createText(" items"));

export const transformJSX = {
  jsxElement(path, state, t) {
    state.aether._needsDOM = true;
    const result = buildElement(path.node, state, t);
    path.replaceWith(result);
  },

  jsxFragment(path, state, t) {
    state.aether._needsDOM = true;
    const result = buildFragment(path.node, state, t);
    path.replaceWith(result);
  },
};

function buildElement(node, state, t) {
  const opening = node.openingElement;
  const tagName = getTagName(opening.name, t);

  // 组件（大写开头）vs HTML 元素
  if (isComponent(tagName)) {
    return buildComponentCall(node, tagName, state, t);
  }

  // 使用 IIFE 来生成完整的 DOM 构建代码
  // (() => {
  //   const __el = __createElement("div");
  //   ...设置属性和子节点...
  //   return __el;
  // })()
  const elId = state.aether._elCounter = (state.aether._elCounter || 0) + 1;
  const elName = `__el${elId}`;
  const elIdentifier = t.identifier(elName);

  const statements = [];

  // const __el = __createElement("tag")
  statements.push(
    t.variableDeclaration('const', [
      t.variableDeclarator(
        elIdentifier,
        t.callExpression(t.identifier('__createElement'), [t.stringLiteral(tagName)])
      )
    ])
  );

  // 处理属性
  for (const attr of opening.attributes) {
    if (t.isJSXSpreadAttribute(attr)) {
      // {...props} → Object.keys(props).forEach(k => __setAttr(__el, k, props[k]))
      statements.push(
        t.expressionStatement(
          t.callExpression(
            t.memberExpression(
              t.callExpression(
                t.memberExpression(t.identifier('Object'), t.identifier('keys')),
                [attr.argument]
              ),
              t.identifier('forEach')
            ),
            [t.arrowFunctionExpression(
              [t.identifier('__k')],
              t.callExpression(t.identifier('__setAttr'), [
                t.cloneNode(elIdentifier),
                t.identifier('__k'),
                t.memberExpression(attr.argument, t.identifier('__k'), true)
              ])
            )]
          )
        )
      );
      continue;
    }

    const attrName = getAttrName(attr.name, t);
    const attrValue = attr.value;

    if (!attrValue) {
      // boolean 属性: <input disabled />
      statements.push(
        t.expressionStatement(
          t.callExpression(t.identifier('__setAttr'), [
            t.cloneNode(elIdentifier),
            t.stringLiteral(attrName),
            t.booleanLiteral(true)
          ])
        )
      );
    } else if (t.isStringLiteral(attrValue)) {
      // 静态属性: class="foo"
      statements.push(
        t.expressionStatement(
          t.callExpression(t.identifier('__setAttr'), [
            t.cloneNode(elIdentifier),
            t.stringLiteral(attrName),
            attrValue
          ])
        )
      );
    } else if (t.isJSXExpressionContainer(attrValue)) {
      const expr = attrValue.expression;

      if (attrName.startsWith('on')) {
        // 事件处理器：始终静态绑定
        statements.push(
          t.expressionStatement(
            t.callExpression(t.identifier('__setAttr'), [
              t.cloneNode(elIdentifier),
              t.stringLiteral(attrName),
              expr
            ])
          )
        );
      } else if (isStaticExpression(expr, state, t)) {
        // 静态表达式
        statements.push(
          t.expressionStatement(
            t.callExpression(t.identifier('__setAttr'), [
              t.cloneNode(elIdentifier),
              t.stringLiteral(attrName),
              expr
            ])
          )
        );
      } else {
        // 响应式表达式 → __bindAttr
        statements.push(
          t.expressionStatement(
            t.callExpression(t.identifier('__bindAttr'), [
              t.cloneNode(elIdentifier),
              t.stringLiteral(attrName),
              t.arrowFunctionExpression([], expr)
            ])
          )
        );
      }
    }
  }

  // 处理子节点
  const children = node.children;
  for (const child of children) {
    const childStatements = buildChild(child, elIdentifier, state, t);
    statements.push(...childStatements);
  }

  // return __el
  statements.push(t.returnStatement(t.cloneNode(elIdentifier)));

  // 包装为 IIFE
  return t.callExpression(
    t.arrowFunctionExpression([], t.blockStatement(statements)),
    []
  );
}

function buildFragment(node, state, t) {
  const fragId = state.aether._elCounter = (state.aether._elCounter || 0) + 1;
  const fragName = `__frag${fragId}`;
  const fragIdentifier = t.identifier(fragName);

  const statements = [];

  statements.push(
    t.variableDeclaration('const', [
      t.variableDeclarator(
        fragIdentifier,
        t.callExpression(
          t.memberExpression(t.identifier('document'), t.identifier('createDocumentFragment')),
          []
        )
      )
    ])
  );

  for (const child of node.children) {
    const childStatements = buildChild(child, fragIdentifier, state, t);
    statements.push(...childStatements);
  }

  statements.push(t.returnStatement(t.cloneNode(fragIdentifier)));

  return t.callExpression(
    t.arrowFunctionExpression([], t.blockStatement(statements)),
    []
  );
}

function buildChild(child, parentIdentifier, state, t) {
  const statements = [];

  if (t.isJSXText(child)) {
    // 静态文本
    const text = child.value.replace(/\s+/g, ' ');
    if (text.trim() === '') return statements; // 跳过纯空白

    statements.push(
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(t.cloneNode(parentIdentifier), t.identifier('appendChild')),
          [t.callExpression(t.identifier('__createText'), [t.stringLiteral(text)])]
        )
      )
    );
  } else if (t.isJSXExpressionContainer(child)) {
    const expr = child.expression;
    if (t.isJSXEmptyExpression(expr)) return statements;

    if (isStaticExpression(expr, state, t)) {
      // 静态表达式 → 直接文本节点
      statements.push(
        t.expressionStatement(
          t.callExpression(
            t.memberExpression(t.cloneNode(parentIdentifier), t.identifier('appendChild')),
            [t.callExpression(t.identifier('__createText'), [
              t.callExpression(t.memberExpression(t.identifier('String'), t.identifier('')), [expr])
            ])]
          )
        )
      );
    } else {
      // 响应式表达式 → __bindText
      const textId = state.aether._elCounter = (state.aether._elCounter || 0) + 1;
      const textName = `__t${textId}`;
      const textIdentifier = t.identifier(textName);

      statements.push(
        t.variableDeclaration('const', [
          t.variableDeclarator(
            textIdentifier,
            t.callExpression(t.identifier('__createText'), [t.stringLiteral('')])
          )
        ]),
        t.expressionStatement(
          t.callExpression(t.identifier('__bindText'), [
            t.cloneNode(textIdentifier),
            t.arrowFunctionExpression([], expr)
          ])
        ),
        t.expressionStatement(
          t.callExpression(
            t.memberExpression(t.cloneNode(parentIdentifier), t.identifier('appendChild')),
            [t.cloneNode(textIdentifier)]
          )
        )
      );
    }
  } else if (t.isJSXElement(child)) {
    // 嵌套元素 → 递归
    const childEl = buildElement(child, state, t);
    statements.push(
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(t.cloneNode(parentIdentifier), t.identifier('appendChild')),
          [childEl]
        )
      )
    );
  } else if (t.isJSXFragment(child)) {
    const childFrag = buildFragment(child, state, t);
    statements.push(
      t.expressionStatement(
        t.callExpression(
          t.memberExpression(t.cloneNode(parentIdentifier), t.identifier('appendChild')),
          [childFrag]
        )
      )
    );
  }

  return statements;
}

function buildComponentCall(node, tagName, state, t) {
  const opening = node.openingElement;

  // 收集 props
  const properties = [];
  for (const attr of opening.attributes) {
    if (t.isJSXSpreadAttribute(attr)) {
      properties.push(t.spreadElement(attr.argument));
    } else {
      const name = getAttrName(attr.name, t);
      const value = attr.value
        ? (t.isJSXExpressionContainer(attr.value) ? attr.value.expression : attr.value)
        : t.booleanLiteral(true);
      properties.push(t.objectProperty(t.identifier(name), value));
    }
  }

  // 处理 children
  const children = node.children.filter(c => {
    if (t.isJSXText(c) && c.value.trim() === '') return false;
    return true;
  });

  if (children.length > 0) {
    const childExprs = children.map(child => {
      if (t.isJSXText(child)) {
        return t.stringLiteral(child.value.replace(/\s+/g, ' ').trim());
      }
      if (t.isJSXExpressionContainer(child)) {
        return child.expression;
      }
      if (t.isJSXElement(child)) {
        return buildElement(child, state, t);
      }
      return t.nullLiteral();
    });

    properties.push(
      t.objectProperty(
        t.identifier('children'),
        childExprs.length === 1 ? childExprs[0] : t.arrayExpression(childExprs)
      )
    );
  }

  const propsArg = properties.length > 0
    ? t.objectExpression(properties)
    : t.objectExpression([]);

  // __createComponent(ComponentFn, setupFn)
  // 简化为直接调用组件函数
  return t.callExpression(
    t.identifier('__createComponent'),
    [
      t.arrowFunctionExpression([], t.blockStatement([
        t.returnStatement(
          t.callExpression(t.identifier(tagName), [propsArg])
        )
      ]))
    ]
  );
}

// ============================================
// 辅助函数
// ============================================

function getTagName(name, t) {
  if (t.isJSXIdentifier(name)) return name.name;
  if (t.isJSXMemberExpression(name)) {
    return `${getTagName(name.object, t)}.${name.property.name}`;
  }
  return 'div';
}

function getAttrName(name, t) {
  if (t.isJSXIdentifier(name)) return name.name;
  if (t.isJSXNamespacedName(name)) return `${name.namespace.name}:${name.name.name}`;
  return '';
}

function isComponent(tagName) {
  return /^[A-Z]/.test(tagName);
}

// 判断表达式是否是静态的（不包含响应式变量）
function isStaticExpression(expr, state, t) {
  if (t.isStringLiteral(expr) || t.isNumericLiteral(expr) || t.isBooleanLiteral(expr)) {
    return true;
  }

  if (t.isIdentifier(expr)) {
    const name = expr.name;
    if (state.aether.stateVars.has(name) || state.aether.derivedVars.has(name)) {
      return false;
    }
    return true;
  }

  // 包含函数调用的默认为动态
  if (t.isCallExpression(expr)) return false;

  // 模板字符串如果包含响应式变量则为动态
  if (t.isTemplateLiteral(expr)) {
    return expr.expressions.every(e => isStaticExpression(e, state, t));
  }

  // 二元/一元表达式
  if (t.isBinaryExpression(expr)) {
    return isStaticExpression(expr.left, state, t) && isStaticExpression(expr.right, state, t);
  }

  // 默认为动态
  return false;
}
