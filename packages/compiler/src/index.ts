// Aether Compiler - Babel Plugin
// 将 $state/$derived/$effect/$store/$async/$style 宏转换为运行时调用
// 将 JSX 转换为细粒度 DOM 操作
// 包含优化 passes: 死代码消除、常量派生内联、JSX 完整性验证

import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';
import type { types as BabelTypes } from '@babel/core';

import { transformMacros } from './transform-macros.ts';
import { transformJSX } from './transform-jsx.ts';
import { transformStyle } from './transform-style.ts';
import { transformSSR } from './transform-ssr.ts';
import { optimize, generateOptimizationReport } from './optimize.ts';

// 所有 Aether 宏名称
const MACRO_NAMES = ['$state', '$derived', '$effect', '$store', '$async', '$style'];

interface AetherState {
  stateVars: Map<string, NodePath<t.VariableDeclarator>>;
  derivedVars: Map<string, NodePath<t.VariableDeclarator>>;
  effectCalls: NodePath<t.Expression>[];
  macroImported: boolean;
  importPath: NodePath<t.ImportDeclaration> | null;
  _import_$state?: string;
  _import_$derived?: string;
  _import_$effect?: string;
  _import_$store?: string;
  _import_$async?: string;
  _import_$style?: string;
  _hasStore?: boolean;
  _hasAsync?: boolean;
  _needsDOM?: boolean;
  _scopeIds?: string[];
  _elCounter?: number;
  _inlinedDerived?: Set<string>;
  _jsxValidationErrors?: Array<{ type: string; message: string; loc: unknown }>;
}

interface PluginState extends Record<string, unknown> {
  aether: AetherState;
  ssr: SSRState;
  opts?: { verbose?: boolean; disableOptimizations?: boolean; isHmrBoundary?: boolean; hmrState?: unknown; ssr?: boolean };
  filename?: string;
}

interface BabelPluginOptions {
  isHmrBoundary?: boolean;
  hmrState?: unknown;
  verbose?: boolean;
  disableOptimizations?: boolean;
  ssr?: boolean;  // SSR 编译模式
}

// SSR 状态接口
interface SSRState {
  isServerComponent: boolean;
  isClientComponent: boolean;
  componentName: string | null;
  serverMacroImported: boolean;
  _import_$server?: string;
  ssrMode: boolean;
  serverBoundaryMarked: boolean;
  clientBoundaryMarked: boolean;
}

