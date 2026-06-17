import type { Anime, AnimeEpisode, AnimeSource } from "@/types/anime";
import { generatedAnimeData } from "@/data/generated/anime.generated";

// Replace this legal-friendly placeholder with the exact YouTube video ID
// from an official licensed channel before enabling real episode playback.
export const PLACEHOLDER_YOUTUBE_VIDEO_ID = "M7lc1UVf-VE";

// Replace this optional placeholder with the official YouTube playlist ID,
// or remove youtubePlaylistId from an episode when no playlist applies.
export const PLACEHOLDER_YOUTUBE_PLAYLIST_ID = "";

const POSTER_PLACEHOLDER = "/placeholders/poster-default.svg";
const BANNER_PLACEHOLDER = "/placeholders/banner-default.svg";

const museIndonesiaSource: AnimeSource = {
  sourceName: "Muse Indonesia Official YouTube",
  // Replace this official source URL if Muse Indonesia changes its channel handle.
  sourceChannelUrl: "https://www.youtube.com/@MuseIndonesia",
  regionNote: "Availability depends on Muse Indonesia licensing and YouTube region rules."
};

const aniOneIndonesiaSource: AnimeSource = {
  sourceName: "Ani-One Indonesia Official YouTube",
  // Replace this official source URL if Ani-One Indonesia changes its channel handle.
  sourceChannelUrl: "https://www.youtube.com/@AniOneIndonesia",
  regionNote:
    "Availability depends on Ani-One Indonesia licensing and YouTube region rules."
};

const museAsiaSource: AnimeSource = {
  sourceName: "Muse Asia Official YouTube",
  // Replace this official source URL if Muse Asia changes its channel handle.
  sourceChannelUrl: "https://www.youtube.com/@MuseAsia",
  regionNote: "Availability depends on Muse Asia licensing and YouTube region rules."
};

const aniOneAsiaSource: AnimeSource = {
  sourceName: "Ani-One Asia Official YouTube",
  // Replace this official source URL if Ani-One Asia changes its channel handle.
  sourceChannelUrl: "https://www.youtube.com/@AniOneAsia",
  regionNote: "Availability depends on Ani-One Asia licensing and YouTube region rules."
};

function makeEpisode(
  animeId: string,
  number: number,
  title: string,
  synopsis: string,
  releaseDate: string
): AnimeEpisode {
  return {
    id: `${animeId}-episode-${number}`,
    number,
    title,
    synopsis,
    // Replace youtubeVideoId with the official episode upload ID from the sourceChannelUrl above.
    youtubeVideoId: PLACEHOLDER_YOUTUBE_VIDEO_ID,
    // Replace youtubePlaylistId with the official playlist ID, or delete this field.
    youtubePlaylistId: PLACEHOLDER_YOUTUBE_PLAYLIST_ID || undefined,
    thumbnail: BANNER_PLACEHOLDER,
    duration: "24m",
    releaseDate
  };
}

