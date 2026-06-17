const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
export const LEGAL_PLACEHOLDER_YOUTUBE_VIDEO_ID = "M7lc1UVf-VE";

export function isValidYouTubeId(videoId: string | undefined): videoId is string {
  return Boolean(videoId && YOUTUBE_ID_PATTERN.test(videoId));
}

export function isPlaceholderYouTubeId(videoId: string | undefined) {
  return videoId === LEGAL_PLACEHOLDER_YOUTUBE_VIDEO_ID;
}

export function isEmbeddableOfficialYouTubeId(
  videoId: string | undefined
): videoId is string {
  return isValidYouTubeId(videoId) && !isPlaceholderYouTubeId(videoId);
}

export function buildYouTubeEmbedUrl(
  videoId: string | undefined,
  playlistId?: string
) {
  const usablePlaylistId =
    playlistId && !playlistId.includes("REPLACE") ? playlistId : undefined;

  if (!isEmbeddableOfficialYouTubeId(videoId)) {
    if (usablePlaylistId) {
      return `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(
        usablePlaylistId
      )}`;
    }

    return null;
  }

  const params = new URLSearchParams();

  if (usablePlaylistId) {
    params.set("list", usablePlaylistId);
  }

  const query = params.toString();

  return `https://www.youtube.com/embed/${videoId}${query ? `?${query}` : ""}`;
}

export function buildYouTubeWatchUrl(videoId: string | undefined, playlistId?: string) {
  const usablePlaylistId =
    playlistId && !playlistId.includes("REPLACE") ? playlistId : undefined;

  if (!isEmbeddableOfficialYouTubeId(videoId)) {
    if (usablePlaylistId) {
      return `https://www.youtube.com/playlist?list=${encodeURIComponent(
        usablePlaylistId
      )}`;
    }

    return null;
  }

  const params = new URLSearchParams({ v: videoId });

  if (usablePlaylistId) {
    params.set("list", usablePlaylistId);
  }

  return `https://www.youtube.com/watch?${params.toString()}`;
}
