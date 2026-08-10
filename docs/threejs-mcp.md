# Three.js MCP

Two MCP servers cover Three.js work in this repo: **context7** for documentation and **threejs-devtools** for live scene inspection.

## Documentation — context7

`context7` is already configured in `.mcp.json`. Use it to pull current Three.js API docs instead of relying on memory — the library ships breaking changes on a roughly monthly release cadence and the r-version in `package.json` is what matters.

Library IDs:

- `/mrdoob/three.js` — core Three.js
- `/pmndrs/react-three-fiber` — React renderer for Three.js
- `/pmndrs/drei` — helper components for R3F

Resolve first with `resolve-library-id`, then `query-docs` with a concrete question (e.g. "WebGPURenderer initialization", "how to dispose geometries and materials").

## Live scene inspection — threejs-devtools

[`threejs-devtools-mcp`](https://github.com/DmitriyGolub/threejs-devtools-mcp) (MIT, third-party) connects to a running scene over the Chrome DevTools Protocol and exposes ~59 tools for objects, materials, shaders, textures, animations, performance and memory. It needs no code changes in the app — the bridge is injected into the page automatically.

### Setup

1. Start the dev server (`npm run dev` in `frontend/`, or `aspire start` for the full AppHost).
2. Launch Chrome with remote debugging enabled, and open the scene in a tab:

   ```powershell
   & "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
   ```

3. Keep that tab open. The MCP server attaches over `localhost:9222` and detects the dev-server port from `package.json`.

If the server reports no scene, the usual causes are: Chrome not started with `--remote-debugging-port=9222`, the tab was closed, or the page has no Three.js `WebGLRenderer` yet.

### What it is good for

- Reading the actual scene graph instead of guessing from source
- Checking draw calls, triangle counts and texture memory before optimising
- Tweaking material and light parameters live, then generating the code for the values that worked

## Working practice

- Verify API shape against context7 before writing renderer, material or loader code — do not write from memory.
- Dispose geometries, materials and textures explicitly on unmount; Three.js does not garbage-collect GPU resources.
- Measure with threejs-devtools before optimising. Draw-call and memory numbers beat assumptions.
