/**
 * highlight-bench.ts
 * Benchmarks the original and improved highlight_span functions.
 * Written by AI assistant (T3 Chat).
 *
 * Usage:
 *   npm install jsdom ts-node typescript @types/jsdom --save-dev
 *   npx ts-node test/highlight-bench.ts
 */

import { JSDOM } from "jsdom";
import { performance } from "perf_hooks";

type ResultStats = {
  min: number;
  avg: number;
  max: number;
};

function stats(values: number[]): ResultStats {
  if (values.length === 0) {
    return { min: 0, avg: 0, max: 0 };
  }
  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const v of values) {
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, avg: sum / values.length, max };
}

/* ---------------------------
   Original function (from user)
   --------------------------- */
// export function original_highlight_span(span: HTMLSpanElement, text: string, selected: boolean) {
//   let regex = new RegExp(`[${text}]`, `gi`);
//   span.innerHTML = span.innerText.replaceAll(regex, (match) => {
//     return `<span class="highlight ${selected ? "selected" : ""}"">${match}</span>`;
//   });
// }
// fixed original_highlight_span: robust to missing innerText and replaceAll
export function original_highlight_span(span: HTMLSpanElement, text: string, selected: boolean) {
  const src = ((span as any).innerText ?? span.textContent ?? "") as string;
  const regex = new RegExp(`[${text}]`, `gi`);
  span.innerHTML = src.replace(regex, (match) => {
    return `<span class="highlight ${selected ? "selected" : ""}">${match}</span>`;
  });
}


/* --------------------------
   Improved function (assistant)
   -------------------------- */
export function improved_highlight_span(span: HTMLSpanElement, text: string, selected: boolean): void {
  const selectedClass = selected ? " selected" : "";

  const escapeForCharClass = (s: string) =>
    s.replace(/[-\\\]^]/g, (m) => `\\${m}`);

  if (!text) return;

  const chars = escapeForCharClass(text);
  const regex = new RegExp("[" + chars + "]+", "gi");

  const children = Array.from(span.childNodes);

  for (const node of children) {
    if (node.nodeType !== node.TEXT_NODE) continue;

    const txt = node.textContent ?? "";
    if (!txt) continue;

    let lastIndex = 0;
    const frag = (span.ownerDocument as Document).createDocumentFragment();
    let m: RegExpExecArray | null;

    regex.lastIndex = 0;
    while ((m = regex.exec(txt))) {
      const start = m.index;
      const matchText = m[0];

      if (start > lastIndex) {
        frag.appendChild((span.ownerDocument as Document).createTextNode(txt.slice(lastIndex, start)));
      }

      const hl = (span.ownerDocument as Document).createElement("span");
      hl.className = "highlight" + selectedClass;
      hl.textContent = matchText;
      frag.appendChild(hl);

      lastIndex = start + matchText.length;
    }

    if (lastIndex < txt.length) {
      frag.appendChild((span.ownerDocument as Document).createTextNode(txt.slice(lastIndex)));
    }

    if (frag.childNodes.length === 0) continue;

    span.replaceChild(frag, node);
  }
}

/* --------------------------
   Benchmark harness
   -------------------------- */

async function runBench() {
  const runs = 10000;
  const dom = new JSDOM(`<body></body>`);
  const doc = dom.window.document;

  // sample input generator: strings with repeated characters and some markup
  function makeSpanWithContent(content: string) {
    const wrapper = doc.createElement("span");
    // include some nested elements to ensure innerHTML-based approach
    const child = doc.createElement("b");
    child.textContent = "B:";
    wrapper.appendChild(child);
    wrapper.appendChild(doc.createTextNode(content));
    return wrapper;
  }

  // varied inputs to avoid optimisations skew
  const inputs: { content: string; text: string; selected: boolean }[] = [];
  for (let i = 0; i < runs; i++) {
    const len = 200 + (i % 50); // vary length a bit
    let s = "";
    for (let j = 0; j < len; j++) {
      const r = Math.random();
      if (r < 0.1) s += "a";
      if (r >= 0.1 && r < 0.2) s += "b";
      if (r >= 0.2 && r < 0.4) s += "c";
      if (r >= 0.4 && r < 0.7) s += "x";
      if (r >= 0.7) s += String.fromCharCode(97 + Math.floor(Math.random() * 26));
    }
    const charsToHighlight = "abcx"; // common case
    inputs.push({ content: s, text: charsToHighlight, selected: (i % 2 === 0) });
  }

  async function measure(fn: (span: HTMLSpanElement, text: string, selected: boolean) => void) {
    const times: number[] = [];
    const memDeltas: number[] = [];

    for (let i = 0; i < runs; i++) {
      const inp = inputs[i];
      const span = makeSpanWithContent(inp.content);

      // warm a tiny bit before measuring
      span.textContent;

      // garbage collection hint (if Node started with --expose-gc)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const globalAny = global as any;
      if (typeof globalAny.gc === "function") {
        globalAny.gc();
      }

      const before = process.memoryUsage().rss;
      const t0 = performance.now();
      fn(span, inp.text, inp.selected);
      const t1 = performance.now();
      const after = process.memoryUsage().rss;

      const dt = t1 - t0;
      const dm = after - before;
      times.push(dt);
      memDeltas.push(dm);

      // tiny await so event loop can breathe
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return { times, memDeltas };
  }

  // run both functions
  console.log("Running original implementation...");
  const orig = await measure(original_highlight_span);

  console.log("Running improved implementation...");
  const improved = await measure(improved_highlight_span);

  // compute stats
  const timeOrig = stats(orig.times);
  const memOrig = stats(orig.memDeltas);

  const timeImp = stats(improved.times);
  const memImp = stats(improved.memDeltas);

  // print report
  console.log("Results (ms and RSS bytes delta):");
  console.log("");
  console.log("Original:");
  console.log(`  time  → min: ${timeOrig.min.toFixed(3)}  avg: ${timeOrig.avg.toFixed(3)}  max: ${timeOrig.max.toFixed(3)}`);
  console.log(`  memory→ min: ${memOrig.min}  avg: ${Math.round(memOrig.avg)}  max: ${memOrig.max}`);
  console.log("");
  console.log("Improved:");
  console.log(`  time  → min: ${timeImp.min.toFixed(3)}  avg: ${timeImp.avg.toFixed(3)}  max: ${timeImp.max.toFixed(3)}`);
  console.log(`  memory→ min: ${memImp.min}  avg: ${Math.round(memImp.avg)}  max: ${memImp.max}`);
  console.log("");

  // relative improvement
  const timeRatio = timeImp.avg / timeOrig.avg;
  const memRatio = (memImp.avg + 0.0001) / (memOrig.avg + 0.0001);
  console.log(`Time ratio (improved / original): ${timeRatio.toFixed(3)}`);
  console.log(`Memory ratio (improved / original): ${memRatio.toFixed(3)}`);
}

runBench().catch((err) => {
  console.error(err);
  process.exit(1);
});
