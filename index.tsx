import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';
import { initBalance } from './utils/balance';

// Stat overrides are written into the data tables here, before anything imports or renders
// them. It has to happen at the entry point rather than inside a component: the tables are
// module-level objects that half the codebase imports directly, and a React effect would
// run after the first battle had already been built from the untuned numbers.
initBalance();

/**
 * The tutorial script's assertions and its full seven-board replay. Development only.
 *
 * They used to be bare top-level calls inside data/tutorial.ts, which meant every player
 * shipped and executed them: roughly 800 lines of checks, the replay harness, and the six
 * data tables imported solely to be tested against, all run before the menu could paint.
 *
 * `import.meta.env.DEV` is statically replaced at build time, so the whole branch — and
 * everything it reaches — is dropped from the production bundle.
 */
if (import.meta.env.DEV) {
    import('./data/tutorial.assert');
    import('./data/roster.assert');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);