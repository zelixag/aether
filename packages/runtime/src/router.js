// Aether Router - 内置路由系统
// 基于信号的声明式路由，编译时优化

import { Signal, __effect, __scheduleUpdate } from './signal.js';
import { __createElement, __createText, __setAttr, __bindText } from './dom.js';

// ============================================
// 路由信号（全局单例）
// ============================================
const _path = new Signal(window?.location?.pathname || '/');
const _params = new Signal({});
const _query = new Signal({});

// 路由表
let _routes = [];
let _notFound = null;

// 监听浏览器导航
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    _path.value = window.location.pathname;
    _matchRoute();
  });
}

// ============================================
// 路由匹配
// ============================================
function _matchRoute() {
  const pathname = _path.value;

  for (const route of _routes) {
    const match = _matchPath(route.path, pathname);
    if (match) {
      _params.value = match.params;
      return route;
    }
  }

  return _notFound || null;
}

function _matchPath(pattern, pathname) {
  // /users/:id → 正则匹配
  const paramNames = [];
  const regexStr = pattern
    .replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    })
    .replace(/\*/g, '.*');

  const regex = new RegExp(`^${regexStr}$`);
  const match = pathname.match(regex);

  if (!match) return null;

  const params = {};
  paramNames.forEach((name, i) => {
    params[name] = match[i + 1];
  });

  return { params };
}

// ============================================
// 导航
// ============================================
export function navigate(to, options = {}) {
  if (to === _path.value) return;

  if (options.replace) {
    window.history.replaceState(null, '', to);
  } else {
    window.history.pushState(null, '', to);
  }

  _path.value = to;
  _matchRoute();
}

// ============================================
// 路由组件（编译器目标）
// ============================================

// <Router> 定义路由表
export function __router(routeConfigs) {
  _routes = routeConfigs;

  // 返回渲染锚点
  const container = document.createComment('router');
  let currentNodes = [];
  let currentComponent = null;

  __effect(() => {
    const matched = _matchRoute();
    if (!matched || matched === currentComponent) return;
    currentComponent = matched;

    // 清除旧视图
    for (const node of currentNodes) {
      node.parentNode?.removeChild(node);
    }
    currentNodes = [];

    // 渲染新视图
    if (matched.component) {
      const result = matched.component({ params: _params.value, query: _query.value });
      if (result instanceof Node) {
        currentNodes = [result];
        container.parentNode?.insertBefore(result, container);
      }
    }
  });

  return container;
}

// <Link> 组件
export function Link(props) {
  const el = __createElement('a');
  __setAttr(el, 'href', props.to || '/');

  el.addEventListener('click', (e) => {
    e.preventDefault();
    navigate(props.to, { replace: props.replace });
  });

  // 子节点
  if (props.children) {
    const children = Array.isArray(props.children) ? props.children : [props.children];
    for (const child of children) {
      if (child instanceof Node) {
        el.appendChild(child);
      } else {
        el.appendChild(document.createTextNode(String(child)));
      }
    }
  }

  return el;
}

// ============================================
// 路由 hooks（编译时转换为信号读取）
// ============================================
export function __routePath() {
  return _path;
}

export function __routeParams() {
  return _params;
}

export function __routeQuery() {
  return _query;
}
