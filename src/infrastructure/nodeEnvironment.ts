import { execFileSync } from "node:child_process";
import type { Environment, RepositoryVisibility } from "../application";
import { parseGitHubUrl } from "../domain";

function run(command: string, args: string[], cwd?: string): string | undefined {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 15_000,
    }).trim();
  } catch {
    return undefined;
  }
}

/** The `Environment` backed by `git` and the GitHub CLI. Anything it cannot find is reported as unknown. */
export const nodeEnvironment: Environment = {
  remoteUrl: (directory) => run("git", ["remote", "get-url", "origin"], directory) || undefined,
  repositoryVisibility(repositoryUrl): RepositoryVisibility {
    const repository = parseGitHubUrl(repositoryUrl);
    if (!repository) return "unknown";
    const answer = run("gh", [
      "repo",
      "view",
      `${repository.owner}/${repository.name}`,
      "--json",
      "visibility",
      "--jq",
      ".visibility",
    ]);
    const value = answer?.toLowerCase();
    return value === "public" || value === "private" || value === "internal" ? value : "unknown";
  },
};