function aetherPlugin({ types: t }: { types: typeof BabelTypes }, options: BabelPluginOptions = {}) {
  const { isHmrBoundary = false, hmrState = null, ssr = false } = options || {};

  return {
    name: 'aether-compiler',
    visitor: {
      Program: {
        enter(path, state: PluginState) {
          // 第一步：分析导入，找出哪些变量是宏声明的
          state.aether = {
            stateVars: new Map(),
            derivedVars: new Map(),
            effectCalls: [],
            macroImported: false,
            importPath: null,
          };

          // 初始化 SSR 状态
          state.ssr = {
            isServerComponent: false,
            isClientComponent: false,
            componentName: null,
            serverMacroImported: false,
            ssrMode: ssr,
            serverBoundaryMarked: false,
            clientBoundaryMarked: false,
          };
        },
        exit(path, state: PluginState) {
          if (!state.aether.macroImported) return;
          // 重写导入：将 'aether' 导入替换为运行时内部导入
          rewriteImports(path, state, t);

          // 执行 JSX 完整性验证
          const errors: Array<{ type: string; message: string; loc: unknown }> = [];
          path.traverse({
            JSXElement(p) {
              errors.push(...optimize.validateJSXIntegrity(p as NodePath<t.JSXElement>, state, t));
            },
            JSXFragment(p) {
              errors.push(...optimize.validateJSXIntegrity(p as NodePath<t.JSXFragment>, state, t));
            }
          });

          // 如果有验证错误，记录到状态中（可用于调试）
          if (errors.length > 0) {
            state.aether._jsxValidationErrors = errors;
            if (state.opts?.verbose) {
              console.warn('[Aether] JSX validation warnings:', errors);
            }
          }
        }
      },

      // 识别 import { $state, $derived, $effect } from 'aether'
      ImportDeclaration(path, state: PluginState) {
        if (path.node.source.value !== 'aether') return;

        state.aether.macroImported = true;
        state.aether.importPath = path as NodePath<t.ImportDeclaration>;

        const specifiers = path.node.specifiers;
        for (const spec of specifiers) {
          if (!t.isImportSpecifier(spec)) continue;
          const imported = (spec.imported as t.Identifier).name;
          const local = (spec.local as t.Identifier).name;

          if (MACRO_NAMES.includes(imported)) {
            // 标记这些导入，后续处理
            (state.aether as Record<string, string>)[`_import_${imported}`] = local;
          }

          // SSR: 检测 $server 宏导入
          if (imported === '$server') {
            state.ssr.serverMacroImported = true;
            state.ssr._import_$server = local;
          }
        }
      },

      // ============================================
      // SSR: 服务端组件检测
      // ============================================

      // 检测函数声明: function ServerComponent() {}
      FunctionDeclaration(path, state: PluginState) {
        if (!state.ssr.ssrMode) return;

        const name = path.node.id?.name;
        if (!name) return;

        // 检测 ServerComponent 命名约定
        if (/^Server/.test(name) || /Server$/.test(name)) {
          markServerComponent(path, state, t);
        }

        // 检测 $server 宏标记
        if (hasServerMacro(path, state, t)) {
          markServerComponent(path, state, t);
        }
      },

      // 检测箭头函数组件: const ServerComponent = () => {}
      VariableDeclarator(path, state: PluginState) {
        if (!state.ssr.ssrMode) return;

        const id = path.node.id;
        if (!t.isIdentifier(id)) return;

        const init = path.node.init;
        if (t.isArrowFunctionExpression(init) && (/^Server/.test(id.name) || /Server$/.test(id.name))) {
          markServerComponent(path, state, t);
        }
      },

      // 处理变量声明：let count = $state(0)
      VariableDeclaration(path, state: PluginState) {
        if (!state.aether.macroImported) return;
        transformMacros.variableDeclaration(path, state, t);
      },

      // 处理表达式语句：$effect(() => { ... })
      ExpressionStatement(path, state: PluginState) {
        if (!state.aether.macroImported) return;
        transformMacros.expressionStatement(path, state, t);
      },

      // 处理赋值：count = 5, count++, count += 1
      AssignmentExpression(path, state: PluginState) {
        if (!state.aether.macroImported) return;
        transformMacros.assignmentExpression(path, state, t);
      },

      UpdateExpression(path, state: PluginState) {
        if (!state.aether.macroImported) return;
        transformMacros.updateExpression(path, state, t);
      },

      // 处理标识符读取：将 count → count.value
      Identifier(path, state: PluginState) {
        if (!state.aether.macroImported) return;
        transformMacros.identifier(path, state, t);
      },

      // $style 标签模板转换
      TaggedTemplateExpression(path, state: PluginState) {
        if (!state.aether.macroImported) return;
        transformStyle.taggedTemplate(path, state, t);
      },

      // JSX 转换
      JSXElement(path, state: PluginState) {
        if (!state.aether.macroImported) return;

        // SSR 模式: 使用 SSR 转换
        if (state.ssr.ssrMode && state.ssr.isServerComponent) {
          transformSSR.jsxElement(path, state, t);
        } else {
          // CSR 模式: 使用标准 DOM 转换
          transformJSX.jsxElement(path, state, t);
        }
      },

      JSXFragment(path, state: PluginState) {
        if (!state.aether.macroImported) return;

        // SSR 模式: 使用 SSR 转换
        if (state.ssr.ssrMode && state.ssr.isServerComponent) {
          transformSSR.jsxFragment(path, state, t);
        } else {
          // CSR 模式: 使用标准 DOM 转换
          transformJSX.jsxFragment(path, state, t);
        }
      },

      // SSR: 处理标识符读取
      Identifier(path, state: PluginState) {
        if (!state.aether.macroImported) return;

        // SSR 模式: 处理 .value 访问
        if (state.ssr.ssrMode && state.ssr.isServerComponent) {
          transformSSR.identifier(path, state, t);
        }

        // CSR 模式: 标准响应式转换
        transformMacros.identifier(path, state, t);
      },

      // SSR: 处理 $async 调用
      CallExpression(path, state: PluginState) {
        if (!state.ssr.ssrMode) return;
        if (!state.ssr.isServerComponent) return;

        transformSSR.CallExpression(path, state, t);
      },

      // ============================================
      // 优化 Passes - 在主要转换后执行
      // ============================================

      // 块级语句 - 执行死代码消除
      BlockStatement(path, state: PluginState) {
        if (!state.aether.macroImported) return;
        if (state.opts?.disableOptimizations) return;

        // 遍历块语句中的 if 语句
        const body = path.node.body;
        let changed = true;
        let iterations = 0;
        const maxIterations = 10; // 防止无限循环

        while (changed && iterations < maxIterations) {
          changed = false;
          iterations++;

          for (const stmt of body) {
            if (t.isIfStatement(stmt)) {
              if (optimize.deadCodeElimination({
                node: stmt,
                replaceWithMultiple: (nodes) => {
                  const idx = body.indexOf(stmt);
                  body.splice(idx, 1, ...nodes);
                },
                remove: () => {
                  const idx = body.indexOf(stmt);
                  body.splice(idx, 1);
                },
                replaceWith: (node) => {
                  const idx = body.indexOf(stmt);
                  body[idx] = node;
                }
              } as NodePath<t.IfStatement> & { replaceWithMultiple(nodes: t.Node[]): void; remove(): void; replaceWith(node: t.Node): void }, state, t)) {
                changed = true;
                break;
              }
            }
          }
        }
      },

      // 调用表达式 - 执行常量派生内联
      CallExpression(path, state: PluginState) {
        if (!state.aether.macroImported) return;
        if (state.opts?.disableOptimizations) return;

        // 在 $derived 转换完成后，尝试内联常量派生
        if (path.node.callee && t.isIdentifier(path.node.callee) &&
            path.node.callee.name === '__derived') {
          optimize.constantDerivedInlining(path as NodePath<t.CallExpression>, state, t);
        }
      },

    }
  };
}

