// Aether Card Component
// Basic card container with optional header, body, and footer sections

import { __createElement, __setAttr, __bindAttr } from '../dom.ts';
import { __effect, Effect } from '../signal.ts';

interface CardProps {
  class?: string;
  hoverable?: boolean;
  children?: unknown;
}

interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  class?: string;
  children?: unknown;
}

interface CardBodyProps {
  class?: string;
  children?: unknown;
}

interface CardFooterProps {
  class?: string;
  children?: unknown;
}

export function Card(props: CardProps): HTMLDivElement {
  const el = __createElement('div');

  // Build class string
  const classEffect = __effect(() => {
    const classes = ['aether-card'];
    if (props.class) {
      classes.push(props.class);
    }
    if (props.hoverable) {
      classes.push('aether-card--hoverable');
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
        el.appendChild(child);
      } else if (typeof child === 'string' || typeof child === 'number') {
        el.appendChild(document.createTextNode(String(child)));
      }
    }
  }

  return el;
}

// Card.Header sub-component
export function CardHeader(props: CardHeaderProps): HTMLDivElement {
  const el = __createElement('div');
  el.className = 'aether-card-header';

  if (props.title) {
    const titleEl = __createElement('h3');
    titleEl.className = 'aether-card-title';
    titleEl.textContent = props.title;
    el.appendChild(titleEl);
  }

  if (props.subtitle) {
    const subtitleEl = __createElement('p');
    subtitleEl.className = 'aether-card-subtitle';
    subtitleEl.textContent = props.subtitle;
    el.appendChild(subtitleEl);
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

// Card.Body sub-component
export function CardBody(props: CardBodyProps): HTMLDivElement {
  const el = __createElement('div');
  el.className = 'aether-card-body';

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

// Card.Footer sub-component
export function CardFooter(props: CardFooterProps): HTMLDivElement {
  const el = __createElement('div');
  el.className = 'aether-card-footer';

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
