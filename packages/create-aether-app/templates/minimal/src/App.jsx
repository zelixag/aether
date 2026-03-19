import { createSignal } from 'aether';

function App() {
  const [count, setCount] = createSignal(0);

  return (
    <div class="app">
      <h1>Welcome to Aether</h1>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
      <button onClick={() => setCount(0)}>
        Reset
      </button>
    </div>
  );
}

export default App;
