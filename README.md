# Piral + Vite 8: Shared CommonJS Dependency Reproduction

Reproduction for [Piral issue #899](https://github.com/smapiot/piral/issues/899). It uses a real Piral shell, two schema v2 pilets, and the centrally shared `react-table@7.8.0` package.

## Run the unpatched build

```sh
nvm use
npm ci
npm run build:baseline
npm run inspect
npm start
```

Open <http://127.0.0.1:4173>. Both pilets fail during module evaluation with:

```text
Error: Calling `require` for "react" in an environment that doesn't expose the `require` function.
```

Neither table renders. The generated bundles contain `__require("react")` despite React being a shared SystemJS dependency. See [`evidence/browser-errors.txt`](evidence/browser-errors.txt) and [`evidence/bundle-inspection.txt`](evidence/bundle-inspection.txt).

## Run the patched build

Stop the baseline server, then run:

```sh
npm run build:patched
npm run inspect:patched
npm run start:patched
```

Open <http://127.0.0.1:4173>. Both tables render with three rows each. The patched bundles have no external `__require(...)` calls. See [`evidence/browser-errors-patched.txt`](evidence/browser-errors-patched.txt) and [`evidence/after-patch.txt`](evidence/after-patch.txt).

`build:patched` temporarily applies Vite 8's `esmExternalRequirePlugin` to the installed Piral Vite plugin, then restores it. It writes separate files under `dist/patched`; the regular build remains unpatched.

## Why it fails

Piral registers shared modules from the shell's native `importmap` configuration and loads pilet bundles through SystemJS. The unpatched Vite 8 output contains CommonJS code that still calls `__require("react")`, which cannot resolve the SystemJS shared module. In the primary shared React + React Table case, the call is from bundled `react/jsx-runtime`. When React Table is bundled, its CommonJS wrapper adds another such call. The patch converts external CommonJS requires into imports that the Piral loader can resolve.

To rebuild the bundled React Table and patched controls, run `npm run compare:controls` after `npm run build:baseline`. Their generated bundles are saved under `evidence/`; the browser outcomes are captured in the committed logs.

## Versions

Node 24.15.0, npm 11.20.0, piral-cli 1.10.3, piral/piral-base 1.12.4, piral-cli-vite8 1.0.0, Vite 8.3.5, Rolldown 1.2.15, React 18.3.1, and react-table 7.8.0. See [`evidence/versions.txt`](evidence/versions.txt).
