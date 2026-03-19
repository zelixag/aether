// @aether/adapter-react - React Adapter for Aether Framework
// Enables bidirectional interoperability between React and Aether

/**
 * React Adapter for Aether Framework
 *
 * This package provides:
 * 1. AetherWrapper - Use React components inside Aether
 * 2. ReactWrapper - Use Aether components inside React
 * 3. Event bridging between React and Aether event systems
 * 4. Context/store bridging for shared state
 */

// Re-export components
export { AetherWrapper, createAetherWrappedComponent, aetherToReact, withAether } from './AetherWrapper';
export {
  ReactWrapper,
  useAetherState,
  useAetherEffect,
  useAetherDerived,
  reactToAether,
  withReact,
} from './ReactWrapper';

// Re-export event bridging utilities
export {
  isReactEvent,
  toNativeEvent,
  toReactEvent,
  bridgeReactEvent,
  transformPropsForAether,
  transformPropsForReact,
  type SyntheticEvent,
} from './eventBridge';

// Re-export context/store bridging utilities
export {
  createContextBridge,
  useAetherStore,
  contextToStore,
  createSharedStore,
} from './contextBridge';

/**
 * Adapter version
 */
export const VERSION = '0.1.0';

/**
 * Check if the adapter is properly installed
 */
export function isAdapterInstalled(): boolean {
  try {
    // Check if Aether runtime is available
    require('aether');
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize the adapter
 * This sets up the necessary bridges and global state
 */
export function initAdapter(): void {
  if (typeof window === 'undefined') {
    console.warn('[Aether/React] Adapter initialization skipped - not in browser');
    return;
  }

  console.info(`[Aether/React] Adapter v${VERSION} initialized`);
}

/**
 * Default export with all functionality
 */
export default {
  // Components
  AetherWrapper,
  ReactWrapper,

  // Hooks
  useAetherState,
  useAetherEffect,
  useAetherDerived,
  useAetherStore,

  // Utilities
  createContextBridge,
  createSharedStore,
  contextToStore,
  reactToAether,
  withAether,
  withReact,

  // Event utilities
  isReactEvent,
  toNativeEvent,
  toReactEvent,
  bridgeReactEvent,
  transformPropsForAether,
  transformPropsForReact,

  // Lifecycle
  initAdapter,
  isAdapterInstalled,
  VERSION,
};
