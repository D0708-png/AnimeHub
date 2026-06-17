const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";
const DEFAULT_CONFIDENCE_THRESHOLD = 0.82;
const MAX_RETRIES = 4;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeText(text) {
  return String(text ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanAnimeSearchTitle(title) {
  return safeText(title)
    .replace(/\[[^\]]*]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/【[^】]*】/g, " ")
    .replace(/\b(Muse Indonesia|Ani-One Indonesia|Ani One Indonesia|Muse Asia|Ani-One Asia)\b/gi, " ")
    .replace(/\b(official|youtube|playlist|full episode|episode|episodes|eps?|sub indo|subtitle indonesia|indonesia subtitle|indo sub|dub indo)\b/gi, " ")
    .replace(/\b(season|cour|part|s\d+|ep\d+|e\d+)\b/gi, " ")
    .replace(/\b(live|livestream|event|announcement|teaser|promo|trailer|shorts?|music|opening|ending|ost|karaoke|concert|stage|radio|interview|compilation|recap|news|special program)\b/gi, " ")
    .replace(/[|:,_/\\-]+/g, " ")
    .replace(/\s+\d{1,3}\s*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(text) {
  return safeText(text)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|season|part|official)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  if (a === b) {
    return 0;
  }

  if (!a.length) {
    return b.length;
  }

  if (!b.length) {
    return a.length;
  }

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function tokenScore(query, title) {
  const queryTokens = new Set(normalizeTitle(query).split(" ").filter(Boolean));
  const titleTokens = new Set(normalizeTitle(title).split(" ").filter(Boolean));

  if (queryTokens.size === 0 || titleTokens.size === 0) {
    return 0;
  }

  let shared = 0;

  for (const token of queryTokens) {
    if (titleTokens.has(token)) {
      shared += 1;
    }
  }

  return shared / Math.max(queryTokens.size, titleTokens.size);
}

function titleSimilarity(query, candidateTitle) {
  const normalizedQuery = normalizeTitle(query);
  const normalizedCandidate = normalizeTitle(candidateTitle);

  if (!normalizedQuery || !normalizedCandidate) {
    return 0;
  }

  if (normalizedQuery === normalizedCandidate) {
    return 1;
  }

  if (
    normalizedCandidate.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedCandidate)
  ) {
    return 0.9;
  }

  const distance = levenshtein(normalizedQuery, normalizedCandidate);
  const editScore = 1 - distance / Math.max(normalizedQuery.length, normalizedCandidate.length);

  return Math.max(0, Math.min(1, editScore * 0.55 + tokenScore(query, candidateTitle) * 0.45));
}

function scoreCandidate(query, media) {
  const titles = [
    media.title?.romaji,
    media.title?.english,
    media.title?.native,
    media.title?.userPreferred
  ].filter(Boolean);

  return Math.max(0, ...titles.map((title) => titleSimilarity(query, title)));
}

async function anilistRequest(query, variables) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const response = await fetch(ANILIST_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ query, variables })
    });
    const body = await response.json().catch(() => ({}));

    if (response.ok && !body.errors) {
      return body.data;
    }

    if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES - 1) {
      await sleep(750 * 2 ** attempt);
      continue;
    }

    const message = body.errors?.[0]?.message ?? `AniList metadata request failed (${response.status})`;
    throw new Error(message);
  }

  throw new Error("AniList metadata request failed after retries.");
}

function toMetadataCandidate(media, confidence) {
  return {
    id: media.id,
    title: media.title?.romaji ?? media.title?.userPreferred ?? "Untitled anime",
    englishTitle: media.title?.english ?? undefined,
    nativeTitle: media.title?.native ?? undefined,
    source: "AniList",
    sourceUrl: media.siteUrl,
    genres: media.genres ?? [],
    coverImage: media.coverImage?.extraLarge ?? media.coverImage?.large ?? media.coverImage?.medium,
    bannerImage: media.bannerImage ?? undefined,
    confidence: Number(confidence.toFixed(3))
  };
}

export async function searchAnimeMetadata(title) {
  const queryTitle = cleanAnimeSearchTitle(title) || safeText(title);

  if (!queryTitle) {
    return [];
  }

  const query = `
    query SearchAnimeMetadata($search: String!) {
      Page(page: 1, perPage: 6) {
        media(type: ANIME, search: $search, sort: SEARCH_MATCH) {
          id
          title {
            romaji
            english
            native
            userPreferred
          }
          description(asHtml: false)
          genres
          coverImage {
            extraLarge
            large
            medium
          }
          bannerImage
          siteUrl
        }
      }
    }
  `;

  const data = await anilistRequest(query, { search: queryTitle });
  const candidates = (data?.Page?.media ?? [])
    .map((media) => ({
      media,
      confidence: scoreCandidate(queryTitle, media)
    }))
    .sort((a, b) => b.confidence - a.confidence);

  return candidates.map(({ media, confidence }) => ({
    ...toMetadataCandidate(media, confidence),
    synopsis: safeText(media.description)
  }));
}

export async function enrichAnimeMetadata(anime, options = {}) {
  const threshold = options.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
  const candidates = await searchAnimeMetadata(anime.title);
  const best = candidates[0];
  const metadataCandidates = candidates.slice(0, 3).map((candidate) => ({
    id: candidate.id,
    title: candidate.title,
    englishTitle: candidate.englishTitle,
    nativeTitle: candidate.nativeTitle,
    source: candidate.source,
    sourceUrl: candidate.sourceUrl,
    genres: candidate.genres,
    coverImage: candidate.coverImage,
    bannerImage: candidate.bannerImage,
    confidence: candidate.confidence
  }));

  if (!best || best.confidence < threshold) {
    return {
      ...anime,
      metadataSource: best?.source,
      metadataConfidence: best?.confidence ?? 0,
      metadataNeedsReview: true,
      metadataCandidates
    };
  }

  const synopsis = best.synopsis || anime.synopsis;
  const posterImage = best.coverImage || anime.posterImage;
  const bannerImage = best.bannerImage || anime.bannerImage;

  return {
    ...anime,
    synopsis,
    shortSynopsis: synopsis ? synopsis.slice(0, 160) : anime.shortSynopsis,
    genres: best.genres?.length ? best.genres : anime.genres,
    posterImage,
    cardThumbnail: best.coverImage || anime.cardThumbnail || posterImage,
    bannerImage,
    heroImage: best.bannerImage || anime.heroImage || bannerImage,
    metadataSource: best.source,
    metadataConfidence: best.confidence,
    metadataNeedsReview: false,
    metadataCandidates
  };
}

export async function enrichAnimeCatalog(animeList, options = {}) {
  const enriched = [];

  for (const anime of animeList) {
    enriched.push(await enrichAnimeMetadata(anime, options));
  }

  return enriched;
}
