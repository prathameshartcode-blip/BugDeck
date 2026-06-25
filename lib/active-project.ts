/** Extract project UUID from paths like /projects/{id}/board or /projects/{id}/runtest */
export function getProjectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)(?:\/|$)/);
  if (!match) return null;
  const id = match[1];
  if (id === "projects") return null;
  return id;
}

/** Current project sub-route segment, if any */
export function getProjectSubRoute(pathname: string): "board" | "runtest" | null {
  if (pathname.includes("/runtest")) return "runtest";
  if (pathname.includes("/board")) return "board";
  return null;
}

export function buildProjectPath(projectId: string, subRoute: "board" | "runtest"): string {
  return `/projects/${projectId}/${subRoute}`;
}
