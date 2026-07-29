import { Octokit } from "@octokit/rest";

let client;

export function getOctokit() {
  if (!client) {
    client = new Octokit({ auth: process.env.GITHUB_TOKEN });
  }
  return client;
}

export function repoParams() {
  return { owner: process.env.GITHUB_OWNER, repo: process.env.GITHUB_REPO };
}
