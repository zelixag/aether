// Aether Tabs Component
// Tabbed interface with panel content

import { __createElement, __setAttr, __bindAttr } from '../dom.ts';
import { __effect, Effect } from '../signal.ts';

interface TabsProps {
  class?: string;
  children?: unknown;
}

interface TabPanelProps {
  title: string;
  class?: string;
  children?: unknown;
}

interface TabsState {
  activeIndex: number;
}

// Create the main Tabs component
export function Tabs(props: TabsProps): HTMLDivElement {
  const el = __createElement('div');

  // Internal state - track active panel index
  let activeIndex = 0;

  // Create tabs container
  const tabList = __createElement('div');
  tabList.className = 'aether-tabs-list';
  tabList.setAttribute('role', 'tablist');

  // Create panels container
  const panelsContainer = __createElement('div');
  panelsContainer.className = 'aether-tabs-panels';

  // Track panels
  const panels: { button: HTMLButtonElement; panel: HTMLDivElement; panelProps: TabPanelProps }[] = [];

  // Build class string
  const classEffect = __effect(() => {
    const classes = ['aether-tabs'];
    if (props.class) {
      classes.push(props.class);
    }
    el.className = classes.join(' ');
  });

  // Store effect for cleanup
  (el as HTMLDivElement & { _aetherEffects?: Effect[] })._aetherEffects = (el as HTMLDivElement & { _aetherEffects?: Effect[] })._aetherEffects || [];
  (el as HTMLDivElement & { _aetherEffects?: Effect[] })._aetherEffects!.push(classEffect);

  // Handle children
  if (props.children) {
    const children = Array.isArray(props.children) ? props.children : [props.children];
    for (const child of children) {
      if (child instanceof Node) {
        panelsContainer.appendChild(child);
      } else if (typeof child === 'string' || typeof child === 'number') {
        panelsContainer.appendChild(document.createTextNode(String(child)));
      }
    }
  }

  el.appendChild(tabList);
  el.appendChild(panelsContainer);

  // Store reference to elements
  (el as HTMLDivElement & { _tabList?: HTMLDivElement })._tabList = tabList;
  (el as HTMLDivElement & { _panelsContainer?: HTMLDivElement })._panelsContainer = panelsContainer;
  (el as HTMLDivElement & { _panels?: typeof panels })._panels = panels;

  return el;
}

// Tabs.Panel sub-component
export function TabsPanel(props: TabPanelProps): HTMLDivElement {
  const el = __createElement('div');
  el.className = 'aether-tabs-panel';
  el.setAttribute('role', 'tabpanel');
  el.setAttribute('aria-label', props.title);

  // Hide by default (parent Tabs will control visibility)
  el.style.display = 'none';

  // Store title for tab button
  (el as HTMLDivElement & { _panelTitle?: string })._panelTitle = props.title;

  if (props.class) {
    el.classList.add(props.class);
  }

  // Handle children
  if (props.children) {
    const children = Array.isArray(props.children) ? props.children : [props.children];
    for (const child of children) {
      if (child instanceof Node) {
        el.appendChild(child);
      } else if (typeof child === 'string' || typeof child === 'number') {
        el.appendChild(document.createTextNode(String(child)));
      }
    }
  }

  return el;
}

// Attach Panel to Tabs
(Tabs as typeof Tabs & { Panel: typeof TabsPanel }).Panel = TabsPanel;