// 重写导入语句
function rewriteImports(programPath: NodePath<t.Program>, state: PluginState, t: typeof import('@babel/types')) {
  const { importPath, stateVars, derivedVars } = state.aether;
  if (!importPath) return;

  // 收集需要从运行时导入的内部函数
  const runtimeImports = new Set<string>();

  if (stateVars.size > 0) runtimeImports.add('__signal');
  if (derivedVars.size > 0) runtimeImports.add('__derived');
  if (state.aether.effectCalls.length > 0) runtimeImports.add('__effect');
  if (state.aether._hasStore) runtimeImports.add('__store');
  if (state.aether._hasAsync) runtimeImports.add('__async');

  // 检查是否有 JSX（需要 DOM 运行时）
  if (state.aether._needsDOM) {
    runtimeImports.add('__createElement');
    runtimeImports.add('__createText');
    runtimeImports.add('__setAttr');
    runtimeImports.add('__bindText');
    runtimeImports.add('__bindAttr');
    runtimeImports.add('__createComponent');
    runtimeImports.add('__conditional');
    runtimeImports.add('__list');
    runtimeImports.add('__spreadAttrs');
    runtimeImports.add('__child');
    runtimeImports.add('__bindChild');
  }

  // 保留非宏的导入（如 mount）
  const keptSpecifiers: t.ImportSpecifier[] = [];
  for (const spec of importPath.node.specifiers) {
    if (!t.isImportSpecifier(spec)) continue;
    const name = (spec.imported as t.Identifier).name;
    if (!MACRO_NAMES.includes(name)) {
      keptSpecifiers.push(spec);
    }
  }

  // 合并所有导入到一条 import 语句
  const allSpecifiers: (t.ImportSpecifier | t.ImportDefaultSpecifier)[] = [];

  // 运行时内部导入
  for (const name of runtimeImports) {
    allSpecifiers.push(t.importSpecifier(t.identifier(name), t.identifier(name)));
  }

  // 保留的用户导入（如 mount）
  for (const spec of keptSpecifiers) {
    allSpecifiers.push(spec);
  }

  const newImports: t.ImportDeclaration[] = [];
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

  // SSR 模式: 添加 SSR 运行时导入
  if (state.ssr.ssrMode) {
    const ssrImports: string[] = ['__ssr', '__ssrEscape', '__markServer', '__markClient'];

    // 查找或创建 aether 导入
    let aetherImport = programPath.node.body.find(
      node => t.isImportDeclaration(node) && node.source.value === 'aether'
    ) as t.ImportDeclaration | undefined;

    if (aetherImport) {
      // 添加 SSR 运行时导入
      for (const name of ssrImports) {
        if (!aetherImport.specifiers.some(s => t.isImportSpecifier(s) && s.imported.name === name)) {
          aetherImport.specifiers.push(t.importSpecifier(t.identifier(name), t.identifier(name)));
        }
      }
    } else {
      // 创建新的导入
      const newImport = t.importDeclaration(
        ssrImports.map(name => t.importSpecifier(t.identifier(name), t.identifier(name))),
        t.stringLiteral('aether')
      );
      programPath.node.body.unshift(newImport);
    }
  }
}

