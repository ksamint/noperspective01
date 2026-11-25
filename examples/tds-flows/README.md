# tds-flows: TABLE AI flow atlas on Perspective

Where a city's trusted-data-space deals go — within a district, across districts, to other Chinese cities, to
Hong Kong and Macao, and to clients abroad — in seven Perspective views, half of the fourteen this release ships:

| View | Plugin | Config |
| --- | --- | --- |
| Corridors | Datagrid | group_by scope, to · split_by channel · value, deals, km |
| Where value goes | Treemap | group_by scope, to · value, deals |
| What flows | Sunburst | group_by scope, artifact, from_sector · value |
| Origin–destination | Heatmap | group_by from · split_by to · value |
| Value by quarter | Y Bar | group_by quarter · split_by scope · value |
| Cross-border paths | Y Line | group_by quarter · split_by path · filter scope in hk_macao, overseas |
| Distance and value | X/Y Scatter | group_by to · split_by scope · km, value |

The configs in `src/views.json` are the ones the TABLE AI policy-radar app runs on its own TypeScript pivot
(`src/flows/views.ts` there); here `<perspective-viewer>` runs them on Perspective's WebAssembly engine.

## Data

`src/flows.json` has one row per quarter × scope × provider district × counterpart × provider sector × artefact ×
channel × cross-border path, with `deals`, `value` (100m yuan / yr, annualised) and `km`. Rows inside the city
(`status: "simulated"`) come from the policy-radar entity model. Rows to other cities, Hong Kong and Macao, and
abroad (`status: "mock"`) are **illustrative**: sized from the city's own deal value and the share of entities
connected. Codes (`flow_scope`, `xborder_path`, `artifact`, `sector`) come from the policy-radar ontology; their
Chinese and English labels are in `views.json`.

Regenerate from the policy-radar repository:

```bash
bun scripts/export-flows.ts ../noperspective01/examples/tds-flows/src zhuhai 2030
```

## Run

Like the other examples, this one links to the packages in this repository, so build Perspective first
(Rust nightly, Emscripten and pnpm; see `DEVELOPMENT.md`), then from the repository root:

```bash
pnpm install
pnpm run build
pnpm run start tds-flows
```

The quarter slider re-filters every view; the language button swaps titles and place-name columns
(`from`/`to` ↔ `from_en`/`to_en`). The theme is the TABLE AI design system laid over Pro Light (`src/index.css`).
