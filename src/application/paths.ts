/** Join path parts with forward slashes, dropping empty parts and resolving `.` and `..`. */
export function joinPath(...parts: string[]): string {
  const absolute = parts[0]?.startsWith("/") ?? false;
  const out: string[] = [];
  for (const part of parts.join("/").split("/")) {
    if (part === "" || part === ".") continue;
    if (part === ".." && out.length > 0 && out[out.length - 1] !== "..") out.pop();
    else out.push(part);
  }
  return `${absolute ? "/" : ""}${out.join("/")}`;
}

/** The last segment of a path. */
export function baseName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}
