import { getOctokit, repoParams } from "../_lib/github.mjs";
import { requireSession } from "../_lib/auth.mjs";
import { applyWordCount } from "../_lib/wordcount.mjs";

export default async function handler(req, res) {
  if (!(await requireSession(req, res))) return;
  if (req.method !== "PUT") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { path, content, sha } = req.body || {};
  if (!path || content == null || !sha) {
    res.status(400).json({ error: "Missing path, content, or sha" });
    return;
  }

  const octokit = getOctokit();
  const { owner, repo } = repoParams();
  const { content: finalContent, wordCount } = applyWordCount(content);

  try {
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Update ${path}`,
      content: Buffer.from(finalContent, "utf-8").toString("base64"),
      sha,
    });
    res.status(200).json({ sha: data.content.sha, wordCount });
  } catch (err) {
    if (err.status === 409 || err.status === 422) {
      res.status(409).json({ error: "This file changed elsewhere - reload before saving." });
      return;
    }
    res.status(500).json({ error: "Save failed" });
  }
}
