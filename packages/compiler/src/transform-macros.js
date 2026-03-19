// Aether Compiler - 宏转换
// 处理 $state/$derived/$effect/$store/$async 的识别和代码转换

export const transformMacros = {
  // ============================================
  // let count = $state(0)       →  const count = __signal(0)
  // let double = $derived(fn)   →  const double = __derived(fn)
  // let store = $store({...})   →  const store = __store({...})
  // let data = $async(fetcher)  →  const data = __async(fetcher)
  // ============================================
  variableDeclaration(path, state, t) {
    const declarations = path.node.declarations;

    for (const decl of declarations) {
      if (!t.isCallExpression(decl.init)) continue;
      if (!t.isIdentifier(decl.callee || decl.init.callee)) continue;

      const calleeName = decl.init.callee.name;

      // $state(initialValue)
      if (calleeName === state.aether._import_$state) {
        const varName = decl.id.name;
        state.aether.stateVars.set(varName, path);
        decl.init.callee = t.identifier('__signal');
        path.node.kind = 'const';
      }

      // $derived(() => expr)
      if (calleeName === state.aether._import_$derived) {
        const varName = decl.id.name;
        state.aether.derivedVars.set(varName, path);
        decl.init.callee = t.identifier('__derived');
        path.node.kind = 'const';
      }

      // $store({ count: 0, name: 'aether' })
      // store 不需要 .value 转换——Proxy 自动处理读写
      if (calleeName === state.aether._import_$store) {
        state.aether._hasStore = true;
        decl.init.callee = t.identifier('__store');
        path.node.kind = 'const';
      }

      // $async(() => fetch('/api'))
      // async 返回 { value, loading, error } — 通过属性访问，不需要 .value 转换
      if (calleeName === state.aether._import_$async) {
        state.aether._hasAsync = true;
        decl.init.callee = t.identifier('__async');
        path.node.kind = 'const';
      }
    }
  },

  // ============================================
  // $effect(() => { ... })  →  __effect(() => { ... })
  // ============================================
  expressionStatement(path, state, t) {
    const expr = path.node.expression;
    if (!t.isCallExpression(expr)) return;
    if (!t.isIdentifier(expr.callee)) return;

    if (expr.callee.name === state.aether._import_$effect) {
      expr.callee = t.identifier('__effect');
      state.aether.effectCalls.push(path);
    }
  },

  // ============================================
  // count = 5  →  count.value = 5
  // count += 1  →  count.value += 1
  // ============================================
  assignmentExpression(path, state, t) {
    const left = path.node.left;
    if (!t.isIdentifier(left)) return;

    const varName = left.name;
    if (!state.aether.stateVars.has(varName)) return;

    // 跳过声明处的初始化赋值
    if (isInDeclarator(path)) return;

    // count = 5  →  count.value = 5
    path.node.left = t.memberExpression(
      t.identifier(varName),
      t.identifier('value')
    );
  },

  // ============================================
  // count++  →  count.value++
  // ++count  →  ++count.value
  // count--  →  count.value--
  // ============================================
  updateExpression(path, state, t) {
    const arg = path.node.argument;
    if (!t.isIdentifier(arg)) return;

    const varName = arg.name;
    if (!state.aether.stateVars.has(varName)) return;

    path.node.argument = t.memberExpression(
      t.identifier(varName),
      t.identifier('value')
    );
  },

  // ============================================
  // count（读取）→  count.value
  // 需要排除：声明、赋值左侧、属性名、导入等
  // ============================================
  identifier(path, state, t) {
    const name = path.node.name;

    // 检查是否是 $state 或 $derived 声明的变量
    const isState = state.aether.stateVars.has(name);
    const isDerived = state.aether.derivedVars.has(name);
    if (!isState && !isDerived) return;

    // 排除不应该转换的位置
    if (shouldSkipIdentifier(path, t)) return;

    // 检查作用域：如果当前作用域有同名绑定（如函数参数），不转换
    const binding = path.scope.getBinding(name);
    if (binding) {
      // 找到宏声明时的原始路径
      const macroBindingPath = state.aether.stateVars.get(name) || state.aether.derivedVars.get(name);
      if (macroBindingPath) {
        // 如果当前绑定不是宏声明的那个变量（被局部变量遮蔽了），跳过
        const declPath = binding.path;
        if (declPath && !declPath.findParent(p => p === macroBindingPath)) {
          // 检查绑定的声明是否在宏声明的同一个 VariableDeclaration 中
          const declParent = declPath.parentPath;
          if (declParent !== macroBindingPath) {
            return;
          }
        }
      }
    }

    // 替换为 name.value
    path.replaceWith(
      t.memberExpression(
        t.identifier(name),
        t.identifier('value')
      )
    );
    path.skip(); // 避免无限递归
  },
};

// ============================================
// 辅助函数
// ============================================

function isInDeclarator(path) {
  let current = path;
  while (current) {
    if (current.isVariableDeclarator()) return true;
    current = current.parentPath;
  }
  return false;
}

function shouldSkipIdentifier(path, t) {
  const parent = path.parent;
  const parentPath = path.parentPath;

  // 1. 变量声明中的 id
  if (parentPath.isVariableDeclarator() && path.key === 'id') return true;

  // 2. 赋值左侧（已经在 assignmentExpression 中处理）
  if (parentPath.isAssignmentExpression() && path.key === 'left') return true;

  // 3. 更新表达式的参数（已在 updateExpression 中处理）
  if (parentPath.isUpdateExpression()) return true;

  // 4. 已经是 member expression 的 object（说明已经转换过了）
  if (parentPath.isMemberExpression() && path.key === 'object') {
    // 如果已经是 x.value 的形式，跳过
    if (t.isIdentifier(parent.property, { name: 'value' })) return true;
  }

  // 5. 属性访问的 property 部分
  if (parentPath.isMemberExpression() && path.key === 'property' && !parent.computed) {
    return true;
  }

  // 6. 对象属性的 key
  if (parentPath.isObjectProperty() && path.key === 'key') return true;

  // 7. 导入声明
  if (parentPath.isImportSpecifier() || parentPath.isImportDeclaration()) return true;

  // 8. 函数参数声明
  if (parentPath.isFunction() && path.listKey === 'params') return true;

  // 9. $state/$derived 的调用者
  if (parentPath.isCallExpression() && path.key === 'callee') return true;

  // 10. 类型注解（TypeScript）
  if (parentPath.isTSTypeReference?.()) return true;

  return false;
}
