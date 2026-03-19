// Aether Modal/Dialog Component
// Modal dialog with title, body, and footer sections

import { __createElement, __setAttr, __bindAttr } from '../dom.ts';
import { __effect, Effect } from '../signal.ts';

interface ModalProps {
  open?: boolean;
  class?: string;
  onClose?: () => void;
  children?: unknown;
}

interface ModalTitleProps {
  class?: string;
  children?: unknown;
}

interface ModalBodyProps {
  class?: string;
  children?: unknown;
}

interface ModalFooterProps {
  class?: string;
  children?: unknown;
}

export function Modal(props: ModalProps): HTMLDivElement {
  const el = __createElement('div');

  // Build class string with visibility control
  const classEffect = __effect(() => {
    const classes = ['aether-modal'];
    if (props.class) {
      classes.push(props.class);
    }
    el.className = classes.join(' ');

    // Control visibility based on open prop
    if (props.open) {
      el.style.display = 'flex';
      el.setAttribute('aria-modal', 'true');
    } else {
      el.style.display = 'none';
      el.removeAttribute('aria-modal');
    }
  });

  // Store effect for cleanup
  (el as HTMLDivElement & { _aetherEffects?: Effect[] })._aetherEffects = (el as HTMLDivElement & { _aetherEffects?: Effect[] })._aetherEffects || [];
  (el as HTMLDivElement & { _aetherEffects?: Effect[] })._aetherEffects!.push(classEffect);

  // Handle click on backdrop to close
  const backdropHandler = (e: MouseEvent) => {
    if (e.target === el && props.onClose) {
      props.onClose();
    }
  };

  el.addEventListener('click', backdropHandler);

  // Handle escape key to close
  const escapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.open && props.onClose) {
      props.onClose();
    }
  };
  document.addEventListener('keydown', escapeHandler);

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

// Modal.Title sub-component
export function ModalTitle(props: ModalTitleProps): HTMLHeadingElement {
  const el = __createElement('h2');
  el.className = 'aether-modal-title';

  if (props.class) {
    el.classList.add(props.class);
  }

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

// Modal.Body sub-component
export function ModalBody(props: ModalBodyProps): HTMLDivElement {
  const el = __createElement('div');
  el.className = 'aether-modal-body';

  if (props.class) {
    el.classList.add(props.class);
  }

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

// Modal.Footer sub-component
export function ModalFooter(props: ModalFooterProps): HTMLDivElement {
  const el = __createElement('div');
  el.className = 'aether-modal-footer';

  if (props.class) {
    el.classList.add(props.class);
  }

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

// Attach sub-components to Modal
(Modal as typeof Modal & {
  Title: typeof ModalTitle;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
}).Title = ModalTitle;
(Modal as typeof Modal & {
  Title: typeof ModalTitle;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
}).Body = ModalBody;
(Modal as typeof Modal & {
  Title: typeof ModalTitle;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
}).Footer = ModalFooter;
