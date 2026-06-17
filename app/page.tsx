import { HomePageClient } from "@/components/HomePageClient";
import { getAllAnime } from "@/lib/anime";

export default function HomePage() {
  return <HomePageClient baseAnime={getAllAnime()} />;
}