// ============================================
// SSR 辅助函数
// ============================================

/**
 * 标记为服务端组件
 */
function markServerComponent(path: NodePath<t.Node>, state: PluginState, t: typeof import('@babel/types')) {
  state.ssr.isServerComponent = true;
  state.ssr.isClientComponent = false;
  state.ssr.serverBoundaryMarked = true;

  // 插入服务端边界标记: __markServer()
  insertBoundaryMarker(path, '__markServer', t);
}

/**
 * 标记为客户端组件
 */
function markClientComponent(path: NodePath<t.Node>, state: PluginState, t: typeof import('@babel/types')) {
  state.ssr.isClientComponent = true;
  state.ssr.isServerComponent = false;
  state.ssr.clientBoundaryMarked = true;

  // 插入客户端边界标记: __markClient()
  insertBoundaryMarker(path, '__markClient', t);
}

/**
 * 插入边界标记调用
 */
function insertBoundaryMarker(path: NodePath<t.Node>, markerName: string, t: typeof import('@babel/types')) {
  const markerCall = t.expressionStatement(
    t.callExpression(t.identifier(markerName), [])
  );

  // 找到函数体
  const funcPath = path.getFunctionParent();
  if (funcPath && funcPath.node.body) {
    const body = funcPath.node.body;
    if (t.isBlockStatement(body)) {
      // 在函数体开头插入
      body.body.unshift(markerCall);
    }
  }
}

/**
 * 检测是否有 $server 宏标记
 */
function hasServerMacro(path: NodePath<t.Node>, state: PluginState, t: typeof import('@babel/types')): boolean {
  // 查找注释中的 @server 标记
  const comments = path.node.leadingComments;
  if (comments) {
    for (const comment of comments) {
      if (comment.value.includes('@server') || comment.value.includes('$server')) {
        return true;
      }
    }
  }

  // 检查 $server 导入
  if (state.ssr.serverMacroImported && state.ssr._import_$server) {
    // 检查函数/变量前是否有 $server 调用
    const parent = path.parent;
    if (parent && t.isCallExpression(parent)) {
      if (t.isIdentifier(parent.callee) && parent.callee.name === state.ssr._import_$server) {
        return true;
      }
    }
  }

  return false;
}

