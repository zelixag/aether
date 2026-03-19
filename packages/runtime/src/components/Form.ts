// Aether Form Component
// Form with field-level validation support

import { __createElement, __setAttr, __bindAttr } from '../dom.ts';
import { __effect, Effect } from '../signal.ts';

// Validation rule types
export type ValidationRule = (value: unknown) => string | null;
export type ValidationRules = ValidationRule[];

// Built-in validation rules
export const required = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') {
    return 'This field is required';
  }
  return null;
};

export const email = (value: unknown): string | null => {
  if (!value) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(value))) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const minLength = (min: number) => (value: unknown): string | null => {
  if (!value) return null;
  if (String(value).length < min) {
    return `Must be at least ${min} characters`;
  }
  return null;
};

export const maxLength = (max: number) => (value: unknown): string | null => {
  if (!value) return null;
  if (String(value).length > max) {
    return `Must be at most ${max} characters`;
  }
  return null;
};

export const pattern = (regex: RegExp, message = 'Invalid format') => (value: unknown): string | null => {
  if (!value) return null;
  if (!regex.test(String(value))) {
    return message;
  }
  return null;
};

// Form interface
interface FormProps {
  class?: string;
  onSubmit?: (data: Record<string, unknown>, errors: Record<string, string | null>) => void;
  children?: unknown;
}

// Form Field interface
interface FormFieldProps {
  name: string;
  label?: string;
  rules?: ValidationRules;
  class?: string;
  children?: unknown;
}

// Form values store
interface FormValues {
  [key: string]: unknown;
}

// Form errors store
interface FormErrors {
  [key: string]: string | null;
}

// Create the main Form component
export function Form(props: FormProps): HTMLFormElement {
  const el = __createElement('form');

  // Internal form state
  const formValues: FormValues = {};
  const formErrors: FormErrors = {};

  // Build class string
  const classEffect = __effect(() => {
    const classes = ['aether-form'];
    if (props.class) {
      classes.push(props.class);
    }
    el.className = classes.join(' ');
  });

  // Store effect for cleanup
  (el as HTMLFormElement & { _aetherEffects?: Effect[] })._aetherEffects = (el as HTMLFormElement & { _aetherEffects?: Effect[] })._aetherEffects || [];
  (el as HTMLFormElement & { _aetherEffects?: Effect[] })._aetherEffects!.push(classEffect);

  // Set up form submission
  __setAttr(el, 'onSubmit', (e: Event) => {
    e.preventDefault();
    if (props.onSubmit) {
      // Collect all field values and errors
      const errors: Record<string, string | null> = {};
      for (const [key, value] of Object.entries(formValues)) {
        errors[key] = formErrors[key] || null;
      }
      props.onSubmit({ ...formValues }, errors);
    }
  });

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

// Form.Field sub-component
export function FormField(props: FormFieldProps): HTMLDivElement {
  const el = __createElement('div');

  // Create label element
  let labelEl: HTMLLabelElement | null = null;
  if (props.label) {
    labelEl = __createElement('label');
    labelEl.className = 'aether-form-field-label';
    labelEl.textContent = props.label;
    el.appendChild(labelEl);
  }

  // Create error message element
  const errorEl = __createElement('span');
  errorEl.className = 'aether-form-field-error';
  errorEl.style.display = 'none';

  // Build class string
  const classEffect = __effect(() => {
    const classes = ['aether-form-field'];
    if (props.class) {
      classes.push(props.class);
    }
    el.className = classes.join(' ');
  });

  // Store effect for cleanup
  (el as HTMLDivElement & { _aetherEffects?: Effect[] })._aetherEffects = (el as HTMLDivElement & { _aetherEffects?: Effect[] })._aetherEffects || [];
  (el as HTMLDivElement & { _aetherEffects?: Effect[] })._aetherEffects!.push(classEffect);

  // Track input element for value binding
  let inputEl: HTMLElement | null = null;

  // Handle children - find the input element
  if (props.children) {
    const children = Array.isArray(props.children) ? props.children : [props.children];
    for (const child of children) {
      if (child instanceof Node) {
        el.appendChild(child);

        // Find input element by tag name or by looking for aether-input class
        if (child instanceof HTMLInputElement || child instanceof HTMLTextAreaElement || child instanceof HTMLSelectElement) {
          inputEl = child as HTMLElement;

          // Set name attribute for form binding
          __setAttr(child as HTMLElement, 'name', props.name);

          // Bind input event to get value and validate
          const inputHandler = (e: Event) => {
            const value = (e.target as HTMLInputElement).value;
            // Store value (in real implementation, this would be stored in form context)
            (el as HTMLDivElement & { _formValue?: unknown })._formValue = value;

            // Run validation if rules are provided
            if (props.rules && props.rules.length > 0) {
              let errorMessage: string | null = null;
              for (const rule of props.rules) {
                const result = rule(value);
                if (result !== null) {
                  errorMessage = result;
                  break;
                }
              }

              // Update error display
              if (errorMessage) {
                errorEl.textContent = errorMessage;
                errorEl.style.display = 'block';
                (el as HTMLDivElement & { _formError?: string })._formError = errorMessage;
              } else {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
                (el as HTMLDivElement & { _formError?: string | null })._formError = null;
              }
            }
          };

          (child as HTMLElement).addEventListener('input', inputHandler);
          (child as HTMLElement).addEventListener('change', inputHandler);
        }
      } else if (typeof child === 'string' || typeof child === 'number') {
        el.appendChild(document.createTextNode(String(child)));
      }
    }
  }

  // Append error element after children
  el.appendChild(errorEl);

  return el;
}

// Attach Field to Form
(Form as typeof Form & { Field: typeof FormField }).Field = FormField;
