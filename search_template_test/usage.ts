import { searchTowers, renderResultSpan, demoData, data, shortTowerName, searched, improvedAcronymQuery, levenshtein } from "./search";

let names = data.map((d) => ({ name: d.toLowerCase(), short: shortTowerName(d).toLowerCase() }))

let spans: Map<string, HTMLSpanElement> = new Map();
function createSpan(span_name: string) {
  const span = document.createElement("span");

  const score = document.createElement("span");
  score.innerText = "";
  const name = document.createElement("span");
  name.innerText = span_name;
  const reason = document.createElement("span");
  reason.innerText = "";

  span.appendChild(score);
  span.appendChild(name);
  span.appendChild(reason);

  spans.set(span_name, span);
  results.appendChild(span);

  return span;
}

/**
 * Highlights a span by creating span children. Uses `innerText` to avoid having to reget the text or do weird stuff.
 * @param span The span to affect.
 * @param text The text to highlight.
 * @param selected To include the optional class for selectedness.
 */
// export function highlight_span(span: HTMLSpanElement, text: string, selected: boolean) {
//   let regex = new RegExp(`[${text}]`, `gi`);
//   span.innerHTML = span.innerText.replaceAll(regex, (match) => {
//     return `<span class="highlight ${selected ? "selected" : ""}"">${match}</span>`;
//   })
// }

/**
 * Improved highlight_span:
 * - faster: operates on text nodes and replaces them directly
 * - fewer spans: groups consecutive matched chars into one span
 * - safer: escapes special regex chars
 *
 * Written by AI assistant (T3 Chat).
 */
export function highlight_span(span: HTMLSpanElement, text: string, selected: boolean): void {
  const selectedClass = selected ? " selected" : "";

  // escape characters for use inside a character class [...]
  const escapeForCharClass = (s: string) =>
    s.replace(/[-\\\]^]/g, (m) => `\\${m}`);

  // nothing to highlight
  if (!text) return;

  const chars = escapeForCharClass(text);
  // match one-or-more of any of the provided characters (case-insensitive)
  const regex = new RegExp("[" + chars + "]+", "gi");

  // Walk child nodes and replace text nodes in-place.
  // We collect nodes first because we'll be mutating the DOM as we go.
  const children = Array.from(span.childNodes);

  for (const node of children) {
    // only process text nodes
    if (node.nodeType !== Node.TEXT_NODE) continue;

    const txt = node.textContent ?? "";
    if (!txt) continue;

    let lastIndex = 0;
    const frag = document.createDocumentFragment();
    let m: RegExpExecArray | null;

    // Reset regex.lastIndex to ensure correct behaviour if same regex reused
    regex.lastIndex = 0;
    while ((m = regex.exec(txt))) {
      const start = m.index;
      const matchText = m[0];

      // text before match
      if (start > lastIndex) {
        frag.appendChild(document.createTextNode(txt.slice(lastIndex, start)));
      }

      // highlighted span for the run of matched chars
      const hl = document.createElement("span");
      hl.className = "highlight" + selectedClass;
      hl.textContent = matchText;
      frag.appendChild(hl);

      lastIndex = start + matchText.length;
    }

    // trailing text after last match
    if (lastIndex < txt.length) {
      frag.appendChild(document.createTextNode(txt.slice(lastIndex)));
    }

    // If there were no matches, skip replacing
    if (frag.childNodes.length === 0) continue;

    // replace the original text node with the fragment
    span.replaceChild(frag, node);
  }
}

function update_ui() {
  // const fragment = document.createDocumentFragment();

  spans.forEach((span) => span.style.order = "10000");

  let results = searchTowers(query.value, names, { minScore: min.valueAsNumber });
  results.forEach((result, index) => {
    let span = spans.get(result.name);
    if (span == undefined) span = createSpan(result.name);
    (span.firstElementChild as HTMLSpanElement).innerText = result.score.toString();
    highlight_span(span.children[1] as HTMLSpanElement, query.value.trim(), false);
    (span.lastElementChild as HTMLSpanElement).innerText = result.reasons.join(", ");
    span.style.order = index.toString();

    // let elm = renderResultSpan(result, query.value);
    // fragment.appendChild(elm);
  });
  count.innerText = `Result count: ${results.length}`;

  // results.innerHTML = "";
  // results.appendChild(fragment);
}

let query: HTMLInputElement;
let min: HTMLInputElement;
// let minVal: HTMLSpanElement;
let results: HTMLDivElement;
let count: HTMLSpanElement;

globalThis.initialise = () => {
  query = document.getElementById('query') as HTMLInputElement;
  min = document.getElementById('minScore') as HTMLInputElement;
  // minVal = document.getElementById("minVal") as HTMLSpanElement;
  results = document.getElementById("results") as HTMLDivElement;
  count = document.getElementById("count") as HTMLSpanElement;

  query.addEventListener('input', (ev) => update_ui());

  min.addEventListener('input', (ev) => {
    // let value = ((ev as InputEvent).target as HTMLInputElement).value;
    // minVal.textContent = value;

    update_ui();
  });

  update_ui();

  // minVal.textContent = min.value;
}

document.addEventListener('DOMContentLoaded', globalThis.initialise);

globalThis.debug = {
  searched,
  improvedAcronymQuery,
  levenshtein
}
