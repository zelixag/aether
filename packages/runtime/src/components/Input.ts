// Aether Input Component
// Supports types: text | number | password
// Supports placeholder
// Supports disabled state

import { __createElement, __setAttr, __bindAttr } from '../dom.ts';
import { __effect, Effect } from '../signal.ts';

interface InputProps {
  type?: 'text' | 'number' | 'password' | 'email' | 'tel' | 'url';
  placeholder?: string;
  disabled?: boolean;
  value?: unknown;
  class?: string;
  onInput?: (e: Event) => void;
  onChange?: (e: Event) => void;
}

export function Input(props: InputProps): HTMLInputElement {
  const el = __createElement('input');

  // Set element type
  const inputType = props.type || 'text';
  __setAttr(el, 'type', inputType);

  // Set placeholder if provided
  if (props.placeholder) {
    __setAttr(el, 'placeholder', props.placeholder);
  }

  // Bind disabled state
  if (props.disabled !== undefined) {
    __bindAttr(el, 'disabled', () => props.disabled);
  }

  // Bind value for controlled inputs
  if (props.value !== undefined) {
    __bindAttr(el, 'value', () => props.value);
  }

  // Build class string
  const classEffect = __effect(() => {
    const classes = ['aether-input'];
    if (props.class) {
      classes.push(props.class);
    }
    if (props.disabled) {
      classes.push('aether-input--disabled');
    }

    el.className = classes.join(' ');
  });

  // Store effect for cleanup
  (el as HTMLInputElement & { _aetherEffects?: Effect[] })._aetherEffects = (el as HTMLInputElement & { _aetherEffects?: Effect[] })._aetherEffects || [];
  (el as HTMLInputElement & { _aetherEffects?: Effect[] })._aetherEffects!.push(classEffect);

  // Set change handler if provided
  if (props.onInput) {
    __setAttr(el, 'onInput', props.onInput);
  }

  // Set change handler if provided
  if (props.onChange) {
    __setAttr(el, 'onChange', props.onChange);
  }

  return el;
}

// Export input types as constant for type hints
Input.types = ['text', 'number', 'password', 'email', 'tel', 'url'] as const;
