"use client";

import { useMemo } from "react";
import { getPublicCatalog } from "@/lib/catalog";
import type { Anime } from "@/types/anime";
import { useAdminCatalog } from "./useAdminCatalog";

interface UseCatalogOptions {
  includeHidden?: boolean;
}

export function useCatalog(baseCatalog: Anime[], options: UseCatalogOptions = {}) {
  const adminCatalog = useAdminCatalog(baseCatalog);
  const catalog = useMemo(
    () =>
      options.includeHidden
        ? adminCatalog.catalog
        : getPublicCatalog(adminCatalog.catalog),
    [adminCatalog.catalog, options.includeHidden]
  );

  return {
    ...adminCatalog,
    catalog
  };
}
