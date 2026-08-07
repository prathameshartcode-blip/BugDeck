"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProjectExportConfig } from "@/types/database";
import { getDefaultExportConfig, normalizeExportConfig } from "@/lib/export-columns";

export function useExportConfig(projectId: string) {
  const [config, setConfig] = useState<ProjectExportConfig>(getDefaultExportConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/export-config`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load export configuration");
      setConfig(normalizeExportConfig(json.config));
    } catch {
      setConfig(getDefaultExportConfig());
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = useCallback(
    async (next: ProjectExportConfig) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/export-config`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: next }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to save export configuration");
        const saved = normalizeExportConfig(json.config);
        setConfig(saved);
        return saved;
      } finally {
        setSaving(false);
      }
    },
    [projectId]
  );

  return { config, loading, saving, saveConfig, refetch: fetchConfig };
}
