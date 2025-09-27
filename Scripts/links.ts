// Written by an AI assistant (T3 Chat).
// Replace any link-like value found anywhere under a root node.
//
// Usage examples:
// replaceAllLinks(document.body, '/test/')
// replaceAllLinks(document, (href, el, attr) => '/test/' + href)
export function replaceAllLinks(
  root: ParentNode,
  transform: string | ((href: string, el?: Element, attrName?: string) => string | null | undefined)
): number {
  if (!root || !('querySelectorAll' in root)) return 0;
  const isPrefix = typeof transform === 'string';
  const transformFn = isPrefix
    ? (h: string) => (transform as string) + h.replace(/^\/+/, '')
    : (h: string, el?: Element, attr?: string) =>
      (transform as (href: string, el?: Element, attrName?: string) => string | null | undefined)(
        h,
        el,
        attr
      );

  const absoluteOrProtocolRelative = /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/;
  const skipSchemes = /^(?:#|mailto:|javascript:)/i;

  let changed = 0;

  // Helpers
  function shouldSkipHref(href: string) {
    return !href || absoluteOrProtocolRelative.test(href) || skipSchemes.test(href);
  }

  function replaceIfNeeded(original: string, el?: Element, attr?: string) {
    if (shouldSkipHref(original)) return null;
    const candidate = transformFn(original, el, attr) as string | null | undefined;
    if (!candidate || candidate === original) return null;
    return candidate;
  }

  function processAttribute(el: Element, name: string, value: string) {
    const attrName = name.toLowerCase();

    // srcset: multiple entries "url 1x, url2 2x"
    if (attrName === 'srcset') {
      const parts = value.split(',').map((p) => p.trim());
      const out = parts
        .map((part) => {
          const spaceIdx = part.indexOf(' ');
          const url = spaceIdx === -1 ? part : part.slice(0, spaceIdx);
          const descriptor = spaceIdx === -1 ? '' : part.slice(spaceIdx);
          const replaced = replaceIfNeeded(url, el, name);
          return (replaced ?? url) + descriptor;
        })
        .join(', ');
      if (out !== value) {
        el.setAttribute(name, out);
        changed++;
      }
      return;
    }

    // style attribute: look for url(...) occurrences
    if (attrName === 'style') {
      let out = value;
      const urlRegex = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
      out = out.replace(urlRegex, (match, quote, url) => {
        const replaced = replaceIfNeeded(url, el, name);
        return replaced ? `url(${quote}${replaced}${quote})` : match;
      });
      if (out !== value) {
        el.setAttribute(name, out);
        changed++;
      }
      return;
    }

    // meta refresh: content like "5;url=/path"
    if (el.tagName.toLowerCase() === 'meta' && attrName === 'content') {
      const metaRefresh = value.replace(/(;\s*url=)([^;]+)/i, (m, p1, url) => {
        const replaced = replaceIfNeeded(url.trim(), el, name);
        return replaced ? p1 + replaced : m;
      });
      if (metaRefresh !== value) {
        el.setAttribute(name, metaRefresh);
        changed++;
      }
      return;
    }

    // Generic single URL attributes: if the entire value looks like a single URL/path
    // (most attributes fall here: href, src, action, data-*, formaction, poster, data attributes, etc.)
    const singleCandidate = value.trim();
    const replaced = replaceIfNeeded(singleCandidate, el, name);
    if (replaced) {
      el.setAttribute(name, replaced);
      changed++;
    }
  }

  // Walk all elements and examine attributes
  const all = Array.from(root.querySelectorAll('*')) as Element[];
  all.forEach((el) => {
    const attrs = Array.from(el.attributes);
    attrs.forEach((a) => {
      processAttribute(el, a.name, a.value);
    });
  });

  // Also check the root itself if it's an Element (e.g. documentElement or body passed directly)
  if ((root as Element).attributes) {
    const rootEl = root as Element;
    const rootAttrs = Array.from(rootEl.attributes || []);
    rootAttrs.forEach((a) => processAttribute(rootEl, a.name, a.value));
  }

  return changed;
}
