# Piral + Vite 8: Shared CommonJS Dependency Reproduction

Minimal reproduction for [Piral issue #899](https://github.com/smapiot/piral/issues/899). It builds a real Piral shell and two independent schema v2 pilets with `piral-cli-vite8`; both pilets use the centrally shared `react-table@7.8.0` dependency.

## Run the comparison

Use Node 24.15.0. Install dependencies and Chromium once:

```sh
nvm use
npm ci
npx playwright install chromium
```

### 1. Unpatched build: reproduce the failure

```sh
npm run build:baseline
npm run inspect
npm run test:repro
```

Observed: the shell and both pilets build, but both pilets fail during Piral/SystemJS module evaluation. The browser reports:

```text
Error: Calling `require` for "react" in an environment that doesn't expose the `require` function.
```

Neither table renders. The generated pilet bundles contain `__require("react")` even though `react` is a shared SystemJS dependency. See [`evidence/browser-errors.txt`](evidence/browser-errors.txt) and [`evidence/bundle-inspection.txt`](evidence/bundle-inspection.txt).

### 2. Patched build: show the fix

```sh
npm run build:patched
npm run inspect:patched
npm run test:patched
```

Observed: both tables render with three rows each, both pilet setup functions run, and the patched bundles contain no external `__require(...)` calls. See [`evidence/browser-errors-patched.txt`](evidence/browser-errors-patched.txt) and [`evidence/after-patch.txt`](evidence/after-patch.txt).

`build:patched` applies Vite 8's `esmExternalRequirePlugin` temporarily to the installed `piral-cli-vite8` plugin and writes separate output under `dist/patched`. It restores the installed plugin when the build finishes. The normal `build:baseline` remains unpatched.

To view either production build manually after building it, run `npm start` for the baseline or `npm run start:patched` for the fixed build, then open <http://127.0.0.1:4173>.

## What this demonstrates

The shell shares React and React Table through Piral's native `importmap` configuration. Piral registers these modules for its pilet loader, and each pilet bundle declares them as SystemJS dependencies. In the unpatched Vite 8 output, bundled CommonJS code still calls `__require("react")`; that call cannot use the shared SystemJS module and fails in the browser.

In the primary configuration, React Table is externalized; the failing call is from bundled `react/jsx-runtime`. A control with React Table bundled also fails and adds a `__require("react")` from React Table's CommonJS wrapper. The patch converts external CommonJS requires into module imports, which the Piral loader can resolve.

## Versions

Node 24.15.0, npm 11.20.0, piral-cli 1.10.3, piral/piral-base 1.12.4, piral-cli-vite8 1.0.0, Vite 8.3.5, Rolldown 1.2.15, React 18.3.1, and react-table 7.8.0. The committed lockfile pins these versions. React 18 is used because React Table 7's declared peer range ends at React 18.

More observed bundle details and controls are in [`evidence/`](evidence/).
