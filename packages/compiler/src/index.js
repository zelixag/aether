// Aether Compiler - Babel Plugin
// 将 $state/$derived/$effect 宏转换为运行时调用
// 将 JSX 转换为细粒度 DOM 操作

import { transformMacros } from './transform-macros.js';
import { transformJSX } from './transform-jsx.js';

export default function aetherPlugin({ types: t }) {
  return {
    name: 'aether-compiler',
    visitor: {
      Program: {
        enter(path, state) {
          // 第一步：分析导入，找出哪些变量是宏声明的
          state.aether = {
            stateVars: new Map(),      // 变量名 -> binding path
            derivedVars: new Map(),
            effectCalls: [],
            macroImported: false,
            importPath: null,
          };
        },
        exit(path, state) {
          if (!state.aether.macroImported) return;
          // 重写导入：将 'aether' 导入替换为运行时内部导入
          rewriteImports(path, state, t);
        }
      },

      // 识别 import { $state, $derived, $effect } from 'aether'
      ImportDeclaration(path, state) {
        if (path.node.source.value !== 'aether') return;

        state.aether.macroImported = true;
        state.aether.importPath = path;

        const specifiers = path.node.specifiers;
        for (const spec of specifiers) {
          if (!t.isImportSpecifier(spec)) continue;
          const imported = spec.imported.name;
          const local = spec.local.name;

          if (imported === '$state' || imported === '$derived' || imported === '$effect') {
            // 标记这些导入，后续处理
            state.aether[`_import_${imported}`] = local;
          }
        }
      },

      // 处理变量声明：let count = $state(0)
      VariableDeclaration(path, state) {
        if (!state.aether.macroImported) return;
        transformMacros.variableDeclaration(path, state, t);
      },

      // 处理表达式语句：$effect(() => { ... })
      ExpressionStatement(path, state) {
        if (!state.aether.macroImported) return;
        transformMacros.expressionStatement(path, state, t);
      },

      // 处理赋值：count = 5, count++, count += 1
      AssignmentExpression(path, state) {
        if (!state.aether.macroImported) return;
        transformMacros.assignmentExpression(path, state, t);
      },

      UpdateExpression(path, state) {
        if (!state.aether.macroImported) return;
        transformMacros.updateExpression(path, state, t);
      },

      // 处理标识符读取：将 count → count.value
      Identifier(path, state) {
        if (!state.aether.macroImported) return;
        transformMacros.identifier(path, state, t);
      },

      // JSX 转换
      JSXElement(path, state) {
        if (!state.aether.macroImported) return;
        transformJSX.jsxElement(path, state, t);
      },

      JSXFragment(path, state) {
        if (!state.aether.macroImported) return;
        transformJSX.jsxFragment(path, state, t);
      },
    }
  };
}

// 重写导入语句
function rewriteImports(programPath, state, t) {
  const { importPath, stateVars, derivedVars } = state.aether;
  if (!importPath) return;

  // 收集需要从运行时导入的内部函数
  const runtimeImports = new Set();

  if (stateVars.size > 0) runtimeImports.add('__signal');
  if (derivedVars.size > 0) runtimeImports.add('__derived');
  if (state.aether.effectCalls.length > 0) runtimeImports.add('__effect');

  // 检查是否有 JSX（需要 DOM 运行时）
  if (state.aether._needsDOM) {
    runtimeImports.add('__createElement');
    runtimeImports.add('__createText');
    runtimeImports.add('__setAttr');
    runtimeImports.add('__bindText');
    runtimeImports.add('__bindAttr');
  }

  // 保留非宏的导入（如 mount）
  const keptSpecifiers = [];
  for (const spec of importPath.node.specifiers) {
    if (!t.isImportSpecifier(spec)) continue;
    const name = spec.imported.name;
    if (name !== '$state' && name !== '$derived' && name !== '$effect') {
      keptSpecifiers.push(spec);
    }
  }

  // 合并所有导入到一条 import 语句
  const allSpecifiers = [];

  // 运行时内部导入
  for (const name of runtimeImports) {
    allSpecifiers.push(t.importSpecifier(t.identifier(name), t.identifier(name)));
  }

  // 保留的用户导入（如 mount）
  for (const spec of keptSpecifiers) {
    allSpecifiers.push(spec);
  }

  const newImports = [];
  if (allSpecifiers.length > 0) {
    newImports.push(
      t.importDeclaration(allSpecifiers, t.stringLiteral('aether'))
    );
  }

  // 替换原始导入
  if (newImports.length > 0) {
    importPath.replaceWithMultiple(newImports);
  } else {
    importPath.remove();
  }
}

// 导出 Vite 插件
export function aetherVitePlugin() {
  return {
    name: 'vite-plugin-aether',
    enforce: 'pre',

    config() {
      return {
        esbuild: {
          jsx: 'preserve', // 保留 JSX 给 Babel 处理
        },
      };
    },

    async transform(code, id) {
      if (!/\.[jt]sx?$/.test(id)) return null;
      if (id.includes('node_modules')) return null;
      if (!code.includes('aether')) return null;

      const babel = await import('@babel/core');

      const result = await babel.transformAsync(code, {
        filename: id,
        plugins: [
          ['@babel/plugin-syntax-jsx'],
          [aetherPlugin],
        ],
        sourceMaps: true,
      });

      if (!result) return null;

      return {
        code: result.code,
        map: result.map,
      };
    },
  };
}
