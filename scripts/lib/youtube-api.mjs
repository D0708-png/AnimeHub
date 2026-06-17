import fs from "node:fs";
import path from "node:path";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const MAX_RETRIES = 5;
const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getProjectRoot() {
  return process.cwd();
}

export function loadEnv() {
  const envPath = path.join(getProjectRoot(), ".env.local");

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");

      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    }
  }

  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error(
      "Missing YOUTUBE_API_KEY. Create .env.local with YOUTUBE_API_KEY=your_key_here or set it in the process environment."
    );
  }

  return {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY
  };
}

function normalizeEndpoint(endpoint) {
  return endpoint.endsWith(".list") ? endpoint.replace(/\.list$/, "") : endpoint;
}

function describeYouTubeError(errorBody, status) {
  const reason = errorBody?.error?.errors?.[0]?.reason;
  const message = errorBody?.error?.message;

  if (reason === "keyInvalid" || reason === "badRequest") {
    return `YouTube API key appears invalid: ${message ?? "invalid key"}`;
  }

  if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
    return `YouTube API quota exceeded: ${message ?? reason}`;
  }

  if (status === 403 && reason) {
    return `YouTube API access denied (${reason}): ${message ?? "check API key permissions and quota"}`;
  }

  return `YouTube API request failed (${status}): ${message ?? JSON.stringify(errorBody)}`;
}