export const manualAnimeData: Anime[] = [
  {
    id: "anime-starlight-bento",
    title: "Starlight Bento",
    slug: "starlight-bento",
    originalTitle: "Hoshizora Bento",
    synopsis:
      "A small-town lunch club discovers that every family recipe has a memory attached to the night sky. This dummy entry is ready for replacement with a real licensed title and official YouTube IDs.",
    shortSynopsis: "A cozy food club follows recipes tied to constellations.",
    genres: ["Slice of Life", "Comedy"],
    year: 2026,
    status: "Coming Soon",
    studio: "Placeholder Studio",
    rating: "All Ages",
    duration: "24m per episode",
    ...museIndonesiaSource,
    posterImage: POSTER_PLACEHOLDER,
    bannerImage: BANNER_PLACEHOLDER,
    trailerYoutubeId: PLACEHOLDER_YOUTUBE_VIDEO_ID,
    isFeatured: true,
    featuredRank: 1,
    isTrending: true,
    trendingRank: 2,
    featured: true,
    coverGradient: ["#ff4d6d", "#f3c846", "#101114"],
    episodes: [
      makeEpisode(
        "anime-starlight-bento",
        1,
        "The First Lunchbox",
        "Mika joins the after-school lunch club and finds a note written under a star chart.",
        "2026-01-08"
      ),
      makeEpisode(
        "anime-starlight-bento",
        2,
        "Soup for a Cloudy Night",
        "The club recreates a family soup while the town observatory prepares for visitors.",
        "2026-01-15"
      ),
      makeEpisode(
        "anime-starlight-bento",
        3,
        "A Meteor Shower Picnic",
        "A picnic plan becomes the group's first public event.",
        "2026-01-22"
      )
    ]
  },
  {
    id: "anime-sky-rail-sakura",
    title: "Sky Rail Sakura",
    slug: "sky-rail-sakura",
    originalTitle: "Sora Tetsudo Sakura",
    synopsis:
      "A rookie conductor rides a floating railway where each station appears only during cherry blossom season. Replace this dummy title with a licensed catalog entry when official source data is available.",
    shortSynopsis: "A floating railway connects towns during one brief spring.",
    genres: ["Adventure", "Fantasy", "Drama"],
    year: 2025,
    status: "Completed",
    studio: "Placeholder Studio",
    rating: "Teen",
    duration: "24m per episode",
    ...aniOneIndonesiaSource,
    posterImage: POSTER_PLACEHOLDER,
    bannerImage: BANNER_PLACEHOLDER,
    trailerYoutubeId: PLACEHOLDER_YOUTUBE_VIDEO_ID,
    isFeatured: true,
    featuredRank: 2,
    isTrending: true,
    trendingRank: 1,
    featured: true,
    coverGradient: ["#18b7be", "#6d5dfc", "#101114"],
    episodes: [
      makeEpisode(
        "anime-sky-rail-sakura",
        1,
        "Ticket to the Upper Line",
        "Rena boards her first route and learns why the final station is missing.",
        "2025-04-03"
      ),
      makeEpisode(
        "anime-sky-rail-sakura",
        2,
        "Lanterns Above Platform Three",
        "The train stops above a festival that has waited ten years for one passenger.",
        "2025-04-10"
      ),
      makeEpisode(
        "anime-sky-rail-sakura",
        3,
        "Signals in the Petals",
        "A broken signal reveals a message hidden inside the railway schedule.",
        "2025-04-17"
      )
    ]
  },
  {
    id: "anime-cyber-naga-2049",
    title: "Cyber Naga 2049",
    slug: "cyber-naga-2049",
    originalTitle: "Saiba Naga 2049",
    synopsis:
      "A city courier and an ancient digital guardian uncover a conspiracy inside a neon megacity. This is placeholder data only and should be connected to official YouTube uploads before release.",
    shortSynopsis: "A neon courier teams with a digital guardian.",
    genres: ["Action", "Sci-Fi", "Mystery"],
    year: 2024,
    status: "Completed",
    studio: "Placeholder Studio",
    rating: "Teen+",
    duration: "23m per episode",
    ...museAsiaSource,
    posterImage: POSTER_PLACEHOLDER,
    bannerImage: BANNER_PLACEHOLDER,
    trailerYoutubeId: PLACEHOLDER_YOUTUBE_VIDEO_ID,
    isTrending: true,
    trendingRank: 3,
    coverGradient: ["#6d5dfc", "#18b7be", "#101114"],
    episodes: [
      makeEpisode(
        "anime-cyber-naga-2049",
        1,
        "Delivery at Midnight",
        "A courier accepts a sealed chip that begins speaking in an impossible language.",
        "2024-07-06"
      ),
      makeEpisode(
        "anime-cyber-naga-2049",
        2,
        "The Firewall Temple",
        "The city archive opens a forbidden district beneath the central tower.",
        "2024-07-13"
      ),
      makeEpisode(
        "anime-cyber-naga-2049",
        3,
        "Rain on Glass Wings",
        "A chase through the aerial lanes forces the guardian to reveal its origin.",
        "2024-07-20"
      )
    ]
  },
  {
    id: "anime-harbor-witch-academy",
    title: "Harbor Witch Academy",
    slug: "harbor-witch-academy",
    originalTitle: "Minato Majo Gakuen",
    synopsis:
      "Apprentice witches practice weather spells in a seaside school where every mistake changes the tide. Replace every placeholder media field with official licensed YouTube data later.",
    shortSynopsis: "Weather magic, seaside classes, and tide-changing mistakes.",
    genres: ["Fantasy", "Comedy", "Slice of Life"],
    year: 2023,
    status: "Completed",
    studio: "Placeholder Studio",
    rating: "All Ages",
    duration: "24m per episode",
    ...aniOneAsiaSource,
    posterImage: POSTER_PLACEHOLDER,
    bannerImage: BANNER_PLACEHOLDER,
    trailerYoutubeId: PLACEHOLDER_YOUTUBE_VIDEO_ID,
    coverGradient: ["#2a9d8f", "#f3c846", "#264653"],
    episodes: [
      makeEpisode(
        "anime-harbor-witch-academy",
        1,
        "A Broom Above the Breakwater",
        "Nami's first flight lesson sends the whole class drifting toward the lighthouse.",
        "2023-10-02"
      ),
      makeEpisode(
        "anime-harbor-witch-academy",
        2,
        "The Rain Bell Assignment",
        "A homework spell summons sunshine everywhere except the school courtyard.",
        "2023-10-09"
      ),
      makeEpisode(
        "anime-harbor-witch-academy",
        3,
        "Moon Tide Practical",
        "The students must calm the harbor before the moon tide reaches the market.",
        "2023-10-16"
      )
    ]
  },
  {
    id: "anime-goal-line-dreamers",
    title: "Goal Line Dreamers",
    slug: "goal-line-dreamers",
    originalTitle: "Goal Line Dreamers",
    synopsis:
      "An underdog futsal team rebuilds after losing its captain and learns how to win without copying the past. This dummy sports entry uses safe local placeholders and official-channel examples only.",
    shortSynopsis: "An underdog futsal team rebuilds from zero.",
    genres: ["Sports", "Drama", "Comedy"],
    year: 2022,
    status: "Completed",
    studio: "Placeholder Studio",
    rating: "Teen",
    duration: "24m per episode",
    ...museIndonesiaSource,
    posterImage: POSTER_PLACEHOLDER,
    bannerImage: BANNER_PLACEHOLDER,
    trailerYoutubeId: PLACEHOLDER_YOUTUBE_VIDEO_ID,
    coverGradient: ["#f3c846", "#18b7be", "#101114"],
    episodes: [
      makeEpisode(
        "anime-goal-line-dreamers",
        1,
        "Kickoff After Rain",
        "The team returns to practice on a court still marked by last season's loss.",
        "2022-08-05"
      ),
      makeEpisode(
        "anime-goal-line-dreamers",
        2,
        "Two-Touch Promise",
        "A new formation tests the trust between the striker and goalkeeper.",
        "2022-08-12"
      ),
      makeEpisode(
        "anime-goal-line-dreamers",
        3,
        "The Captain's Empty Locker",
        "The team confronts what it means to move forward without forgetting.",
        "2022-08-19"
      )
    ]
  },
  {
    id: "anime-paper-moon-detectives",
    title: "Paper Moon Detectives",
    slug: "paper-moon-detectives",
    originalTitle: "Kami no Tsuki Tantei",
    synopsis:
      "Two student detectives solve gentle supernatural mysteries using paper charms that glow under moonlight. Replace the placeholder IDs with official episode uploads only.",
    shortSynopsis: "Student detectives solve moonlit paper-charm mysteries.",
    genres: ["Mystery", "Supernatural", "Drama"],
    year: 2021,
    status: "Completed",
    studio: "Placeholder Studio",
    rating: "Teen",
    duration: "24m per episode",
    ...aniOneIndonesiaSource,
    posterImage: POSTER_PLACEHOLDER,
    bannerImage: BANNER_PLACEHOLDER,
    trailerYoutubeId: PLACEHOLDER_YOUTUBE_VIDEO_ID,
    coverGradient: ["#101114", "#6d5dfc", "#f9fafb"],
    episodes: [
      makeEpisode(
        "anime-paper-moon-detectives",
        1,
        "The Bookmark Vanishes",
        "A missing library bookmark points to a staircase that appears only at night.",
        "2021-02-11"
      ),
      makeEpisode(
        "anime-paper-moon-detectives",
        2,
        "Origami Footprints",
        "Paper cranes lead the detectives to an empty classroom with a hidden song.",
        "2021-02-18"
      ),
      makeEpisode(
        "anime-paper-moon-detectives",
        3,
        "Moonlight Case File",
        "A case file writes itself as the pair follows a trail across the rooftop.",
        "2021-02-25"
      )
    ]
  },
  {
    id: "anime-mecha-orchid-unit",
    title: "Mecha Orchid Unit",
    slug: "mecha-orchid-unit",
    originalTitle: "Kikai Ran Unit",
    synopsis:
      "Pilots protect floating gardens in bio-mechanical suits grown from rare orchids. This is fictional seed data for the local catalog model.",
    shortSynopsis: "Bio-mecha pilots defend floating orchid gardens.",
    genres: ["Mecha", "Action", "Sci-Fi"],
    year: 2020,
    status: "Completed",
    studio: "Placeholder Studio",
    rating: "Teen+",
    duration: "24m per episode",
    ...museAsiaSource,
    posterImage: POSTER_PLACEHOLDER,
    bannerImage: BANNER_PLACEHOLDER,
    trailerYoutubeId: PLACEHOLDER_YOUTUBE_VIDEO_ID,
    coverGradient: ["#ff4d6d", "#6d5dfc", "#18b7be"],
    episodes: [
      makeEpisode(
        "anime-mecha-orchid-unit",
        1,
        "Bloom Frame Launch",
        "A trainee pilot bonds with a dormant orchid frame during a surprise attack.",
        "2020-05-03"
      ),
      makeEpisode(
        "anime-mecha-orchid-unit",
        2,
        "Roots in the Hangar",
        "The team discovers that the machines respond to more than commands.",
        "2020-05-10"
      ),
      makeEpisode(
        "anime-mecha-orchid-unit",
        3,
        "Petal Shield",
        "The first full sortie tests the unit's new defensive formation.",
        "2020-05-17"
      )
    ]
  },
  {
    id: "anime-komodo-cafe-days",
    title: "Komodo Cafe Days",
    slug: "komodo-cafe-days",
    originalTitle: "Komodo Cafe Days",
    synopsis:
      "A seaside cafe becomes a meeting point for travelers, students, and tiny everyday miracles. Use this dummy entry as a friendly template for legal official-source replacement.",
    shortSynopsis: "A seaside cafe gathers travelers and everyday miracles.",
    genres: ["Slice of Life", "Romance", "Comedy"],
    year: 2019,
    status: "Completed",
    studio: "Placeholder Studio",
    rating: "All Ages",
    duration: "24m per episode",
    ...aniOneIndonesiaSource,
    posterImage: POSTER_PLACEHOLDER,
    bannerImage: BANNER_PLACEHOLDER,
    trailerYoutubeId: PLACEHOLDER_YOUTUBE_VIDEO_ID,
    coverGradient: ["#18b7be", "#f9fafb", "#f3c846"],
    episodes: [
      makeEpisode(
        "anime-komodo-cafe-days",
        1,
        "The Table by the Window",
        "A quiet cafe seat becomes important to three people on the same rainy day.",
        "2019-11-01"
      ),
      makeEpisode(
        "anime-komodo-cafe-days",
        2,
        "A Recipe Written in Pencil",
        "The staff searches for an old dessert recipe before the weekend rush.",
        "2019-11-08"
      ),
      makeEpisode(
        "anime-komodo-cafe-days",
        3,
        "Sunset Blend",
        "A regular customer asks for help preparing a goodbye message.",
        "2019-11-15"
      )
    ]
  }
];

export const animeCatalog: Anime[] = [...manualAnimeData, ...generatedAnimeData];
