import matter from "gray-matter";
import { getOctokit, repoParams } from "../_lib/github.mjs";
import { requireSession } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (!(await requireSession(req, res))) return;

  const octokit = getOctokit();
  const { owner, repo } = repoParams();

  const { data: repoData } = await octokit.repos.get({ owner, repo });
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${repoData.default_branch}`,
  });
  const { data: tree } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: ref.object.sha,
    recursive: "true",
  });

  // Every match here costs one getBlob below, so the corpus is excluded by path:
  // it is dozens of files that the desk never renders, and it is served instead
  // by /api/exemplars/list from a single pre-built index.
  const mdEntries = tree.tree.filter(
    (entry) =>
      entry.type === "blob" &&
      entry.path.endsWith(".md") &&
      !entry.path.startsWith(".obsidian/") &&
      !entry.path.startsWith("_Exemplars/")
  );

  const files = await Promise.all(
    mdEntries.map(async (entry) => {
      const { data: blob } = await octokit.git.getBlob({ owner, repo, file_sha: entry.sha });
      const content = Buffer.from(blob.content, "base64").toString("utf-8");
      const parsed = matter(content);
      return { path: entry.path, sha: entry.sha, frontmatter: parsed.data };
    })
  );

  res.status(200).json({ files });
}
