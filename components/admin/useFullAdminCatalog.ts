"use client";

import { useEffect, useState } from "react";
import { useAdminCatalog } from "@/hooks/useAdminCatalog";
import type { Anime } from "@/types/anime";

export function useFullAdminCatalog() {
  const [baseAnime, setBaseAnime] = useState<Anime[]>([]);
  const [baseLoaded, setBaseLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    import("@/data/anime").then((module) => {
      if (!cancelled) {
        setBaseAnime(module.animeCatalog);
        setBaseLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const adminCatalog = useAdminCatalog(baseAnime);

  return {
    ...adminCatalog,
    baseLoaded
  };
}
