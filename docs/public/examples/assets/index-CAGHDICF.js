(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=typeof process<`u`&&!0;function t(t){e&&performance&&performance.mark(`aether:${t}:start`)}function n(t){e&&performance&&(performance.mark(`aether:${t}:end`),performance.measure(t,`aether:${t}:start`,`aether:${t}:end`))}var r=null,i=[];function a(e){i.push(r),r=e}function o(){r=i.pop()??null}var s=class{constructor(e){this._value=e,this._subscribers=new Set}get value(){return r&&(this._subscribers.add(r),r._dependencies.add(this)),this._value}set value(e){if(!Object.is(this._value,e)){this._value=e;for(let e of this._subscribers)b(e)}}peek(){return this._value}_unsubscribe(e){this._subscribers.delete(e)}},c=typeof window<`u`&&window.__AETHER_HMR__?.componentStates||new Map,l=0;function u(e){let t=`s_${l++}`,n=c.get(t);return n===void 0?new s(e):new s(n)}var d=class e{constructor(t){this._fn=t,this._dependencies=new Set,this._cleanup=null,this._active=!0,this._id=e._nextId++,this.run()}run(){if(this._active){t(`effect:${this._id}`),this._cleanupDeps(),this._cleanup&&typeof this._cleanup==`function`&&this._cleanup(),a(this);try{let e=this._fn();typeof e==`function`&&(this._cleanup=e)}finally{o(),n(`effect:${this._id}`)}}}_cleanupDeps(){for(let e of this._dependencies)e._unsubscribe(this);this._dependencies.clear()}dispose(){this._active&&(t(`dispose:${this._id}`),this._active=!1,this._cleanupDeps(),this._cleanup&&typeof this._cleanup==`function`&&(this._cleanup(),this._cleanup=null),n(`dispose:${this._id}`))}};d._nextId=0;var f=d;function p(e){return new f(e)}var m=class e{constructor(t){this._fn=t,this._signal=new s(void 0),this._dependencies=new Set,this._dirty=!0,this._id=e._nextId++,this._compute()}_compute(){t(`derived:${this._id}`),this._cleanupDeps(),a(this);try{this._signal._value=this._fn(),this._dirty=!1}finally{o(),n(`derived:${this._id}`)}}run(){if(!this._dirty){this._dirty=!0;for(let e of this._signal._subscribers)b(e)}}get value(){return this._dirty&&this._compute(),r&&(this._signal._subscribers.add(r),r._dependencies.add(this._signal)),this._signal._value}_cleanupDeps(){for(let e of this._dependencies)e._unsubscribe(this);this._dependencies.clear()}dispose(){this._cleanupDeps(),this._dependencies.clear(),this._dirty=!0}};m._nextId=0;var h=m;function g(e){return new h(e)}var _=new Set,v=!1,y=0;function b(e){_.add(e),v||(v=!0,y===0&&queueMicrotask(ee))}function ee(){if(y>0)return;t(`flush`);let e=_;_=new Set,v=!1;let r=te(e);for(let e of r)e._active&&e.run();n(`flush`)}function te(e){let t=new Set,n=[];function r(e){if(!t.has(e)){t.add(e);for(let t of e._dependencies)t instanceof f&&r(t);n.push(e)}}for(let t of e)r(t);return n}function x(e){let t={},n=new Proxy({},{get(e,n){if(n===`__signals`)return t;if(t[n])return r&&(t[n]._subscribers.add(r),r._dependencies.add(t[n])),t[n]._value},set(e,n,r){if(!t[n])t[n]=new s(r);else{t[n]._value=r;for(let e of t[n]._subscribers)b(e)}return!0},has(e,n){return n in t},ownKeys(){return Object.keys(t)},getOwnPropertyDescriptor(e,n){if(n in t)return{configurable:!0,enumerable:!0,writable:!0}}});for(let[n,r]of Object.entries(e))t[n]=new s(r);return n}var S=typeof process<`u`&&!0;function C(e){S&&performance&&performance.mark(`aether:${e}:start`)}function w(e){S&&performance&&(performance.mark(`aether:${e}:end`),performance.measure(e,`aether:${e}:start`,`aether:${e}:end`))}var T=null,E=class e{constructor(){this._effects=[],this._children=[],this._disposed=!1}addEffect(e){this._effects.push(e)}addChild(e){this._children.push(e)}dispose(){if(!this._disposed){this._disposed=!0,C(`component:dispose`);for(let t of this._children)typeof t==`object`&&t&&(t instanceof e||typeof t.dispose==`function`?t.dispose():t instanceof Node&&`remove`in t&&t.remove());for(let e of this._effects)e.dispose();this._effects=[],this._children=[],w(`component:dispose`)}}};function D(e){let t=T,n=new E;T=n,t&&t.addChild(n);let r;try{r=e(n)}finally{T=t}if(typeof r==`function`){let e=r,t=n.dispose.bind(n);n.dispose=()=>{e(),t()}}return r}function O(e){return document.createElement(e)}function k(e){return document.createTextNode(String(e??``))}var A=new Set([`__proto__`,`constructor`,`prototype`,`toString`,`valueOf`,`hasOwnProperty`,`isPrototypeOf`,`propertyIsEnumerable`,`toLocaleString`]);function j(e,t,n){if(!A.has(t))if(t===`className`||t===`class`)e.className=String(n??``);else if(t.startsWith(`on`)){let r=t.slice(2).toLowerCase();typeof n==`function`&&e.addEventListener(r,n)}else if(t===`style`&&typeof n==`object`&&n){let t=n,r=Object.keys(t);for(let n of r)A.has(n)||(e.style[n]=t[n])}else typeof n==`boolean`?n?e.setAttribute(t,``):e.removeAttribute(t):e.setAttribute(t,String(n??``))}function M(e,t){C(`bindText`);let n=p(()=>{e.textContent=String(t()??``)});return T&&T.addEffect(n),w(`bindText`),n}function N(e,t,n){C(`bindAttr:${t}`);let r=p(()=>{let r=n();t===`className`||t===`class`?e.className=String(r??``):t===`style`&&typeof r==`object`&&r?Object.assign(e.style,r):typeof r==`boolean`?r?e.setAttribute(t,``):e.removeAttribute(t):e.setAttribute(t,String(r??``))});return T&&T.addEffect(r),w(`bindAttr:${t}`),r}var P=typeof window<`u`?window.__AETHER_HMR__?.instances||(window.__AETHER_HMR__=window.__AETHER_HMR__||{instances:new Map}).instances:new Map;function F(e,t,n=`default`){typeof t==`string`&&(t=document.querySelector(t)),C(`mount`);let r=P.get(n),i,a;if(r){r.context.dispose(),i=new E,T=i;try{a=e()}catch(e){return console.error(`[Aether HMR] Error re-rendering:`,e),R(e),T=null,w(`mount`),r}}else{t&&(t.innerHTML=``),i=new E,T=i;try{a=e()}catch(e){return console.error(`[Aether] Mount error:`,e),L(e),T=null,w(`mount`),{unmount:()=>{}}}}let o=Array.isArray(a)?a:[a];if(r)I(r.nodes,o);else if(t)for(let e of o)t.appendChild(e);T=null,w(`mount`);let s={context:i,nodes:o,componentFn:e,container:t,id:n,unmount(){C(`unmount`),i.dispose(),t&&(t.innerHTML=``),P.delete(n),w(`unmount`)}};return P.set(n,s),s}function I(e,t){let n=e[0]?.parentNode;if(n){for(let t of e)`remove`in t&&typeof t.remove==`function`&&t.remove();for(let e of t)n.appendChild(e)}}function L(e){let t=document.createElement(`div`);t.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: #dc3545; color: #fff; padding: 1rem;
    font-family: monospace; font-size: 14px;
  `,t.innerHTML=`
    <div style="font-weight: bold; margin-bottom: 0.5rem;">[Aether Error]</div>
    <div>${e.message||e}</div>
    ${e.stack?`<pre style="font-size: 11px; overflow: auto; max-height: 200px;">${e.stack}</pre>`:``}
  `,document.body.appendChild(t)}function R(e){let t=document.createElement(`div`);t.style.cssText=`
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: #fd7e14; color: #fff; padding: 1rem;
    font-family: monospace; font-size: 14px;
  `,t.innerHTML=`
    <div style="font-weight: bold; margin-bottom: 0.5rem;">[Aether HMR Error]</div>
    <div>Hot update failed: ${e.message||e}</div>
    <div style="margin-top: 0.5rem; font-size: 12px;">Preserving previous state...</div>
  `,document.body.appendChild(t),setTimeout(()=>t.remove(),5e3)}var z=new s(typeof window<`u`&&window?.location?.pathname||`/`),B=new s({});new s({});var V=[],H=null;typeof window<`u`&&window.addEventListener(`popstate`,()=>{z.value=window.location.pathname,U()});function U(){let e=z.value;for(let t of V){let n=W(t.path,e);if(n)return B.value=n.params,t}return H||null}function W(e,t){let n=[],r=e.replace(/:([^/]+)/g,(e,t)=>(n.push(t),`([^/]+)`)).replace(/\*/g,`.*`),i=RegExp(`^${r}$`),a=t.match(i);if(!a)return null;let o={};return n.forEach((e,t)=>{o[e]=a[t+1]||``}),{params:o}}function G(e){let t=O(`button`);j(t,`type`,e.type||`button`),e.disabled!==void 0&&N(t,`disabled`,()=>e.disabled);let n=p(()=>{let n=e.variant||`primary`,r=e.size||`md`,i=[`aether-btn`,`aether-btn--${n}`,`aether-btn--${r}`];e.disabled&&i.push(`aether-btn--disabled`),e.class&&i.push(e.class),t.className=i.join(` `)});if(t._aetherEffects=t._aetherEffects||[],t._aetherEffects.push(n),e.onClick&&j(t,`onClick`,e.onClick),e.children){let n=Array.isArray(e.children)?e.children:[e.children];for(let e of n)e instanceof Node?t.appendChild(e):(typeof e==`string`||typeof e==`number`)&&t.appendChild(document.createTextNode(String(e)))}return t}G.variants=[`primary`,`secondary`,`ghost`],G.sizes=[`sm`,`md`,`lg`];function K(e){let t=O(`input`);j(t,`type`,e.type||`text`),e.placeholder&&j(t,`placeholder`,e.placeholder),e.disabled!==void 0&&N(t,`disabled`,()=>e.disabled),e.value!==void 0&&N(t,`value`,()=>e.value);let n=p(()=>{let n=[`aether-input`];e.class&&n.push(e.class),e.disabled&&n.push(`aether-input--disabled`),t.className=n.join(` `)});return t._aetherEffects=t._aetherEffects||[],t._aetherEffects.push(n),e.onInput&&j(t,`onInput`,e.onInput),e.onChange&&j(t,`onChange`,e.onChange),t}K.types=[`text`,`number`,`password`,`email`,`tel`,`url`];function q(e){let t=O(`div`),n=p(()=>{let n=[`aether-card`];e.class&&n.push(e.class),e.hoverable&&n.push(`aether-card--hoverable`),t.className=n.join(` `)});if(t._aetherEffects=t._aetherEffects||[],t._aetherEffects.push(n),e.children){let n=Array.isArray(e.children)?e.children:[e.children];for(let e of n)e instanceof Node?t.appendChild(e):(typeof e==`string`||typeof e==`number`)&&t.appendChild(document.createTextNode(String(e)))}return t}function J(e){let t=O(`div`);if(t.className=`aether-card-header`,e.title){let n=O(`h3`);n.className=`aether-card-title`,n.textContent=e.title,t.appendChild(n)}if(e.subtitle){let n=O(`p`);n.className=`aether-card-subtitle`,n.textContent=e.subtitle,t.appendChild(n)}if(e.children){let n=Array.isArray(e.children)?e.children:[e.children];for(let e of n)e instanceof Node?t.appendChild(e):(typeof e==`string`||typeof e==`number`)&&t.appendChild(document.createTextNode(String(e)))}return t}function Y(e){let t=O(`div`);if(t.className=`aether-card-body`,e.children){let n=Array.isArray(e.children)?e.children:[e.children];for(let e of n)e instanceof Node?t.appendChild(e):(typeof e==`string`||typeof e==`number`)&&t.appendChild(document.createTextNode(String(e)))}return t}function X(e){let t=O(`div`);if(t.className=`aether-card-footer`,e.children){let n=Array.isArray(e.children)?e.children:[e.children];for(let e of n)e instanceof Node?t.appendChild(e):(typeof e==`string`||typeof e==`number`)&&t.appendChild(document.createTextNode(String(e)))}return t}function Z(e){let t=O(`form`),n={},r={},i=p(()=>{let n=[`aether-form`];e.class&&n.push(e.class),t.className=n.join(` `)});if(t._aetherEffects=t._aetherEffects||[],t._aetherEffects.push(i),j(t,`onSubmit`,t=>{if(t.preventDefault(),e.onSubmit){let t={};for(let[e,i]of Object.entries(n))t[e]=r[e]||null;e.onSubmit({...n},t)}}),e.children){let n=Array.isArray(e.children)?e.children:[e.children];for(let e of n)e instanceof Node?t.appendChild(e):(typeof e==`string`||typeof e==`number`)&&t.appendChild(document.createTextNode(String(e)))}return t}function ne(e){let t=O(`div`),n=null;e.label&&(n=O(`label`),n.className=`aether-form-field-label`,n.textContent=e.label,t.appendChild(n));let r=O(`span`);r.className=`aether-form-field-error`,r.style.display=`none`;let i=p(()=>{let n=[`aether-form-field`];e.class&&n.push(e.class),t.className=n.join(` `)});if(t._aetherEffects=t._aetherEffects||[],t._aetherEffects.push(i),e.children){let n=Array.isArray(e.children)?e.children:[e.children];for(let i of n)if(i instanceof Node){if(t.appendChild(i),i instanceof HTMLInputElement||i instanceof HTMLTextAreaElement||i instanceof HTMLSelectElement){j(i,`name`,e.name);let n=n=>{let i=n.target.value;if(t._formValue=i,e.rules&&e.rules.length>0){let n=null;for(let t of e.rules){let e=t(i);if(e!==null){n=e;break}}n?(r.textContent=n,r.style.display=`block`,t._formError=n):(r.textContent=``,r.style.display=`none`,t._formError=null)}};i.addEventListener(`input`,n),i.addEventListener(`change`,n)}}else (typeof i==`string`||typeof i==`number`)&&t.appendChild(document.createTextNode(String(i)))}return t.appendChild(r),t}Z.Field=ne;function Q(e){let t=O(`div`),n=p(()=>{let n=[`aether-modal`];e.class&&n.push(e.class),t.className=n.join(` `),e.open?(t.style.display=`flex`,t.setAttribute(`aria-modal`,`true`)):(t.style.display=`none`,t.removeAttribute(`aria-modal`))});if(t._aetherEffects=t._aetherEffects||[],t._aetherEffects.push(n),t.addEventListener(`click`,n=>{n.target===t&&e.onClose&&e.onClose()}),document.addEventListener(`keydown`,t=>{t.key===`Escape`&&e.open&&e.onClose&&e.onClose()}),e.children){let n=Array.isArray(e.children)?e.children:[e.children];for(let e of n)e instanceof Node?t.appendChild(e):(typeof e==`string`||typeof e==`number`)&&t.appendChild(document.createTextNode(String(e)))}return t}function re(e){let t=O(`h2`);if(t.className=`aether-modal-title`,e.class&&t.classList.add(e.class),e.children){let n=Array.isArray(e.children)?e.children:[e.children];for(let e of n)e instanceof Node?t.appendChild(e):(typeof e==`string`||typeof e==`number`)&&t.appendChild(document.createTextNode(String(e)))}return t}function ie(e){let t=O(`div`);if(t.className=`aether-modal-body`,e.class&&t.classList.add(e.class),e.children){let n=Array.isArray(e.children)?e.children:[e.children];for(let e of n)e instanceof Node?t.appendChild(e):(typeof e==`string`||typeof e==`number`)&&t.appendChild(document.createTextNode(String(e)))}return t}function ae(e){let t=O(`div`);if(t.className=`aether-modal-footer`,e.class&&t.classList.add(e.class),e.children){let n=Array.isArray(e.children)?e.children:[e.children];for(let e of n)e instanceof Node?t.appendChild(e):(typeof e==`string`||typeof e==`number`)&&t.appendChild(document.createTextNode(String(e)))}return t}Q.Title=re,Q.Body=ie,Q.Footer=ae;function $(e){let t=O(`th`);return t.className=`aether-table-column`,e.class&&t.classList.add(e.class),e.header&&(t.textContent=e.header),e.sortable&&t.classList.add(`aether-table-column--sortable`),t}function oe(e){let t=O(`table`);t.className=`aether-table`;let n={key:null,direction:`asc`},r=O(`thead`);r.className=`aether-table-thead`;let i=O(`tr`);i.className=`aether-table-header-row`,r.appendChild(i);let a=O(`tbody`);a.className=`aether-table-tbody`;let o=O(`tfoot`);o.className=`aether-table-tfoot`;let s=O(`tr`),c=O(`td`);c.className=`aether-table-footer-cell`,o.appendChild(s),s.appendChild(c),t.appendChild(r),t.appendChild(a),t.appendChild(o);let l=[];if(e.children){let t=Array.isArray(e.children)?e.children:[e.children];for(let e of t)if(e instanceof HTMLTableCellElement&&e.classList.contains(`aether-table-column`)){let t={key:e._columnKey||``,header:e.textContent||void 0,sortable:e.classList.contains(`aether-table-column--sortable`)};l.push(t),i.appendChild(e)}}let u=()=>{a.innerHTML=``;let t=e.data||[];n.key&&e.sortable&&(t=[...t].sort((e,t)=>{let r=e[n.key],i=t[n.key],a=n.direction===`asc`?1:-1;return r===i?0:r==null?a:i==null||r<i?-a:a}));let r=t;if(e.paginate&&e.paginate>0){let n=0*e.paginate,i=n+e.paginate;r=t.slice(n,i);let a=Math.ceil(t.length/e.paginate);c.setAttribute(`colspan`,String(l.length||1)),c.textContent=`Page 1 of ${a} (${t.length} total)`}else c.textContent=`${t.length} items`;for(let e of r){let t=O(`tr`);t.className=`aether-table-row`;for(let n of l){let r=O(`td`);if(r.className=`aether-table-cell`,n.children&&typeof n.children==`function`){let t=n.children(e);t instanceof Node?r.appendChild(t):(typeof t==`string`||typeof t==`number`)&&(r.textContent=String(t))}else{let t=e[n.key];r.textContent=t==null?``:String(t)}t.appendChild(r)}a.appendChild(t)}};i.addEventListener(`click`,t=>{let r=t.target;if(r.classList.contains(`aether-table-column--sortable`)){let t=r._columnKey;t&&(n.key===t?n.direction=n.direction===`asc`?`desc`:`asc`:(n.key=t,n.direction=`asc`),e.onSort&&e.onSort(t,n.direction),u())}}),u();let d=p(()=>{e.data,u()});return t._aetherEffects=t._aetherEffects||[],t._aetherEffects.push(d),e.class&&t.classList.add(e.class),t}oe.Column=$;function se(e){let t=O(`div`),n=O(`div`);n.className=`aether-tabs-list`,n.setAttribute(`role`,`tablist`);let r=O(`div`);r.className=`aether-tabs-panels`;let i=[],a=p(()=>{let n=[`aether-tabs`];e.class&&n.push(e.class),t.className=n.join(` `)});if(t._aetherEffects=t._aetherEffects||[],t._aetherEffects.push(a),e.children){let t=Array.isArray(e.children)?e.children:[e.children];for(let e of t)e instanceof Node?r.appendChild(e):(typeof e==`string`||typeof e==`number`)&&r.appendChild(document.createTextNode(String(e)))}return t.appendChild(n),t.appendChild(r),t._tabList=n,t._panelsContainer=r,t._panels=i,t}function ce(e){let t=O(`div`);if(t.className=`aether-tabs-panel`,t.setAttribute(`role`,`tabpanel`),t.setAttribute(`aria-label`,e.title),t.style.display=`none`,t._panelTitle=e.title,e.class&&t.classList.add(e.class),e.children){let n=Array.isArray(e.children)?e.children:[e.children];for(let e of n)e instanceof Node?t.appendChild(e):(typeof e==`string`||typeof e==`number`)&&t.appendChild(document.createTextNode(String(e)))}return t}se.Panel=ce;var le=x({theme:`dark`,user:`Developer`});function ue(){let e=u(0),t=g(()=>e.value*2);return p(()=>{document.title=`Count: ${e.value} | Aether`}),(()=>{let e=`ae-te1ux`;if(!document.querySelector(`style[data-aether="ae-te1ux"]`)){let t=document.createElement(`style`);t.setAttribute(`data-aether`,e),t.textContent=`
    /* === CSS Variables === */
    :root {
      --color-bg: #f5f0e8;
      --color-bg-warm: #ebe4d8;
      --color-ink: #1a1612;
      --color-ink-light: #4a453d;
      --color-accent: #c45d35;
      --color-accent-warm: #e8845f;
      --color-accent-muted: #d4a574;
      --color-cream: #faf7f2;
      --color-border: #d4cfc4;
      --font-display: 'Playfair Display', Georgia, serif;
      --font-sans: 'DM Sans', -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    /* === Reset & Base === */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .app {
      min-height: 100vh;
      background: var(--color-bg);
      color: var(--color-ink);
      font-family: var(--font-sans);
      position: relative;
      overflow-x: hidden;
    }

    /* === Film Grain Overlay === */
    .app::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      opacity: 0.03;
      pointer-events: none;
      z-index: 1000;
    }

    /* === Navigation === */
    .nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 3rem;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-cream);
    }

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 1rem;
      text-decoration: none;
      color: var(--color-ink);
    }

    .nav-logo-mark {
      width: 48px;
      height: 48px;
      background: var(--color-ink);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 1.5rem;
      color: var(--color-bg);
      transform: rotate(-3deg);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .nav-logo:hover .nav-logo-mark {
      transform: rotate(0deg) scale(1.05);
    }

    .nav-logo-text {
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .nav-links {
      display: flex;
      gap: 2.5rem;
    }

    .nav-link {
      color: var(--color-ink-light);
      text-decoration: none;
      font-size: 0.9375rem;
      font-weight: 500;
      transition: color 0.2s;
      position: relative;
    }

    .nav-link::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 0;
      height: 2px;
      background: var(--color-accent);
      transition: width 0.3s ease;
    }

    .nav-link:hover {
      color: var(--color-ink);
    }

    .nav-link:hover::after {
      width: 100%;
    }

    .nav-badge {
      background: var(--color-accent);
      padding: 0.375rem 0.875rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      letter-spacing: 0.02em;
    }

    /* === Main Container === */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 3rem 6rem;
    }

    /* === Hero Section === */
    .hero {
      padding: 6rem 0 5rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }

    .hero-content {
      max-width: 540px;
    }

    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-accent);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 1.5rem;
    }

    .hero-eyebrow-line {
      width: 32px;
      height: 2px;
      background: var(--color-accent);
    }

    .hero h1 {
      font-family: var(--font-display);
      font-size: clamp(3rem, 6vw, 4.5rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.05;
      margin-bottom: 1.75rem;
      color: var(--color-ink);
    }

    .hero h1 span {
      color: var(--color-accent);
      font-style: italic;
    }

    .hero-subtitle {
      font-size: 1.1875rem;
      color: var(--color-ink-light);
      max-width: 480px;
      line-height: 1.65;
      margin-bottom: 2.5rem;
    }

    .hero-cta {
      display: flex;
      gap: 1rem;
    }

    /* === Counter Display === */
    .hero-visual {
      position: relative;
    }

    .counter-display {
      background: var(--color-cream);
      border: 1px solid var(--color-border);
      border-radius: 24px;
      padding: 3.5rem;
      position: relative;
      box-shadow:
        8px 8px 0 var(--color-border),
        16px 16px 0 rgba(196, 93, 53, 0.1);
    }

    .counter-display::before {
      content: 'COUNTER';
      position: absolute;
      top: -12px;
      left: 32px;
      background: var(--color-bg);
      padding: 0 12px;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: var(--color-ink-light);
    }

    .counter-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-ink-light);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.75rem;
    }

    .count {
      font-family: var(--font-display);
      font-size: clamp(6rem, 12vw, 9rem);
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 0.9;
      color: var(--color-ink);
      position: relative;
      display: inline-block;
    }

    .count::after {
      content: '';
      position: absolute;
      bottom: 0.1em;
      left: 0;
      right: 0;
      height: 0.08em;
      background: var(--color-accent);
      transform: scaleX(0);
      transform-origin: left;
      animation: underline-in 0.6s ease forwards;
      animation-delay: 0.3s;
    }

    @keyframes underline-in {
      to { transform: scaleX(1); }
    }

    .derived {
      font-size: 1.0625rem;
      color: var(--color-accent-warm);
      margin-top: 1.25rem;
      font-weight: 500;
      font-family: var(--font-mono);
    }

    .derived span {
      color: var(--color-ink-light);
    }

    .counter-controls {
      display: flex;
      gap: 0.875rem;
      justify-content: center;
      margin-top: 2.5rem;
    }

    /* === Decorative Elements === */
    .hero-decoration {
      position: absolute;
      right: -60px;
      top: 50%;
      transform: translateY(-50%);
      width: 200px;
      height: 200px;
      opacity: 0.15;
    }

    .hero-decoration circle {
      fill: none;
      stroke: var(--color-accent);
      stroke-width: 1;
    }

    /* === Features Grid === */
    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      margin-bottom: 5rem;
    }

    .feature-card {
      background: var(--color-cream);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      padding: 2.25rem;
      position: relative;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .feature-card:nth-child(2) {
      transform: translateY(1.5rem);
    }

    .feature-card:hover {
      transform: translateY(-0.5rem);
      box-shadow:
        0 20px 40px rgba(26, 22, 18, 0.08),
        0 0 0 1px var(--color-accent);
    }

    .feature-card:nth-child(2):hover {
      transform: translateY(1rem);
    }

    .feature-number {
      font-family: var(--font-display);
      font-size: 3.5rem;
      font-weight: 700;
      color: var(--color-border);
      position: absolute;
      top: 1rem;
      right: 1.5rem;
      line-height: 1;
    }

    .feature-icon {
      width: 56px;
      height: 56px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
      transition: all 0.3s ease;
    }

    .feature-card:hover .feature-icon {
      background: var(--color-accent);
      border-color: var(--color-accent);
      transform: rotate(-5deg) scale(1.05);
    }

    .feature-card h3 {
      font-family: var(--font-display);
      font-size: 1.375rem;
      font-weight: 700;
      margin-bottom: 0.625rem;
      color: var(--color-ink);
    }

    .feature-card p {
      font-size: 0.9375rem;
      color: var(--color-ink-light);
      line-height: 1.6;
    }

    /* === Components Section === */
    .section {
      margin-bottom: 5rem;
    }

    .section-header {
      margin-bottom: 3rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid var(--color-ink);
    }

    .section-title {
      font-family: var(--font-display);
      font-size: 2.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }

    .section-subtitle {
      font-size: 1rem;
      color: var(--color-ink-light);
    }

    /* === Button Showcase === */
    .button-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .button-card {
      background: var(--color-cream);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      padding: 2rem;
    }

    .button-card-title {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--color-accent);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px dashed var(--color-border);
    }

    .button-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .button-row:last-child {
      margin-bottom: 0;
    }

    /* === Input Demo === */
    .input-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .input-card {
      background: var(--color-cream);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      padding: 1.75rem;
    }

    .input-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-ink-light);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.75rem;
    }

    /* === Aether Input Styles === */
    .aether-input {
      width: 100%;
      padding: 1rem 1.125rem;
      background: var(--color-bg);
      border: 2px solid transparent;
      border-radius: 12px;
      color: var(--color-ink);
      font-size: 0.9375rem;
      font-family: inherit;
      transition: all 0.25s ease;
    }

    .aether-input::placeholder {
      color: var(--color-ink-light);
      opacity: 0.6;
    }

    .aether-input:focus {
      outline: none;
      border-color: var(--color-accent);
      background: var(--color-cream);
      box-shadow: 4px 4px 0 var(--color-accent-muted);
    }

    .aether-input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: var(--color-border);
    }

    /* === Card Styles === */
    .aether-card {
      background: var(--color-cream);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      overflow: hidden;
    }

    .aether-card-header {
      padding: 1.75rem 2rem;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-warm);
    }

    .aether-card-title {
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-ink);
      margin: 0;
    }

    .aether-card-subtitle {
      font-size: 0.875rem;
      color: var(--color-ink-light);
      margin: 0.25rem 0 0;
    }

    .aether-card-body {
      padding: 2rem;
    }

    .aether-card-footer {
      padding: 1.5rem 2rem;
      border-top: 1px solid var(--color-border);
      display: flex;
      gap: 0.875rem;
      background: var(--color-bg);
    }

    /* === Button Styles Override === */
    .aether-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border: 2px solid transparent;
      border-radius: 10px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: inherit;
    }

    .aether-btn--primary {
      background: var(--color-accent);
      color: white;
      border-color: var(--color-accent);
      box-shadow: 4px 4px 0 var(--color-accent-muted);
    }

    .aether-btn--primary:hover:not(:disabled) {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0 var(--color-accent-muted);
    }

    .aether-btn--primary:active:not(:disabled) {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 var(--color-accent-muted);
    }

    .aether-btn--secondary {
      background: var(--color-cream);
      color: var(--color-ink);
      border-color: var(--color-ink);
    }

    .aether-btn--secondary:hover:not(:disabled) {
      background: var(--color-ink);
      color: var(--color-cream);
      transform: translate(-2px, -2px);
      box-shadow: 4px 4px 0 var(--color-border);
    }

    .aether-btn--ghost {
      background: transparent;
      color: var(--color-ink-light);
      border-color: transparent;
    }

    .aether-btn--ghost:hover:not(:disabled) {
      color: var(--color-ink);
      background: rgba(26, 22, 18, 0.05);
    }

    .aether-btn--sm {
      padding: 0.625rem 1.125rem;
      font-size: 0.875rem;
      border-radius: 8px;
    }

    .aether-btn--lg {
      padding: 1.125rem 2rem;
      font-size: 1rem;
      border-radius: 12px;
    }

    .aether-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none !important;
    }

    /* === Footer === */
    .footer {
      background: var(--color-ink);
      padding: 3.5rem;
      margin-top: 4rem;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .footer-text {
      font-size: 0.9375rem;
      color: var(--color-cream);
      opacity: 0.7;
    }

    .footer-text span {
      color: var(--color-accent-warm);
      font-weight: 600;
    }

    .footer-links {
      display: flex;
      gap: 2.5rem;
    }

    .footer-link {
      font-size: 0.9375rem;
      color: var(--color-cream);
      opacity: 0.7;
      text-decoration: none;
      transition: all 0.2s;
    }

    .footer-link:hover {
      opacity: 1;
      color: var(--color-accent-warm);
    }

    /* === Responsive === */
    @media (max-width: 900px) {
      .hero {
        grid-template-columns: 1fr;
        gap: 3rem;
        padding: 4rem 0 3rem;
      }

      .hero-visual {
        order: -1;
      }

      .features {
        grid-template-columns: 1fr;
      }

      .feature-card:nth-child(2) {
        transform: none;
      }

      .button-grid {
        grid-template-columns: 1fr;
      }

      .input-grid {
        grid-template-columns: 1fr;
      }

      .nav {
        padding: 1.25rem 1.5rem;
      }

      .nav-links {
        display: none;
      }

      .container {
        padding: 0 1.5rem 4rem;
      }
    }
  `,document.head.appendChild(t)}return{scope:e}})(),(()=>{let n=O(`div`);return j(n,`class`,`app`),n.appendChild((()=>{let e=O(`nav`);return j(e,`class`,`nav`),e.appendChild((()=>{let e=O(`a`);return j(e,`href`,`#`),j(e,`class`,`nav-logo`),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`nav-logo-mark`),e.appendChild(k(`Æ`)),e})()),e.appendChild((()=>{let e=O(`span`);return j(e,`class`,`nav-logo-text`),e.appendChild(k(`Aether`)),e})()),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`nav-right`),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`nav-links`),e.appendChild((()=>{let e=O(`a`);return j(e,`href`,`#`),j(e,`class`,`nav-link`),e.appendChild(k(`Docs`)),e})()),e.appendChild((()=>{let e=O(`a`);return j(e,`href`,`#`),j(e,`class`,`nav-link`),e.appendChild(k(`Examples`)),e})()),e.appendChild((()=>{let e=O(`a`);return j(e,`href`,`#`),j(e,`class`,`nav-link`),e.appendChild(k(`GitHub`)),e})()),e})()),e.appendChild((()=>{let e=O(`span`);return j(e,`class`,`nav-badge`),e.appendChild(k(`v0.2`)),e})()),e})()),e})()),n.appendChild((()=>{let n=O(`div`);return j(n,`class`,`container`),n.appendChild((()=>{let n=O(`section`);return j(n,`class`,`hero`),n.appendChild((()=>{let e=O(`div`);return j(e,`class`,`hero-content`),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`hero-eyebrow`),e.appendChild((()=>{let e=O(`span`);return j(e,`class`,`hero-eyebrow-line`),e})()),e.appendChild(k(` Compile-time Reactive `)),e})()),e.appendChild((()=>{let e=O(`h1`);return e.appendChild(k(`Build faster with `)),e.appendChild((()=>{let e=O(`span`);return e.appendChild(k(`Aether`)),e})()),e})()),e.appendChild((()=>{let e=O(`p`);return j(e,`class`,`hero-subtitle`),e.appendChild(k(` 100% TypeScript. No virtual DOM. No hooks rules. Just pure reactive magic that compiles to vanilla JavaScript. `)),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`hero-cta`),e.appendChild(D(()=>G({variant:`primary`,size:`lg`,children:`Get Started`}))),e.appendChild(D(()=>G({variant:`secondary`,size:`lg`,children:`View Examples`}))),e})()),e})()),n.appendChild((()=>{let n=O(`div`);return j(n,`class`,`hero-visual`),n.appendChild((()=>{let n=O(`div`);return j(n,`class`,`counter-display`),n.appendChild((()=>{let e=O(`p`);return j(e,`class`,`counter-label`),e.appendChild(k(`Current Count`)),e})()),n.appendChild((()=>{let t=O(`p`);j(t,`class`,`count`);let n=k(``);return M(n,()=>e.value),t.appendChild(n),t})()),n.appendChild((()=>{let e=O(`p`);j(e,`class`,`derived`),e.appendChild((()=>{let e=O(`span`);return e.appendChild(k(`double =`)),e})());let n=k(``);return M(n,()=>t.value),e.appendChild(n),e})()),n.appendChild((()=>{let t=O(`div`);return j(t,`class`,`counter-controls`),t.appendChild(D(()=>G({variant:`secondary`,size:`sm`,onClick:()=>e.value--,children:`−`}))),t.appendChild(D(()=>G({variant:`ghost`,onClick:()=>e.value=0,children:`Reset`}))),t.appendChild(D(()=>G({variant:`primary`,size:`sm`,onClick:()=>e.value++,children:`+`}))),t})()),n})()),n})()),n})()),n.appendChild((()=>{let e=O(`div`);return j(e,`class`,`features`),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`feature-card`),e.appendChild((()=>{let e=O(`span`);return j(e,`class`,`feature-number`),e.appendChild(k(`01`)),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`feature-icon`),e.appendChild(k(`⚡`)),e})()),e.appendChild((()=>{let e=O(`h3`);return e.appendChild(k(`Lightning Fast`)),e})()),e.appendChild((()=>{let e=O(`p`);return e.appendChild(k(`No virtual DOM diffing. Direct DOM operations with compile-time optimizations.`)),e})()),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`feature-card`),e.appendChild((()=>{let e=O(`span`);return j(e,`class`,`feature-number`),e.appendChild(k(`02`)),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`feature-icon`),e.appendChild(k(`🎯`)),e})()),e.appendChild((()=>{let e=O(`h3`);return e.appendChild(k(`Type Safe`)),e})()),e.appendChild((()=>{let e=O(`p`);return e.appendChild(k(`100% TypeScript throughout. Full IDE support with zero runtime overhead.`)),e})()),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`feature-card`),e.appendChild((()=>{let e=O(`span`);return j(e,`class`,`feature-number`),e.appendChild(k(`03`)),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`feature-icon`),e.appendChild(k(`✨`)),e})()),e.appendChild((()=>{let e=O(`h3`);return e.appendChild(k(`Magic Macros`)),e})()),e.appendChild((()=>{let e=O(`p`);return e.appendChild(k(`$state, $derived, $effect. Write reactive code that looks like regular code.`)),e})()),e})()),e})()),n.appendChild((()=>{let e=O(`section`);return j(e,`class`,`section`),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`section-header`),e.appendChild((()=>{let e=O(`h2`);return j(e,`class`,`section-title`),e.appendChild(k(`Button Component`)),e})()),e.appendChild((()=>{let e=O(`p`);return j(e,`class`,`section-subtitle`),e.appendChild(k(`Multiple variants for every use case`)),e})()),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`button-grid`),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`button-card`),e.appendChild((()=>{let e=O(`p`);return j(e,`class`,`button-card-title`),e.appendChild(k(`Primary`)),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`button-row`),e.appendChild(D(()=>G({variant:`primary`,children:`Primary`}))),e.appendChild(D(()=>G({variant:`primary`,size:`sm`,children:`Small`}))),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`button-row`),e.appendChild(D(()=>G({variant:`primary`,disabled:!0,children:`Disabled`}))),e})()),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`button-card`),e.appendChild((()=>{let e=O(`p`);return j(e,`class`,`button-card-title`),e.appendChild(k(`Secondary`)),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`button-row`),e.appendChild(D(()=>G({variant:`secondary`,children:`Secondary`}))),e.appendChild(D(()=>G({variant:`secondary`,size:`sm`,children:`Small`}))),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`button-row`),e.appendChild(D(()=>G({variant:`secondary`,disabled:!0,children:`Disabled`}))),e})()),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`button-card`),e.appendChild((()=>{let e=O(`p`);return j(e,`class`,`button-card-title`),e.appendChild(k(`Ghost`)),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`button-row`),e.appendChild(D(()=>G({variant:`ghost`,children:`Ghost`}))),e.appendChild(D(()=>G({variant:`ghost`,size:`sm`,children:`Small`}))),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`button-row`),e.appendChild(D(()=>G({variant:`ghost`,disabled:!0,children:`Disabled`}))),e})()),e})()),e})()),e})()),n.appendChild((()=>{let e=O(`section`);return j(e,`class`,`section`),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`section-header`),e.appendChild((()=>{let e=O(`h2`);return j(e,`class`,`section-title`),e.appendChild(k(`Input Component`)),e})()),e.appendChild((()=>{let e=O(`p`);return j(e,`class`,`section-subtitle`),e.appendChild(k(`Clean, minimal inputs with focus states`)),e})()),e})()),e.appendChild(D(()=>q({children:[D(()=>J({title:`Contact Form`,subtitle:`Example of controlled inputs`})),D(()=>Y({children:(()=>{let e=O(`div`);return j(e,`class`,`input-grid`),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`input-card`),e.appendChild((()=>{let e=O(`label`);return j(e,`class`,`input-label`),e.appendChild(k(`Full Name`)),e})()),e.appendChild(D(()=>K({type:`text`,placeholder:`John Doe`}))),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`input-card`),e.appendChild((()=>{let e=O(`label`);return j(e,`class`,`input-label`),e.appendChild(k(`Email`)),e})()),e.appendChild(D(()=>K({type:`text`,placeholder:`john@example.com`}))),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`input-card`),e.appendChild((()=>{let e=O(`label`);return j(e,`class`,`input-label`),e.appendChild(k(`Age`)),e})()),e.appendChild(D(()=>K({type:`number`,placeholder:`25`}))),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`input-card`),e.appendChild((()=>{let e=O(`label`);return j(e,`class`,`input-label`),e.appendChild(k(`Password`)),e})()),e.appendChild(D(()=>K({type:`password`,placeholder:`••••••••`}))),e})()),e})()})),D(()=>X({children:[D(()=>G({variant:`primary`,size:`sm`,children:`Submit`})),D(()=>G({variant:`ghost`,size:`sm`,children:`Cancel`}))]}))]}))),e})()),n})()),n.appendChild((()=>{let e=O(`footer`);return j(e,`class`,`footer`),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`footer-content`),e.appendChild((()=>{let e=O(`p`);j(e,`class`,`footer-text`),e.appendChild(k(`Built with `)),e.appendChild((()=>{let e=O(`span`);return e.appendChild(k(`Aether`)),e})()),e.appendChild(k(` • `));let t=k(``);return M(t,()=>le.user),e.appendChild(t),e})()),e.appendChild((()=>{let e=O(`div`);return j(e,`class`,`footer-links`),e.appendChild((()=>{let e=O(`a`);return j(e,`href`,`#`),j(e,`class`,`footer-link`),e.appendChild(k(`Documentation`)),e})()),e.appendChild((()=>{let e=O(`a`);return j(e,`href`,`#`),j(e,`class`,`footer-link`),e.appendChild(k(`API Reference`)),e})()),e.appendChild((()=>{let e=O(`a`);return j(e,`href`,`#`),j(e,`class`,`footer-link`),e.appendChild(k(`GitHub`)),e})()),e})()),e})()),e})()),n})()}F(ue,`#app`);