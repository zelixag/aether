// Context Bridge - React Context to Aether $store
// Enables React Context to share state with Aether's reactive system

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

// Aether reactive primitives (imported from runtime)
import { Signal, __store, __effect } from 'aether';

/**
 * Create an Aether store that syncs with a React Context
 * This allows React components and Aether components to share state
 *
 * @example
 * const { Provider, useStore } = createContextBridge<{ count: number }>(
 *   { count: 0 },
 *   (store) => ({ count: store.count })
 * );
 */
export function createContextBridge<T extends Record<string, unknown>>(
  initialState: T,
  selector?: (store: T) => Partial<T>
): {
  Provider: React.FC<{ children: ReactNode; store?: T }>;
  useStore: () => T;
  useSelector: <K extends keyof T>(key: K) => T[K];
  useDerived: <R>(fn: (store: T) => R) => R;
} {
  // Create the underlying Aether store
  const aetherStore = __store(initialState);

  // Create React context
  const Context = createContext<{
    store: T;
    aetherStore: T;
  }>({
    store: initialState as T,
    aetherStore,
  });

  /**
   * Provider component - wraps React children and provides the store
   */
  const Provider: React.FC<{ children: ReactNode; store?: T }> = ({ children, store }) => {
    // Use provided store or initial state
    const currentStore = store || (initialState as T);

    const value = useMemo(
      () => ({
        store: currentStore,
        aetherStore,
      }),
      [currentStore]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  /**
   * Hook to access the full store (React state synced from Aether)
   */
  const useStore = (): T => {
    const { store: initialStore } = useContext(Context);

    // Create reactive state that updates when Aether store changes
    const [reactState, setReactState] = useState<T>(() => {
      if (selector) {
        return selector(initialStore) as T;
      }
      return initialStore;
    });

    // Sync Aether store changes to React state
    useEffect(() => {
      // Create an effect to watch Aether store changes
      const effect = __effect(() => {
        // Read all store keys to establish dependency
        const newState = {} as T;
        for (const key of Object.keys(initialStore)) {
          newState[key] = (aetherStore as Record<string, unknown>)[key] as T[keyof T];
        }

        const selected = selector ? selector(newState) : newState;
        setReactState(selected as T);
      });

      return () => effect.dispose();
    }, [selector]);

    return reactState;
  };

  /**
   * Hook to access a single store key
   */
  const useSelector = <K extends keyof T>(key: K): T[K] => {
    const { store: initialStore } = useContext(Context);

    const [value, setValue] = useState<T[K]>(() =>
      (aetherStore as Record<string, unknown>)[key as string] as T[K]
    );

    useEffect(() => {
      const effect = __effect(() => {
        const newValue = (aetherStore as Record<string, unknown>)[key as string] as T[K];
        setValue(newValue);
      });

      return () => effect.dispose();
    }, [key]);

    return value;
  };

  /**
   * Hook for derived values from the store
   */
  const useDerived = <R>(fn: (store: T) => R): R => {
    const store = useStore();

    const derived = useMemo(() => fn(store), [store, fn]);

    return derived;
  };

  return { Provider, useStore, useSelector, useDerived };
}

/**
 * Hook to use an Aether store directly in a React component
 * This creates a React-compatible interface to an Aether store
 *
 * @example
 * const store = useAetherStore(myAetherStore);
 * return <div>{store.count}</div>;
 */
export function useAetherStore<T extends Record<string, unknown>>(
  aetherStore: T
): [T, (key: keyof T, value: T[keyof T]) => void] {
  const [state, setState] = useState<T>(() => {
    const initial: Record<string, unknown> = {};
    for (const key of Object.keys(aetherStore)) {
      initial[key] = (aetherStore as Record<string, unknown>)[key];
    }
    return initial as T;
  });

  useEffect(() => {
    const effect = __effect(() => {
      const newState: Record<string, unknown> = {};
      for (const key of Object.keys(aetherStore)) {
        newState[key] = (aetherStore as Record<string, unknown>)[key];
      }
      setState(newState as T);
    });

    return () => effect.dispose();
  }, [aetherStore]);

  const setValue = useCallback((key: keyof T, value: T[keyof T]) => {
    (aetherStore as Record<string, unknown>)[key as string] = value;
  }, [aetherStore]);

  return [state, setValue];
}

/**
 * Convert a React context to an Aether store for use in Aether components
 * This creates a bridge that allows Aether components to read React context values
 *
 * @example
 * const authStore = contextToStore(AuthContext);
 * // Now authStore can be used in Aether components
 */
export function contextToStore<T>(
  ReactContext: React.Context<T>
): {
  get: () => T;
  subscribe: (callback: () => void) => () => void;
} {
  let currentValue = ReactContext._currentValue as T;

  return {
    get(): T {
      return currentValue;
    },
    subscribe(callback: () => void): () => void {
      // Note: React contexts don't have a subscription mechanism
      // This creates a polling-based sync (less efficient but works)
      const intervalId = setInterval(() => {
        const newValue = ReactContext._currentValue as T;
        if (newValue !== currentValue) {
          currentValue = newValue;
          callback();
        }
      }, 16); // ~60fps polling

      return () => clearInterval(intervalId);
    },
  };
}

/**
 * Create a store adapter that can be used by both React and Aether
 * This is the recommended way to share state between React and Aether
 *
 * @example
 * const counterStore = createSharedStore({ count: 0 });
 *
 * // In React:
 * const { count, setCount } = useSharedStore(counterStore);
 *
 * // In Aether:
 * $effect(() => console.log(counterStore.count));
 */
export function createSharedStore<T extends Record<string, unknown>>(
  initialState: T
): T & {
  Provider: React.FC<{ children: ReactNode }>;
  useShared: () => [T, (update: Partial<T> | ((prev: T) => Partial<T>)) => void];
} {
  // Create the underlying Aether store
  const aetherStore = __store(initialState) as T & {
    __signals: Record<string, Signal<unknown>>;
  };

  // Create React context for the provider
  const Context = createContext<T>(initialState);

  /**
   * Provider component for React
   */
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<T>(() => {
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(initialState)) {
        result[key] = (aetherStore as Record<string, unknown>)[key];
      }
      return result as T;
    });

    useEffect(() => {
      // Subscribe to Aether store changes
      const effect = __effect(() => {
        const newState: Record<string, unknown> = {};
        for (const key of Object.keys(aetherStore)) {
          if (key !== '__signals') {
            newState[key] = (aetherStore as Record<string, unknown>)[key];
          }
        }
        setState(newState as T);
      });

      return () => effect.dispose();
    }, []);

    return <Context.Provider value={state}>{children}</Context.Provider>;
  };

  /**
   * Hook to use the shared store in React components
   */
  const useShared = (): [T, (update: Partial<T> | ((prev: T) => Partial<T>)) => void] => {
    const state = useContext(Context);

    const update = useCallback((update: Partial<T> | ((prev: T) => Partial<T>)) => {
      if (typeof update === 'function') {
        const current: Record<string, unknown> = {};
        for (const key of Object.keys(aetherStore)) {
          if (key !== '__signals') {
            current[key] = (aetherStore as Record<string, unknown>)[key];
          }
        }
        const changes = (update as (prev: T) => Partial<T>)(current as T);
        Object.assign(aetherStore, changes);
      } else {
        Object.assign(aetherStore, update);
      }
    }, []);

    return [state, update];
  };

  // Attach provider to the store
  (aetherStore as T & { Provider: typeof Provider }).Provider = Provider;
  (aetherStore as T & { useShared: typeof useShared }).useShared = useShared;

  return aetherStore as T & {
    Provider: typeof Provider;
    useShared: typeof useShared;
  };
}
