# Service Map Editor

> [Русская версия](./README.md)

An interactive editor for microservice architecture maps. Visually design, edit, and export service architecture diagrams directly in the browser.

## About

Service Map Editor is a client-side SPA built with React + TypeScript for creating microservice architecture diagrams. Key features:

- **Visual editor** — SVG canvas with drag & drop nodes and interactive edges
- **7 service types** — Spring Boot, Node.js, MongoDB, Kafka, Redis, PostgreSQL, External
- **7 integration types** — REST, SOAP, gRPC, GraphQL, pub/sub, db, cache (displayed as badges on arrows)
- **Namespace grouping** — services with the same namespace are outlined with a dashed rectangle
- **Import/Export** — service-schema JSON, schema-export JSON, Mermaid (.md), PDF (A3 landscape)
- **Light/Dark theme** — toggle via toolbar button, persisted to localStorage
- **Keyboard shortcuts** — Delete/Backspace to remove, Escape to reset mode
- **Auto-layout** — automatic node positioning on service-schema import

## Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/mkrasilnikow/service-map.git
cd service-map

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Commands

| Command           | Description                       |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start dev server with HMR         |
| `npm run build`   | Build for production               |
| `npm run preview` | Preview production build           |
| `npm run lint`    | Lint code with ESLint              |

## Deploy to Vercel

The project is ready for Vercel deployment with zero configuration:

1. Import the repository in [Vercel Dashboard](https://vercel.com/new).
2. Vercel will auto-detect the Vite framework and apply settings from `vercel.json`.
3. Click **Deploy**.

Or via CLI:

```bash
npx vercel --prod
```

## How to Add a New Service Type

Adding a new type requires no component changes — just two steps:

### Step 1 — Add the type key

In `src/types/index.ts`, add a new key to the `NodeTypeKey` union:

```typescript
export type NodeTypeKey =
  | 'spring-boot'
  | 'nodejs'
  // ...
  | 'my-new-type';  // ← add here
```

### Step 2 — Add the configuration

In `src/constants/nodeTypes.ts`, add an entry to the `NODE_TYPES` object:

```typescript
'my-new-type': {
  label: 'My Service',
  color: '#a78bfa',        // primary accent color
  bgLight: '#ede9fe',      // card background (light theme)
  bgDark: '#1e1044',       // card background (dark theme)
  borderLight: '#8b5cf6',  // border (light theme)
  borderDark: '#8b5cf6',   // border (dark theme)
  icon: '🔮',             // emoji icon
  dashed: false,           // dashed border (optional)
},
```

That's it — the new type will appear in the add node modal, type selector in the sidebar, and in the legend.

## Input File Format: service-schema

To import an architecture, use the `service-schema` format:

```json
{
  "version": "1.0",
  "services": [
    {
      "id": "user-service",
      "name": "User Service",
      "type": "spring-boot",
      "namespace": "backend",
      "integrations": [
        {
          "target": "postgres-users",
          "type": "db",
          "label": "read/write"
        }
      ]
    },
    {
      "id": "postgres-users",
      "name": "Users DB",
      "type": "postgresql",
      "namespace": "databases"
    }
  ]
}
```

### Service fields

| Field          | Type     | Required | Description                                            |
| -------------- | -------- | -------- | ------------------------------------------------------ |
| `id`           | string   | yes      | Unique identifier                                      |
| `name`         | string   | yes      | Display name                                           |
| `type`         | string   | yes      | Type: `spring-boot`, `nodejs`, `mongodb`, `kafka`, `redis`, `postgresql`, `external` |
| `namespace`    | string   | no       | Grouping (rendered as a dashed rectangle)               |
| `integrations` | array    | no       | List of outgoing connections                            |

### Integration fields

| Field    | Type   | Required | Description                                               |
| -------- | ------ | -------- | --------------------------------------------------------- |
| `target` | string | yes      | Target service ID                                         |
| `type`   | string | no       | Type: `REST`, `SOAP`, `gRPC`, `GraphQL`, `pub/sub`, `db`, `cache` |
| `label`  | string | no       | Label on the arrow                                        |

Full example: [`examples/service-schema-example.json`](./examples/service-schema-example.json)

## Keyboard Shortcuts

| Key                  | Action                                  |
| -------------------- | --------------------------------------- |
| `Delete` / `Backspace` | Delete selected node or edge          |
| `Escape`             | Reset mode, clear selection             |

## Project Structure

```
src/
  components/
    Canvas/           # SVG canvas with nodes, edges, and namespace groups
    Toolbar/          # Toolbar (mode switches, buttons, theme toggle)
    Sidebar/          # Properties panel for selected element
    NodeCard/         # Single node visual component
    EdgeLine/         # Edge visual component with integration type badge
    modals/
      AddNodeModal/   # Add node dialog
      ExportModal/    # Export dialog (Mermaid, JSON, PDF)
      ImportModal/    # Import dialog (service-schema, schema-export)
  hooks/
    useGraph.ts       # Graph logic (nodes, edges, CRUD, selection)
    useDrag.ts        # Node drag & drop on SVG canvas
    useKeyboard.ts    # Keyboard shortcuts
  types/
    index.ts          # TypeScript types and interfaces
  constants/
    nodeTypes.ts      # Node type config (colors, icons)
    edgeTypes.ts      # Integration type config
  utils/
    layout.ts         # Auto-layout algorithm (LR direction)
    export.ts         # Export to Mermaid, PDF, schema-export JSON
    import.ts         # Import service-schema and schema-export
    schema.ts         # JSON Schema validation for service-schema
  App.tsx             # Root component
  main.tsx            # Entry point
  index.css           # Global styles and CSS variables for theming
```
