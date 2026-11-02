import * as React from 'react';
import { createInstance, Piral, ExtensionSlot } from 'piral';
import { createRoot } from 'react-dom/client';

const instance = createInstance({
  requestPilets: async () => {
    const response = await fetch('/feed.json');
    return response.json();
  },
});

function ShellPage() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24, maxWidth: 900, margin: 'auto' }}>
      <h1>Piral Vite 8 CommonJS Reproduction</h1>
      <section aria-labelledby="one-heading">
        <h2 id="one-heading">Pilet: table-one</h2>
        <ExtensionSlot name="table-one" />
      </section>
      <section aria-labelledby="two-heading">
        <h2 id="two-heading">Pilet: table-two</h2>
        <ExtensionSlot name="table-two" />
      </section>
    </main>
  );
}

instance.root.registerPage('/', ShellPage);
createRoot(document.getElementById('app')!).render(<Piral instance={instance} />);
