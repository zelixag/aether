// ReactWrapper - Wrap Aether components for use inside React
// Enables Aether components to be rendered within React's virtual DOM

import React, { createElement, useState, useEffect, useRef, useCallback, type ReactNode, type FC } from 'react';
import { __createComponent, __effect, __flush, mount } from 'aether';
import { transformPropsForReact } from './eventBridge';
import type ReactDOM from 'react-dom';

/**
 * Props for ReactWrapper
 */
export interface ReactWrapperProps<Props extends Record<string, unknown> = Record<string, unknown>> {
  /** The Aether component to render */
  children: ReactNode;
  /** Initial props to pass to the Aether component */
  initialProps?: Props;
  /** Callback when the Aether component mounts */
  onMount?: (ctx: unknown) => void;
  /** Callback when the Aether component unmounts */
  onUnmount?: () => void;
}

/**
 * ReactWrapper - Allows Aether components to be used inside React
 *
 * This wrapper:
 * 1. Creates an Aether component context within React
 * 2. Bridges React events to Aether props
 * 3. Handles lifecycle (mount/unmount) properly
 * 4. Syncs React props to Aether state
 *
 * @example
 * // Inside a React component:
 * function MyReactComponent() {
 *   return (
 *     <ReactWrapper>
 *       <MyAetherComponent />
 *     </ReactWrapper>
 *   );
 * }
 */
export const ReactWrapper: FC<ReactWrapperProps> = ({
  children,
  initialProps = {} as Record<string, unknown>,
  onMount,
  onUnmount,
}) => {
  // Container ref for Aether DOM
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Aether component context
  const ctxRef = useRef<ReturnType<typeof __createComponent> | null>(null);
  // Track if mounted
  const [isMounted, setIsMounted] = useState(false);

  // Get the Aether component from children
  const aetherComponent = (() => {
    const child = React.Children.only(children);
    if (React.isValidElement(child)) {
      return child.props as {
        type?: (props: Record<string, unknown>) => Node | Node[];
        __aether__?: boolean;
      };
    }
    return null;
  })();

  // Mount Aether component when container is ready
  useEffect(() => {
    if (!containerRef.current || !aetherComponent) return;

    const container = containerRef.current;
    const componentFn = aetherComponent.type;

    if (typeof componentFn !== 'function') return;

    // Transform React props to Aether props
    const aetherProps = transformPropsForReact(initialProps);

    // Create Aether component context and mount
    const ctx = __createComponent((ctx) => {
      return componentFn({ ...aetherProps, __aetherContext: ctx });
    });

    ctxRef.current = ctx;
    setIsMounted(true);
    onMount?.(ctx);

    // Note: Aether components manage their own DOM lifecycle
    // We don't need to manually append - Aether's mount handles this

    return () => {
      ctx.dispose();
      onUnmount?.();
    };
  }, [aetherComponent, initialProps]);

  return createElement('div', {
    ref: containerRef,
    style: { display: 'contents' }, // Invisible container
    'data-aether-wrapper': 'true',
  });
};

/**
 * Hook to use an Aether component's state in React
 * This creates a bridge that allows React to observe Aether state changes
 *
 * @example
 * function MyReactComponent() {
 *   const { count, setCount } = useAetherState(myAetherStore);
 *   return <div>{count}</div>;
 * }
 */
export function useAetherState<T>(
  aetherSignal: { value: T }
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => aetherSignal.value);

  useEffect(() => {
    const effect = __effect(() => {
      setState(aetherSignal.value);
    });

    return () => effect.dispose();
  }, [aetherSignal]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    if (typeof value === 'function') {
      aetherSignal.value = (value as (prev: T) => T)(aetherSignal.value);
    } else {
      aetherSignal.value = value;
    }
  }, [aetherSignal]);

  return [state, setValue];
}

/**
 * Hook to use an Aether effect in React
 * This bridges Aether's $effect to React's useEffect
 *
 * @example
 * function MyReactComponent() {
 *   useAetherEffect(() => {
 *     console.log('Count changed:', store.count);
 *     return () => cleanup();
 *   });
 * }
 */
export function useAetherEffect(
  fn: () => void | (() => void),
  deps?: React.DependencyList
): void {
  // Convert Aether effect to React effect by tracking deps manually
  const effectRef = useRef<{ dispose?: () => void } | null>(null);
  const prevDepsRef = useRef<React.DependencyList | undefined>(undefined);

  // Check if deps changed
  const depsChanged = !prevDepsRef.current
    ? true
    : !deps
      ? false
      : deps.length !== prevDepsRef.current.length ||
        deps.some((dep, i) => !Object.is(dep, prevDepsRef.current?.[i]));

  useEffect(() => {
    if (depsChanged) {
      // Cleanup previous effect
      effectRef.current?.dispose?.();

      // Create new Aether effect
      const cleanup = __effect(fn);
      effectRef.current = cleanup;

      // Store cleanup from the effect function itself
      // (Aether effects can return a cleanup function)
      const effectCleanup = fn();
      if (typeof effectCleanup === 'function') {
        const originalDispose = cleanup.dispose.bind(cleanup);
        cleanup.dispose = () => {
          effectCleanup();
          originalDispose();
        };
      }
    }

    prevDepsRef.current = deps;

    return () => {
      effectRef.current?.dispose?.();
      effectRef.current = null;
    };
  }, [fn, depsChanged, deps]);
}

/**
 * Hook to use Aether's $derived in React
 *
 * @example
 * function MyReactComponent() {
 *   const doubled = useAetherDerived(() => store.count * 2);
 *   return <div>{doubled}</div>;
 * }
 */
export function useAetherDerived<T>(
  fn: () => T,
  deps?: React.DependencyList
): T {
  // For now, we use a simple state + effect pattern
  // A more optimized implementation would use Aether's Derived directly
  const [value, setValue] = useState<T>(() => fn());

  useAetherEffect(() => {
    setValue(fn());
  }, deps ? [...deps, fn] : [fn]);

  return value;
}

/**
 * Convert a React component to an Aether-compatible component
 * This is used internally to render React components inside Aether
 *
 * @example
 * const AetherButton = reactToAether(ReactButton);
 * // Now AetherButton can be used in Aether components
 */
export function reactToAether<Props extends Record<string, unknown>>(
  ReactComponent: FC<Props>
): (props: Props) => Node | Node[] {
  return function AetherComponent(props: Props): Node | Node[] {
    // Create a container element
    const container = __createElement('div');
    container.setAttribute('data-react-wrapper', 'true');

    // We need to render React into this container
    // This requires a React root, which we manage via a side effect
    let reactRoot: ReactDOM.Root | null = null;

    // Create Aether effect to manage React lifecycle
    __effect(() => {
      // On the server/SSR, we can't render React
      if (typeof document === 'undefined') return;

      // Dynamically import ReactDOM to avoid SSR issues
      import('react-dom').then(({ createRoot }) => {
        if (!container.isConnected) return;

        reactRoot = createRoot(container);
        reactRoot.render(React.createElement(ReactComponent, props));
      });

      return () => {
        reactRoot?.unmount();
        reactRoot = null;
      };
    });

    return container;
  };
}

/**
 * Higher-order component to wrap a React component for use in Aether
 *
 * @example
 * const AetherButton = withReact(ReactButton);
 * // Now AetherButton can be used in Aether components
 */
export function withReact<Props extends Record<string, unknown>>(
  ReactComponent: FC<Props>
): (props: Props) => Node | Node[] {
  return reactToAether(ReactComponent);
}