export async function youtubeRequest(endpoint, params = {}) {
  loadEnv();

  const url = new URL(`${YOUTUBE_API_BASE_URL}/${normalizeEndpoint(endpoint)}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  url.searchParams.set("key", process.env.YOUTUBE_API_KEY);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const response = await fetch(url);
    const body = await response.json().catch(() => ({}));

    if (response.ok) {
      return body;
    }

    if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES - 1) {
      await sleep(750 * 2 ** attempt);
      continue;
    }

    throw new Error(describeYouTubeError(body, response.status));
  }

  throw new Error("YouTube API request failed after retries.");
}

export async function fetchAllPages(endpoint, params = {}) {
  const items = [];
  let pageToken;

  do {
    const response = await youtubeRequest(endpoint, {
      ...params,
      pageToken
    });

    items.push(...(response.items ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return items;
}

function parseChannelUrl(source) {
  const url = source.channelUrl ?? source.sourceChannelUrl;

  if (!url) {
    return {};
  }

  const channelMatch = url.match(/youtube\.com\/channel\/([^/?#]+)/i);
  const handleMatch = url.match(/youtube\.com\/(@[^/?#]+)/i);

  return {
    channelId: channelMatch?.[1],
    channelHandle: handleMatch?.[1]
  };
}

export async function resolveChannel(source) {
  const parsed = parseChannelUrl(source);
  const channelId = source.channelId ?? parsed.channelId;
  const channelHandle = source.channelHandle ?? parsed.channelHandle;
  const params = {
    part: "id,snippet,contentDetails"
  };

  if (channelId) {
    params.id = channelId;
  } else if (channelHandle) {
    params.forHandle = channelHandle.startsWith("@") ? channelHandle : `@${channelHandle}`;
  } else {
    throw new Error(
      `Cannot resolve source "${source.key}". Provide channelId, channelHandle, or channelUrl.`
    );
  }

  const response = await youtubeRequest("channels.list", params);
  const channel = response.items?.[0];

  if (!channel?.id) {
    throw new Error(
      `Could not resolve YouTube channel for source "${source.key}". Check channelId/handle.`
    );
  }

  return channel;
}

export function fetchChannelPlaylists(channelId) {
  return fetchAllPages("playlists.list", {
    part: "id,snippet,contentDetails",
    channelId,
    maxResults: 50
  });
}

export function fetchPlaylistItems(playlistId) {
  return fetchAllPages("playlistItems.list", {
    part: "snippet,contentDetails,status",
    playlistId,
    maxResults: 50
  });
}

export async function fetchVideoDetails(videoIds) {
  const uniqueIds = Array.from(new Set(videoIds.filter(Boolean)));
  const details = [];

  for (const chunk of chunkArray(uniqueIds, 50)) {
    const response = await youtubeRequest("videos.list", {
      part: "snippet,contentDetails,status",
      id: chunk.join(",")
    });

    details.push(...(response.items ?? []));
  }

  return details;
}

export function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export function slugify(text) {
  return safeText(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export function parseIsoDuration(duration) {
  if (!duration || typeof duration !== "string") {
    return "Unknown";
  }

  const match = duration.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);

  if (!match) {
    return "Unknown";
  }

  const [, days, hours, minutes, seconds] = match.map((value) => Number(value ?? 0));
  const parts = [];

  if (days) {
    parts.push(`${days}d`);
  }

  if (hours) {
    parts.push(`${hours}h`);
  }

  if (minutes) {
    parts.push(`${minutes}m`);
  }

  if (seconds && !days) {
    parts.push(`${seconds}s`);
  }

  return parts.length > 0 ? parts.join(" ") : "0s";
}

export function pickBestThumbnail(thumbnails = {}) {
  return (
    thumbnails.maxres?.url ??
    thumbnails.standard?.url ??
    thumbnails.high?.url ??
    thumbnails.medium?.url ??
    thumbnails.default?.url ??
    "/placeholders/banner-default.svg"
  );
}

export function safeText(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .replace(/\u0000/g, "")
    .trim();
}

export function createEpisodeSynopsis(description) {
  const cleaned = String(description ?? "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^https?:\/\//i.test(line) && !/^#/.test(line))
    .join(" ")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/#\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "No episode synopsis available yet.";
  }

  return cleaned.length > 360 ? `${cleaned.slice(0, 357).trim()}...` : cleaned;
}

function inferAnimeStatusFromEpisodes(episodes, now = new Date()) {
  const latestReleaseTime = Math.max(
    0,
    ...episodes
      .map((episode) => new Date(episode.releaseDate).getTime())
      .filter(Boolean)
  );

  if (!latestReleaseTime) {
    return "Ongoing";
  }

  return now.getTime() - latestReleaseTime > EIGHT_DAYS_MS ? "Completed" : "Ongoing";
}

export function matchesFilters(text, includeRegex = [], excludeRegex = []) {
  const value = safeText(text);
  const includes =
    !includeRegex?.length ||
    includeRegex.some((pattern) => new RegExp(pattern, "i").test(value));
  const excludes = Boolean(
    excludeRegex?.length &&
      excludeRegex.some((pattern) => new RegExp(pattern, "i").test(value))
  );

  return includes && !excludes;
}

function isDeletedOrPrivatePlaylistItem(item) {
  const title = safeText(item?.snippet?.title).toLowerCase();
  const privacyStatus = item?.status?.privacyStatus;

  return (
    privacyStatus === "private" ||
    title === "private video" ||
    title === "deleted video" ||
    !item?.contentDetails?.videoId
  );
}

export function createAnimeFromPlaylist(source, playlist, playlistItems, videoDetailsMap) {
  const playlistTitle = safeText(playlist?.snippet?.title);
  const playlistDescription = safeText(playlist?.snippet?.description);
  const importedAt = new Date().toISOString();
  const usableItems = playlistItems
    .filter((item) => !isDeletedOrPrivatePlaylistItem(item))
    .filter((item) => {
      const text = `${item?.snippet?.title ?? ""} ${item?.snippet?.description ?? ""}`;
      return matchesFilters(text, source.videoInclude, source.videoExclude);
    });

  const episodes = usableItems
    .map((item) => {
      const videoId = item.contentDetails?.videoId;
      const details = videoDetailsMap.get(videoId);

      if (!videoId || !details) {
        return null;
      }

      const title = safeText(details.snippet?.title ?? item.snippet?.title);
      const synopsis = createEpisodeSynopsis(
        details.snippet?.description ?? item.snippet?.description
      );

      return {
        id: `${playlist.id}-${videoId}`,
        number: Number(item.snippet?.position ?? 0) + 1,
        title,
        synopsis,
        youtubeVideoId: videoId,
        youtubePlaylistId: playlist.id,
        sourceType: "youtube",
        thumbnail: pickBestThumbnail(details.snippet?.thumbnails ?? item.snippet?.thumbnails),
        duration: parseIsoDuration(details.contentDetails?.duration),
        releaseDate:
          details.snippet?.publishedAt ?? item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt,
        officialVideoUrl: `https://www.youtube.com/watch?v=${videoId}&list=${playlist.id}`,
        embeddable: Boolean(details.status?.embeddable)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.number - b.number);

  if (episodes.length === 0) {
    return null;
  }

  const synopsis =
    playlistDescription ||
    `Official YouTube playlist imported from ${source.name}. Playback remains on YouTube embeds or direct YouTube links.`;
  const firstDate = episodes.find((episode) => episode.releaseDate)?.releaseDate;
  const firstYear = firstDate ? new Date(firstDate).getFullYear() : new Date().getFullYear();
  const firstEmbeddable = episodes.find((episode) => episode.embeddable !== false);

  return {
    id: `${source.key}-${playlist.id}`,
    title: playlistTitle,
    slug: slugify(`${source.key}-${playlistTitle}`),
    originalTitle: playlistTitle,
    synopsis,
    shortSynopsis: synopsis.slice(0, 160),
    genres: source.defaultGenres?.length ? source.defaultGenres : ["Official YouTube"],
    year: Number.isFinite(firstYear) ? firstYear : new Date().getFullYear(),
    status:
      source.defaultStatus === "Coming Soon"
        ? "Coming Soon"
        : inferAnimeStatusFromEpisodes(episodes),
    studio: "Unknown",
    rating: 0,
    duration: episodes[0]?.duration ?? "Unknown",
    sourceName: `${source.name} Official YouTube`,
    sourceChannelUrl: source.sourceChannelUrl,
    sourceType: "youtube",
    posterImage: pickBestThumbnail(playlist.snippet?.thumbnails),
    bannerImage: pickBestThumbnail(playlist.snippet?.thumbnails),
    trailerYoutubeId: firstEmbeddable?.youtubeVideoId ?? "",
    playlistId: playlist.id,
    youtubePlaylistId: playlist.id,
    officialPlaylistUrl: `https://www.youtube.com/playlist?list=${playlist.id}`,
    importedFrom: source.key,
    importedAt,
    episodes
  };
}

export function isUsablePlaylist(source, playlist) {
  const text = `${playlist?.snippet?.title ?? ""} ${playlist?.snippet?.description ?? ""}`;
  return matchesFilters(text, source.playlistInclude, source.playlistExclude);
}

export function isSkippedPlaylistItem(item) {
  return isDeletedOrPrivatePlaylistItem(item);
}
