import { getOctokit, repoParams } from "../_lib/github.mjs";
import { requireSession } from "../_lib/auth.mjs";

// The corpus of admitted essays lives in the vault under _Exemplars/, but the
// desk reads it through this one pre-built index rather than through
// /api/vault/list — that handler fetches a blob per file, and the corpus is
// dozens of files it would never render.
export default async function handler(req, res) {
  if (!(await requireSession(req, res))) return;

  const octokit = getOctokit();
  const { owner, repo } = repoParams();

  let data;
  try {
    ({ data } = await octokit.repos.getContent({ owner, repo, path: "_Exemplars/index.json" }));
  } catch (error) {
    // No corpus yet is a normal state, not a failure: the Exemplars tab just
    // has nothing to show until a sweep has been run for this school.
    if (error.status === 404) {
      res.status(200).json({ exemplars: [], generated: null });
      return;
    }
    throw error;
  }

  const content = Buffer.from(data.content, "base64").toString("utf-8");
  res.status(200).json(JSON.parse(content));
}
