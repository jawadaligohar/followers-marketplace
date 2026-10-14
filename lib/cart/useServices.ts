"use client";

import { useEffect, useMemo, useState } from "react";
import { catalogServiceDocs, type ServiceDoc } from "@/lib/serviceDocs";

const CATALOG_DOCS = catalogServiceDocs();

/**
 * Active services from /api/services. Renders immediately from the static catalog
 * (with empty ids), then swaps in the database copy, which is what checkout charges.
 */
export function useServices() {
  const [services, setServices] = useState<ServiceDoc[]>(CATALOG_DOCS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => {
        if (!r.ok) throw new Error("Unable to load services");
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data.services)) setServices(data.services);
      })
      .catch(() => setServices([]))
      .finally(() => setLoaded(true));
  }, []);

  const bySlug = useMemo(() => new Map(services.map((s) => [s.slug, s])), [services]);

  return { services, bySlug, loaded };
}
