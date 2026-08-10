# CLAUDE.md

## Project

A modern website built as a **React + Vite** frontend hosted by a **.NET Aspire** AppHost.

- `frontend/` — React + Vite app (currently empty; needs scaffolding)
- `WebStarter.AppHost/` — Aspire orchestration; wires the Vite app via `AddViteApp("webfrontend", "../frontend")` and publishes it into the server's `wwwroot`
- `WebStarter.Server/` — ASP.NET Core API, referenced by the frontend through service discovery
- `WebStarter.sln` — includes `frontend/frontend.esproj`, so scaffolding must recreate that project file

## Commands

```powershell
aspire start          # run AppHost: server + Vite dev server together
aspire ps             # list running resources
aspire logs           # stream logs
npm run dev           # frontend only, from frontend/
```

Prefer `aspire start` over running the frontend standalone — service discovery for the API only resolves under the AppHost.

## Library documentation

Use **context7** before writing code against any library — React, Vite, Three.js, R3F. Do not write API calls from memory; resolve the library ID, then query for the specific API. This matters most for Three.js, which breaks APIs across r-releases.

## Three.js

See `docs/threejs-mcp.md` for the full setup. Short version:

- Docs via **context7** (`/mrdoob/three.js`, `/pmndrs/react-three-fiber`, `/pmndrs/drei`)
- Live scene inspection via the **threejs-devtools** MCP server (needs Chrome on `--remote-debugging-port=9222`)
- Always dispose geometries, materials and textures on unmount
- Measure draw calls and texture memory before optimising

## UI design

`docs/stitch-mcp.md` covers the Stitch MCP server for generating UI screens. It needs `STITCH_API_KEY` in the environment.
