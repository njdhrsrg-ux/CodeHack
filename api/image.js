const imageCache = new Map();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const query = String(req.query?.q || "").trim();
  if (!query || query === "CRIPTOGRAFADA") {
    res.status(400).json({ error: "query required" });
    return;
  }

  const cacheKey = query.toLocaleLowerCase();
  if (imageCache.has(cacheKey)) {
    res.status(200).json(imageCache.get(cacheKey));
    return;
  }

  const pokemon = await pokemonImage(query);
  if (pokemon) return cacheImage(cacheKey, res, { url: pokemon, source: "pokeapi" });

  if (!/\bpokemon\b/i.test(query)) {
    const google = await googleImage(query);
    if (google) return cacheImage(cacheKey, res, { url: google, source: "google" });
  }

  const wiki = await wikiImage(query);
  if (wiki) return cacheImage(cacheKey, res, { url: wiki, source: "wikimedia" });

  return cacheImage(cacheKey, res, { url: null, source: "fallback" });
}

function cacheImage(key, res, payload) {
  imageCache.set(key, payload);
  res.status(200).json(payload);
}

async function googleImage(query) {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) return null;
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", key);
  url.searchParams.set("cx", cx);
  url.searchParams.set("searchType", "image");
  url.searchParams.set("num", "1");
  url.searchParams.set("safe", "active");
  url.searchParams.set("q", query);
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.items?.[0]?.link || null;
  } catch {
    return null;
  }
}

async function pokemonImage(query) {
  if (!/\bpokemon\b/i.test(query)) return null;
  const name = query
    .replace(/\bpokemon\b/ig, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!name) return null;
  const aliases = new Map([
    ["mr-mime", "mr-mime"],
    ["ho-oh", "ho-oh"],
    ["nidoran", "nidoran-f"]
  ]);
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${aliases.get(name) || name}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.sprites?.other?.["official-artwork"]?.front_default || data.sprites?.front_default || null;
  } catch {
    return null;
  }
}

async function wikiImage(query) {
  for (const term of imageSearchTerms(query)) {
    const commons = new URL("https://commons.wikimedia.org/w/api.php");
    commons.searchParams.set("action", "query");
    commons.searchParams.set("generator", "search");
    commons.searchParams.set("gsrsearch", term);
    commons.searchParams.set("gsrnamespace", "6");
    commons.searchParams.set("gsrlimit", "1");
    commons.searchParams.set("prop", "imageinfo");
    commons.searchParams.set("iiprop", "url");
    commons.searchParams.set("format", "json");
    commons.searchParams.set("origin", "*");
    try {
      const response = await fetch(commons);
      if (response.ok) {
        const data = await response.json();
        const page = Object.values(data.query?.pages || {})[0];
        if (page?.imageinfo?.[0]?.url) return page.imageinfo[0].url;
      }
    } catch {
      // Image lookup is best-effort; the game should keep flowing without it.
    }

    const summary = new URL("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(term));
    try {
      const response = await fetch(summary);
      if (!response.ok) continue;
      const data = await response.json();
      if (data.thumbnail?.source) return data.thumbnail.source;
    } catch {
      // Try the next term.
    }
  }
  return null;
}

function imageSearchTerms(query) {
  const trimmed = query.trim();
  const withoutCategory = trimmed.replace(/\s+(geral|anime|pokemon|filme|filmes|jogo|jogos|geek|famosos)$/i, "").trim();
  if (/\s+geral$/i.test(trimmed)) return [...new Set([withoutCategory, trimmed].filter(Boolean))];
  return [...new Set([trimmed, withoutCategory].filter(Boolean))];
}
