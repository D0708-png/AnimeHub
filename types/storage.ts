export interface WatchHistoryItem {
  id: string;
  animeId: string;
  slug: string;
  animeSlug: string;
  title: string;
  posterImage: string;
  episodeId: string;
  episodeNumber: number;
  episodeTitle: string;
  watchedAt: string;
  youtubeVideoId: string;
}

export interface WatchlistItem {
  id: string;
  animeId: string;
  animeSlug: string;
  addedAt: string;
}

export interface LocalComment {
  id: string;
  animeSlug: string;
  episodeNumber: number;
  username: string;
  userId?: string;
  message: string;
  likes: number;
  likedBy?: string[];
  createdAt: string;
}

export interface SharedComment {
  id: string;
  animeSlug: string;
  episodeNumber: number;
  username: string;
  userId: string;
  message: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
}

export interface UserPreferences {
  compactCards: boolean;
  preferredSubtitleLanguage: string;
  reducedMotion: boolean;
}

export type RatingMap = Record<string, number>;
export type CommentMap = Record<string, LocalComment[]>;