// 导出 Vite 插件
export function aetherVitePlugin(options: { ssr?: boolean } = {}) {
  const ssrMode = options.ssr ?? false;

  // HMR 状态管理
  const hmrBoundaries = new Set<string>(); // 记录哪些模块是 HMR 边界
  const compiledModules = new Map<string, { code: string; map: unknown }>(); // moduleId -> { code, map }

  return {
    name: 'vite-plugin-aether',
    enforce: 'pre',

    config() {
      return {
        // Vite 8+: use oxc instead of deprecated esbuild option
        oxc: {
          jsx: 'preserve', // 保留 JSX 给 Babel 处理
        },
      };
    },

    async transform(code: string, id: string) {
      if (!/\.[jt]sx?$/.test(id)) return null;
      if (id.includes('node_modules')) return null;
      // 排除 runtime 和 compiler 包本身（它们已经是 TypeScript，不需要编译）
      if (id.includes('/packages/runtime/src/')) return null;
      if (id.includes('/packages/compiler/src/')) return null;
      if (!code.includes('aether')) return null;

      const babel = await import('@babel/core');

      // 检查是否是 HMR 边界文件（顶层组件文件，包含 mount() 调用）
      const isHmrBoundary = code.includes('mount(') && !id.includes('node_modules');

      try {
        const result = await babel.transformAsync(code, {
          filename: id,
          plugins: [
            ['@babel/plugin-syntax-jsx'],
            [aetherPlugin, { isHmrBoundary, ssr: ssrMode }],
          ],
          sourceMaps: true,
          comments: true,
          cloneInputAst: true,
          cwd: process.cwd(),
          configFile: false,
          babelrc: false,
        });

        if (!result) return null;

        // 如果是 HMR 边界模块，添加 HMR 接受代码
        let finalCode = result.code ?? '';
        if (isHmrBoundary) {
          hmrBoundaries.add(id);
          finalCode = addHmrAcceptCode(finalCode, id);
        }

        // 缓存编译结果
        compiledModules.set(id, { code: finalCode, map: result.map });

        return {
          code: finalCode,
          map: result.map,
          ast: result.ast,
        };
      } catch (err) {
        // 编译错误：记录并通过 Vite 错误 overlay 显示
        console.error(`[Aether] Transform error in ${id}:`, err);
        throw err; // 让 Vite 处理错误显示
      }
    },

    // Vite 专用钩子：处理 HMR
    configureServer(server: { ws: { on: (event: string, cb: () => void) => void } }) {
      // 注入全局 HMR runtime
      server.ws.on('connection', () => {
        // 重置错误状态
      });
    },

    // 生成 HMR 边界代码
    transformIndexHtml(html: string, { server }: { server?: unknown }) {
      // 为开发模式注入 HMR runtime
      if (!server) return html;

      const hmrRuntime = `
      <script type="module">
      (function() {
        // Aether HMR Runtime - 全局状态
        window.__AETHER_HMR__ = window.__AETHER_HMR__ || {
          instances: new Map(),
          componentStates: new Map(),
          errors: []
        };

        // 注册组件实例
        window.__AETHER_HMR__.registerInstance = function(id, instance) {
          this.instances.set(id, instance);
        };

        // 获取组件实例
        window.__AETHER_HMR__.getInstance = function(id) {
          return this.instances.get(id);
        };

        // Vite HMR API 兼容
        if (import.meta && import.meta.hot) {
          import.meta.hot.on('aether:error', (data) => {
            console.error('[Aether HMR]', data.error);
            window.__AETHER_HMR__.errors.push(data.error);
          });
        }
      })();
      </script>
      `;

      return html.replace('</body>', `${hmrRuntime}</body>`);
    },

    // HMR 更新处理
    handleHotUpdate(ctx: { file: string; server: { moduleGraph: { getModuleById: (id: string) => unknown } }; read: () => string }) {
      const { file, server } = ctx;

      // 只处理 Aether 文件的 HMR
      if (!/\.[jt]sx?$/.test(file)) return;
      if (file.includes('node_modules')) return;

      // 找到对应的模块
      const mod = server.moduleGraph.getModuleById(file);
      if (!mod) return;

      // 检查是否是 HMR 边界
      const isBoundary = hmrBoundaries.has(file);

      if (isBoundary) {
        // HMR 边界模块：需要完整重新渲染，但保留状态
        // 发送自定义事件通知客户端
        ctx.server.ws.send({
          type: 'custom',
          event: 'aether:hmr-update',
          data: { file, boundary: true }
        });
      } else {
        // 非边界模块：可以被接受
        ctx.server.ws.send({
          type: 'custom',
          event: 'aether:hmr-update',
          data: { file, boundary: false }
        });
      }
    },

    // 生成模块时的钩子
    generateBundle(_options: unknown, _bundle: unknown) {
      // 生产构建不需要 HMR
    },
  };
}

// 为 HMR 边界模块添加接受代码
function addHmrAcceptCode(code: string, id: string): string {
  // 检查是否已经有 HMR 代码
  if (code.includes('import.meta.hot')) return code;

  // 提取 mount 调用信息
  const mountMatch = code.match(/mount\s*\(\s*(\w+)\s*,\s*['"]([^'"]+)['"]/);
  const componentName = mountMatch ? mountMatch[1] : 'Component';
  const containerId = mountMatch ? mountMatch[2] : '#app';

  // 添加 Vite HMR 接受代码
  const hmrCode = `
// Aether HMR Support
if (import.meta && import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.on('vite:beforeUpdate', () => {
    console.log('[Aether HMR] Updating:', ${JSON.stringify(id)});
  });
}
`;

  // 在文件末尾添加 HMR 代码
  return code + hmrCode;
}

export default aetherPlugin;
