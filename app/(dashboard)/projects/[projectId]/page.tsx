"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * This page used to host a legacy board view.
 * The board has moved to /projects/[projectId]/board
 * Redirect immediately so old links still work.
 */
export default function ProjectRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  useEffect(() => {
    router.replace(`/projects/${projectId}/board`);
  }, [projectId, router]);

  return (
    <div className="flex h-60 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
