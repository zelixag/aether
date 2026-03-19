// Aether Button Component
// Supports variants: primary | secondary | ghost
// Supports sizes: sm | md | lg
// Supports disabled state

import { __createElement, __setAttr, __bindAttr } from '../dom.ts';
import { __effect, Effect } from '../signal.ts';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  class?: string;
  onClick?: (e: MouseEvent) => void;
  children?: unknown;
}

export function Button(props: ButtonProps): HTMLButtonElement {
  const el = __createElement('button');

  // Set base attributes
  __setAttr(el, 'type', props.type || 'button');

  // Bind disabled state
  if (props.disabled !== undefined) {
    __bindAttr(el, 'disabled', () => props.disabled);
  }

  // Build class string based on variant and size
  const classEffect = __effect(() => {
    const variant = props.variant || 'primary';
    const size = props.size || 'md';

    const classes = ['aether-btn', `aether-btn--${variant}`, `aether-btn--${size}`];
    if (props.disabled) {
      classes.push('aether-btn--disabled');
    }
    if (props.class) {
      classes.push(props.class);
    }

    el.className = classes.join(' ');
  });

  // Store effect for cleanup
  (el as HTMLButtonElement & { _aetherEffects?: Effect[] })._aetherEffects = (el as HTMLButtonElement & { _aetherEffects?: Effect[] })._aetherEffects || [];
  (el as HTMLButtonElement & { _aetherEffects?: Effect[] })._aetherEffects!.push(classEffect);

  // Set click handler if provided
  if (props.onClick) {
    __setAttr(el, 'onClick', props.onClick);
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

// Export button variants as constant for type hints
Button.variants = ['primary', 'secondary', 'ghost'] as const;
Button.sizes = ['sm', 'md', 'lg'] as const;
