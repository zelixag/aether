// Event Bridge - React events to Aether events
// Handles event system translation between React and Aether

import type { Effect } from 'aether';
import { __effect } from 'aether';

// React event attribute name to native event name mapping
const REACT_EVENT_MAP: Record<string, string> = {
  onClick: 'click',
  onChange: 'change',
  onInput: 'input',
  onSubmit: 'submit',
  onFocus: 'focus',
  onBlur: 'blur',
  onKeyDown: 'keydown',
  onKeyUp: 'keyup',
  onKeyPress: 'keypress',
  onMouseEnter: 'mouseenter',
  onMouseLeave: 'mouseleave',
  onMouseOver: 'mouseover',
  onMouseOut: 'mouseout',
  onDoubleClick: 'dblclick',
  onContextMenu: 'contextmenu',
  onWheel: 'wheel',
  onScroll: 'scroll',
  onLoad: 'load',
  onError: 'error',
  onAbort: 'abort',
  onResize: 'resize',
  onSelect: 'select',
  onToggle: 'toggle',
  onPlay: 'play',
  onPause: 'pause',
  onEnded: 'ended',
  onCopy: 'copy',
  onCut: 'cut',
  onPaste: 'paste',
};

// Reverse map: native event to React event attribute
const NATIVE_TO_REACT_EVENT: Record<string, string> = Object.fromEntries(
  Object.entries(REACT_EVENT_MAP).map(([react, native]) => [native, react])
);

/**
 * Check if an attribute name is a React event handler
 */
export function isReactEvent(attrName: string): boolean {
  return attrName.startsWith('on') && attrName[2] === attrName[2].toUpperCase();
}

/**
 * Convert React event attribute name to native event name
 * e.g., onClick -> click, onChange -> change
 */
export function toNativeEvent(reactEventAttr: string): string | null {
  return REACT_EVENT_MAP[reactEventAttr] || null;
}

/**
 * Convert native event name to React event attribute name
 * e.g., click -> onClick
 */
export function toReactEvent(nativeEvent: string): string {
  return `on${nativeEvent.charAt(0).toUpperCase()}${nativeEvent.slice(1)}`;
}

/**
 * Create an Aether effect that bridges a React event to an Aether component
 * This is used when rendering React components inside Aether
 */
export function bridgeReactEvent(
  element: HTMLElement,
  reactEventAttr: string,
  handler: (event: Event) => void,
  effect?: Effect
): void {
  const nativeEvent = toNativeEvent(reactEventAttr);
  if (!nativeEvent) return;

  const wrappedHandler = (e: Event) => {
    // Create a React-like synthetic event
    const syntheticEvent = createSyntheticEvent(e);
    handler(syntheticEvent);
  };

  element.addEventListener(nativeEvent, wrappedHandler);

  // If we have an effect context, the cleanup will be handled there
  if (effect) {
    // Store the cleanup info - actual cleanup happens in effect.dispose()
    (effect as Effect & { _eventCleanups?: Array<() => void> })._eventCleanups =
      (effect as Effect & { _eventCleanups?: Array<() => void> })._eventCleanups || [];
    ((effect as Effect & { _eventCleanups?: Array<() => void> })._eventCleanups!).push(() => {
      element.removeEventListener(nativeEvent, wrappedHandler);
    });
  }
}

/**
 * Create a synthetic event that mimics React's SyntheticEvent
 */
function createSyntheticEvent(nativeEvent: Event): SyntheticEvent {
  return {
    nativeEvent,
    type: nativeEvent.type,
    target: nativeEvent.target,
    currentTarget: nativeEvent.currentTarget,
    bubbles: nativeEvent.bubbles,
    cancelable: nativeEvent.cancelable,
    defaultPrevented: nativeEvent.defaultPrevented,
    eventPhase: nativeEvent.eventPhase,
    isTrusted: nativeEvent.isTrusted,
    timeStamp: nativeEvent.timeStamp,
    preventDefault(): void {
      nativeEvent.preventDefault();
    },
    stopPropagation(): void {
      nativeEvent.stopPropagation();
    },
    persist(): void {
      // No-op for compatibility
    },
  };
}

export interface SyntheticEvent {
  nativeEvent: Event;
  type: string;
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  bubbles: boolean;
  cancelable: boolean;
  defaultPrevented: boolean;
  eventPhase: number;
  isTrusted: boolean;
  timeStamp: number;
  preventDefault(): void;
  stopPropagation(): void;
  persist(): void;
}

/**
 * Props transformation for React -> Aether
 * Converts camelCase React props to kebab-case where needed
 */
export function transformPropsForAether(props: Record<string, unknown>): Record<string, unknown> {
  const transformed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    // Skip React internal props
    if (key === 'children' || key === 'key') {
      transformed[key] = value;
      continue;
    }

    // Convert React events to Aether format
    if (isReactEvent(key)) {
      transformed[key] = value;
    }
    // Convert className to class for Aether
    else if (key === 'className') {
      transformed['class'] = value;
    }
    // Convert style objects
    else if (key === 'style' && typeof value === 'object' && value !== null) {
      transformed['style'] = flattenStyle(value as Record<string, string>);
    }
    // Pass through other props as-is
    else {
      transformed[key] = value;
    }
  }

  return transformed;
}

/**
 * Flatten nested style objects for Aether
 */
function flattenStyle(style: Record<string, string>): string {
  return Object.entries(style)
    .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
    .join(';');
}

/**
 * Props transformation for Aether -> React
 * Converts kebab-case Aether attributes to camelCase React props
 */
export function transformPropsForReact(props: Record<string, unknown>): Record<string, unknown> {
  const transformed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    // Skip Aether internal props
    if (key.startsWith('$') || key.startsWith('__')) {
      continue;
    }

    // Convert class to className for React
    if (key === 'class') {
      transformed['className'] = value;
    }
    // Convert native events to React events
    else if (!key.startsWith('on') && NATIVE_TO_REACT_EVENT[key]) {
      transformed[NATIVE_TO_REACT_EVENT[key]] = value;
    }
    // Pass through other props as-is
    else {
      transformed[key] = value;
    }
  }

  return transformed;
}
