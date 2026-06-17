export type KnownAnimeGenre =
  | "Action"
  | "Adventure"
  | "Comedy"
  | "Drama"
  | "Fantasy"
  | "Mecha"
  | "Mystery"
  | "Romance"
  | "Sci-Fi"
  | "Slice of Life"
  | "Sports"
  | "Supernatural"
  | "Official YouTube";

export type AnimeGenre = KnownAnimeGenre | (string & {});

export type KnownAnimeStatus =
  | "Ongoing"
  | "Completed"
  | "Coming Soon";

export type AnimeStatus = KnownAnimeStatus | (string & {});

export type KnownAnimeRating = "All Ages" | "Teen" | "Teen+" | "Mature";

export type AnimeRating = KnownAnimeRating | number | (string & {});

export type VideoSourceType = "youtube" | "gdrive" | "direct" | "manual";

export interface AnimeMetadataCandidate {
  id: string | number;
  title: string;
  englishTitle?: string;
  nativeTitle?: string;
  source: string;
  sourceUrl?: string;
  genres?: string[];
  coverImage?: string;
  bannerImage?: string;
  confidence: number;
}

export interface AnimeSource {
  sourceName: string;
  sourceChannelUrl: string;
  regionNote?: string;
}

export interface AnimeEpisode {
  id: string;
  number: number;
  title: string;
  synopsis: string;
  youtubeVideoId: string;
  youtubePlaylistId?: string;
  officialVideoUrl?: string;
  videoUrl?: string;
  directVideoUrl?: string;
  googleDriveUrl?: string;
  sourceType?: VideoSourceType;
  isHidden?: boolean;
  embeddable?: boolean;
  thumbnail: string;
  duration: string;
  releaseDate: string;
}

export interface Anime extends AnimeSource {
  id: string;
  title: string;
  slug: string;
  originalTitle: string;
  synopsis: string;
  shortSynopsis: string;
  genres: AnimeGenre[];
  year: number;
  status: AnimeStatus;
  studio: string;
  rating: AnimeRating;
  duration: string;
  posterImage: string;
  bannerImage: string;
  cardThumbnail?: string;
  heroImage?: string;
  trailerYoutubeId: string;
  playlistId?: string;
  youtubePlaylistId?: string;
  officialPlaylistUrl?: string;
  importedFrom?: string;
  importedAt?: string;
  metadataSource?: string;
  metadataConfidence?: number;
  metadataNeedsReview?: boolean;
  metadataReviewedAt?: string;
  metadataCandidates?: AnimeMetadataCandidate[];
  isFeatured?: boolean;
  featuredRank?: number;
  isTrending?: boolean;
  trendingRank?: number;
  isOngoingSection?: boolean;
  ongoingRank?: number;
  isHidden?: boolean;
  sourceType?: VideoSourceType;
  episodes: AnimeEpisode[];
  featured?: boolean;
  coverGradient?: [string, string, string];
}
