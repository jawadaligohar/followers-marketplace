"use client";

import { useEffect, useState } from "react";

export function useServiceIds() {
  const [serviceIdByPlatform, setServiceIdByPlatform] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, string> = {};
        for (const svc of data.services ?? []) {
          map[svc.platformId] = svc._id;
        }
        setServiceIdByPlatform(map);
      })
      .catch(() => {});
  }, []);

  return serviceIdByPlatform;
}
