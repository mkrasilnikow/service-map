# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Type-check + production build (tsc -b && vite build)
npm run lint      # ESLint check
npm run preview   # Preview production build
```

No test suite is configured.

## Architecture Overview

React + TypeScript + Vite SPA. Canvas is powered by **`@xyflow/react`** (React Flow v12). No backend — pure client-side.

### State management

All graph state lives in `src/hooks/useGraph.ts`. The hook manages two state arrays:

- `serviceNodes: RFServiceNode[]` — stored in React state
- `edges: RFServiceEdge[]` — stored in React state
- `namespaceNodes: RFNamespaceNode[]` — **derived** (computed via `useMemo` from `serviceNodes`), never stored in state

The `nodes` array passed to `<ReactFlow>` is `[...namespaceNodes, ...serviceNodes]` so namespace backgrounds render below service nodes (z-index -1).

### Canonical types vs React Flow types

Two parallel representations exist:

| Layer | Types | Used for |
|---|---|---|
| Canonical | `GraphNode`, `GraphEdge` | Import/export utils, Sidebar props |
| React Flow | `RFServiceNode`, `RFServiceEdge`, `RFNamespaceNode` | `<ReactFlow>` component |

`App.tsx` converts between them via `useMemo` whenever `serviceNodes`/`edges` change. The conversion functions `graphNodesToRF` / `graphEdgesToRF` live in `useGraph.ts`.

### Component hierarchy

```
App (ReactFlowProvider)
└── AppInner
    ├── Toolbar
    ├── ReactFlow
    │   ├── ServiceNode   (custom node type: 'service')
    │   ├── NamespaceNode (custom node type: 'namespace', non-interactive)
    │   └── ServiceEdge   (custom edge type: 'service')
    ├── Sidebar           (absolutely positioned overlay, right side)
    └── Modals (AddNodeModal, ExportModal, ImportModal)
```

`ThemeContext` (`src/context/ThemeContext.tsx`) provides `isDark` to all components. Theme is persisted to `localStorage` under key `service-map-theme` and applied as `data-theme` attribute on `<html>`.

### Adding a new node type

1. Add the key to `NodeTypeKey` union in `src/types/index.ts`
2. Add the entry to `NODE_TYPES` in `src/constants/nodeTypes.ts` (label, colors for light/dark, icon emoji, optional `dashed`)

No component changes needed — all rendering reads from the config.

### Import/export formats

| Format | Direction | Handler |
|---|---|---|
| `service-schema` JSON | Import | `importServiceSchema()` in `src/utils/import.ts` — validates via JSON schema, applies auto-layout |
| `schema-export` JSON | Import (legacy) | `importSchemaExport()` in `src/utils/import.ts` — restores positions directly |
| `flow` (RF native) | Import | Parsed in `ImportModal`, calls `restoreFlow()` + `setViewport()` |
| Mermaid `.md` | Export | `toMermaid()` in `src/utils/export.ts` |
| RF native JSON | Export | `toObject()` from `useReactFlow()`, namespace nodes filtered out |
| PNG | Export | `downloadImage()` in `src/utils/export.ts` via `html-to-image` |

### Auto-layout

`src/utils/layout.ts` — left-to-right layered layout (BFS depth assignment → column grouping by namespace → x/y coordinates). Called by `importServiceSchema` after parsing.

### Key constants

- `NODE_W = 172`, `NODE_H = 58` — default node dimensions (from `src/constants/nodeTypes.ts`)
- Namespace node ID prefix: `__ns__` — used to filter namespace changes out of `onNodesChange`
- `deleteKeyCode="Delete"` on `<ReactFlow>` — RF handles keyboard deletion natively
