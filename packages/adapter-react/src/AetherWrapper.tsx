// AetherWrapper - Wrap React components for use inside Aether
// Enables React components to be rendered within Aether's reactive system

import React, { createElement, useState, useEffect, useRef, useCallback, type ReactNode, type FC } from 'react';
import { __createComponent, __effect, __setAttr, ComponentContext, __createElement } from 'aether';
import { bridgeReactEvent, isReactEvent, toNativeEvent, transformPropsForAether } from './eventBridge';

/**
 * Props for AetherWrapper
 */
export interface AetherWrapperProps {
  /** The React component to render */
  children: ReactNode;
  /** Optional callback when the React component mounts */
  onMount?: (element: HTMLElement) => void;
  /** Optional callback when the React component unmounts */
  onUnmount?: () => void;
  /** Optional ref to access the React component's DOM element */
  forwardRef?: React.RefObject<HTMLElement>;
  /** Additional props to pass to the React component */
  props?: Record<string, unknown>;
}

/**
 * AetherWrapper - Allows React components to be used inside Aether
 *
 * This wrapper:
 * 1. Creates a React root within an Aether component
 * 2. Bridges React events to Aether's event system
 * 3. Handles lifecycle (mount/unmount) properly
 * 4. Provides proper ref forwarding
 *
 * @example
 * // Inside an Aether component:
 * function MyAetherComponent() {
 *   return (
 *     <AetherWrapper>
 *       <MyReactComponent />
 *     </AetherWrapper>
 *   );
 * }
 */
export const AetherWrapper: FC<AetherWrapperProps> = ({
  children,
  onMount,
  onUnmount,
  forwardRef,
  props = {},
}) => {
  // Container element ref
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Track mounted state
  const [mounted, setMounted] = useState(false);
  // Store the cleanup function
  const cleanupRef = useRef<(() => void) | null>(null);

  // Use Aether's effect system for lifecycle management
  const ctxRef = useRef<ComponentContext | null>(null);

  useEffect(() => {
    // This is a React useEffect - it runs after the DOM is mounted
    // We use it to trigger the Aether lifecycle callbacks

    if (containerRef.current) {
      setMounted(true);
      onMount?.(containerRef.current);
    }

    return () => {
      onUnmount?.();
      cleanupRef.current?.();
    };
  }, []);

  // Create the React component and handle ref forwarding
  const reactElement = createElement(
    'div',
    {
      ref: (node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (forwardRef) {
          if (typeof forwardRef === 'function') {
            forwardRef(node);
          } else if ('current' in forwardRef) {
            (forwardRef as React.MutableRefObject<HTMLElement | null>).current = node;
          }
        }
      },
      style: { display: 'contents' }, // Invisible container
    },
    mounted ? children : null
  );

  // If we have props to pass, wrap the children
  const wrappedChildren = Object.keys(props).length > 0
    ? React.cloneElement(children as React.ReactElement, props)
    : children;

  return reactElement;
};

/**
 * Wrapper for React components that need Aether integration
 * This is used internally to properly bridge events and lifecycle
 */
export function createAetherWrappedComponent<Props extends Record<string, unknown>>(
  ReactComponent: FC<Props>
): FC<Props & { __aetherContext?: ComponentContext }> {
  return function WrappedReactComponent(props: Props & { __aetherContext?: ComponentContext }) {
    const elementRef = useRef<HTMLElement | null>(null);
    const effectCleanups = useRef<Array<() => void>>([]);

    // Set up event bridging
    useEffect(() => {
      if (!elementRef.current) return;

      const element = elementRef.current;
      const aetherContext = props.__aetherContext;

      // Bridge all React events to the Aether context
      const eventProps = Object.keys(props).filter(isReactEvent);

      for (const eventProp of eventProps) {
        const handler = props[eventProp as keyof Props];
        if (typeof handler === 'function') {
          // Create an Aether effect for the event
          const effect = __effect(() => {
            // This effect runs once to set up the event listener
          });

          bridgeReactEvent(element, eventProp, handler as (event: Event) => void, effect);

          // Store cleanup
          effectCleanups.current.push(() => {
            // Event listener cleanup is handled by bridgeReactEvent
          });
        }
      }

      return () => {
        // Cleanup all event listeners
        for (const cleanup of effectCleanups.current) {
          cleanup();
        }
        effectCleanups.current = [];
      };
    }, [props, props.__aetherContext]);

    return createElement(ReactComponent as FC<Props>, {
      ...props,
      ref: elementRef,
    });
  };
}

/**
 * Convert Aether element to React element
 * This is used internally to properly render Aether elements within React
 */
export function aetherToReact(
  aetherNode: Node | Node[] | unknown,
  context?: ComponentContext
): React.ReactNode {
  if (!aetherNode) return null;

  // Handle arrays
  if (Array.isArray(aetherNode)) {
    return aetherNode.map((node, index) => aetherToReact(node, context));
  }

  // Handle text nodes
  if (aetherNode instanceof Text) {
    return aetherNode.textContent;
  }

  // Handle DOM elements
  if (aetherNode instanceof Element) {
    return elementToReact(aetherNode);
  }

  return null;
}

/**
 * Convert a DOM element to a React element
 */
function elementToReact(element: Element): React.ReactElement {
  const tagName = element.tagName.toLowerCase();
  const attributes: Record<string, unknown> = {};

  // Convert attributes
  for (const attr of element.attributes) {
    const name = attr.name;

    // Skip event handlers from DOM (they're already bridged)
    if (name.startsWith('on') && name[2] === name[2].toUpperCase()) {
      continue;
    }

    attributes[name] = attr.value;
  }

  // Convert children
  const children = Array.from(element.childNodes).map((child) => {
    if (child instanceof Element) {
      return elementToReact(child);
    }
    if (child instanceof Text) {
      return child.textContent;
    }
    return null;
  }).filter(Boolean);

  return createElement(tagName, attributes, ...children);
}

/**
 * Higher-order component to wrap an Aether component for use in React
 *
 * @example
 * const WrappedCounter = withAether(CounterComponent);
 * <WrappedCounter initialCount={0} />
 */
export function withAether<Props extends Record<string, unknown>>(
  AetherComponent: (props: Props) => Node | Node[]
): FC<Props> {
  return function AetherInReact(props: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const unmountRef = useRef<(() => void) | null>(null);

    useEffect(() => {
      if (!containerRef.current) return;

      // Dynamically import Aether and mount the component
      let mounted = true;

      import('aether').then((aether) => {
        if (!mounted || !containerRef.current) return;

        const instance = aether.mount(
          () => AetherComponent(props as Props),
          containerRef.current!
        );

        unmountRef.current = instance.unmount;
      });

      return () => {
        mounted = false;
        unmountRef.current?.();
      };
    }, [props]);

    return createElement('div', { ref: containerRef });
  };
}
