import { createSSRApp } from 'aether';
import App from './App.jsx';

export function renderToString() {
  const app = createSSRApp(App);
  // In a real implementation, this would render to a string
  // For now, return placeholder
  return '<div class="app"><h1>Welcome to Aether SSR</h1></div>';
}
