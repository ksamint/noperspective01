// TABLE AI flow atlas on real Perspective (Rust + C++ engine compiled to WebAssembly, TypeScript viewer).
// Data and views are exported from the TABLE AI policy-radar app:
//   bun scripts/export-flows.ts <this folder>/src zhuhai 2030
// The seven views are the same ViewConfigs the app's own pivot runs; here <perspective-viewer> runs them.
// Licensed Apache-2.0 like the rest of this repository.

import perspective from "@perspective-dev/client";
import perspective_viewer from "@perspective-dev/viewer";
import "@perspective-dev/viewer-datagrid";
import "@perspective-dev/viewer-charts";

import "@perspective-dev/viewer/dist/css/themes.css";
import "./index.css";

import SERVER_WASM from "@perspective-dev/server/dist/wasm/perspective-server.wasm";
import CLIENT_WASM from "@perspective-dev/viewer/dist/wasm/perspective-viewer.wasm";

import ROWS from "./flows.json";
import META from "./views.json";

const S = { lang: "zh", qi: 0 };
const QUARTERS = [...new Set(ROWS.map((r) => r.quarter))].sort();
const T_OF = Object.fromEntries(ROWS.map((r) => [r.quarter, r.t]));
S.qi = Math.max(0, QUARTERS.indexOf(`${META.year}Q1`));

const txt = (o) => (S.lang === "en" ? o.en : o.zh);
const UI = {
    title: { zh: "流通全景：区内、跨区、城际与跨境", en: "Flow atlas: within districts, across the city, to other cities and abroad" },
    dek: {
        zh: "七个视图，Perspective 十四种可视化的一半。城内两级来自 TABLE AI 主体级模型；城际、港澳与境外为示意数据。单位：亿元/年。",
        en: "Seven views, half of Perspective's fourteen. In-city levels come from the TABLE AI entity model; other cities, Hong Kong/Macao and abroad are illustrative. Unit: 100m yuan / yr.",
    },
    quarter: { zh: "季度", en: "Quarter" },
};

// Place columns: the data keeps Chinese names in from/to and English in from_en/to_en.
const placeCols = (list) => (S.lang === "en" ? list.map((c) => (c === "to" ? "to_en" : c === "from" ? "from_en" : c)) : list);
function configOf(v) {
    const t = T_OF[QUARTERS[S.qi]];
    const filter = (v.config.filter || []).map((f) => (f[0] === "quarter" ? ["quarter", "==", QUARTERS[S.qi]] : f[0] === "t" ? ["t", "<=", t + 1e-6] : f));
    return {
        ...v.config,
        group_by: placeCols(v.config.group_by || []),
        split_by: placeCols(v.config.split_by || []),
        filter,
        title: txt(v.title),
        settings: false,
        theme: "Pro Light",
    };
}

function renderText() {
    document.documentElement.lang = S.lang === "en" ? "en" : "zh-CN";
    document.getElementById("title").textContent = txt(UI.title);
    document.getElementById("dek").textContent = txt(UI.dek);
    document.getElementById("qlabel").textContent = txt(UI.quarter);
    document.getElementById("qout").textContent = QUARTERS[S.qi];
    document.getElementById("lang").textContent = S.lang === "en" ? "中" : "EN";
    for (const v of META.views) {
        const card = document.querySelector(`[data-view="${v.id}"]`);
        card.querySelector("h2").textContent = txt(v.title);
        card.querySelector("p").textContent = txt(v.note);
    }
}

await perspective_viewer.init({ server: fetch(SERVER_WASM), viewer: fetch(CLIENT_WASM) });
const worker = await perspective.worker();
const table = await worker.table(ROWS, { name: "tds_flows" });

const grid = document.getElementById("grid");
const viewers = [];
for (const v of META.views) {
    const card = document.createElement("section");
    card.className = `card ${["Datagrid", "Heatmap", "Y Bar"].includes(v.plugin) ? "wide" : ""}`;
    card.dataset.view = v.id;
    card.innerHTML = `<div class="h"><h2></h2><span class="plug">${v.plugin}</span></div><p></p>`;
    const viewer = document.createElement("perspective-viewer");
    card.append(viewer);
    grid.append(card);
    viewers.push([v, viewer]);
}
renderText();
await Promise.all(viewers.map(async ([v, viewer]) => { await viewer.load(table); await viewer.restore(configOf(v)); }));

const q = document.getElementById("q");
q.max = String(QUARTERS.length - 1);
q.value = String(S.qi);
q.addEventListener("input", async () => {
    S.qi = Number(q.value);
    document.getElementById("qout").textContent = QUARTERS[S.qi];
    await Promise.all(viewers.map(([v, viewer]) => viewer.restore({ filter: configOf(v).filter })));
});
document.getElementById("lang").addEventListener("click", async () => {
    S.lang = S.lang === "en" ? "zh" : "en";
    renderText();
    await Promise.all(viewers.map(([v, viewer]) => viewer.restore(configOf(v))));
});
