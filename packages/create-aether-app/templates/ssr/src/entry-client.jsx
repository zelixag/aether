import { render, createSignal } from 'aether';
import App from './App.jsx';

// Client-side hydration
render(App, document.getElementById('app'));
