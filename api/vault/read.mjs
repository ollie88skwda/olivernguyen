import matter from "gray-matter";
import { getOctokit, repoParams } from "../_lib/github.mjs";
import { requireSession } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (!(await requireSession(req, res))) return;

  const { path } = req.query;
  if (!path) {
    res.status(400).json({ error: "Missing path" });
    return;
  }

  const octokit = getOctokit();
  const { owner, repo } = repoParams();
  const { data } = await octokit.repos.getContent({ owner, repo, path });

  if (Array.isArray(data) || data.type !== "file") {
    res.status(400).json({ error: "Not a file" });
    return;
  }

  const content = Buffer.from(data.content, "base64").toString("utf-8");
  const parsed = matter(content);

  res.status(200).json({
    path,
    sha: data.sha,
    frontmatter: parsed.data,
    body: parsed.content,
    raw: content,
  });
}
