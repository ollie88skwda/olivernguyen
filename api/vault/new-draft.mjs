import { getOctokit, repoParams } from "../_lib/github.mjs";
import { requireSession } from "../_lib/auth.mjs";

function formatDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}.${dd}`;
}

export default async function handler(req, res) {
  if (!(await requireSession(req, res))) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { draftPath } = req.body || {};
  if (!draftPath) {
    res.status(400).json({ error: "Missing draftPath" });
    return;
  }

  const octokit = getOctokit();
  const { owner, repo } = repoParams();

  const { data } = await octokit.repos.getContent({ owner, repo, path: draftPath });
  if (Array.isArray(data) || data.type !== "file") {
    res.status(400).json({ error: "draftPath must point at the current draft file" });
    return;
  }
  const content = Buffer.from(data.content, "base64").toString("utf-8");

  const versionMatch = content.match(/^version:\s*"?v?(\d+)"?/m);
  if (!versionMatch) {
    res.status(422).json({ error: "Could not read version from frontmatter" });
    return;
  }
  const currentVersion = parseInt(versionMatch[1], 10);
  const nextVersion = currentVersion + 1;
  const dotDate = formatDate(new Date());
  const slashDate = dotDate.replace(".", "/");

  const promptDir = draftPath.split("/").slice(0, -2).join("/");
  const titleMatch = draftPath.split("/").pop().match(/^(.*?)\s+v\d+/);
  if (!titleMatch) {
    res.status(422).json({ error: "Could not read prompt title from filename" });
    return;
  }
  const title = titleMatch[1];

  const newDraftDir = `${promptDir}/Draft v${nextVersion} - ${dotDate}`;
  const newFilePath = `${newDraftDir}/${title} v${nextVersion} - ${dotDate}.md`;
  const changelogPath = `${newDraftDir}/Changelog.md`;

  const updatedContent = content
    .replace(/^(version:\s*"?)v?\d+("?)/m, `$1v${nextVersion}$2`)
    .replace(/^(date:\s*"?)[^"\n]*("?)/m, `$1${slashDate}$2`)
    // The body opens with "# Draft v2 - 07.27 (Leadership)". Cloning without
    // rewriting it leaves every new draft claiming to be the previous version,
    // which is exactly how v3 of Leadership ended up titled v2. Rebuilt from the
    // same values as the filename so an inherited "(Odyssey)" is dropped too.
    .replace(
      /^#\s+Draft v\d+ - \d{2}\.\d{2}.*$/m,
      `# Draft v${nextVersion} - ${dotDate} (${title})`
    );

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: newFilePath,
    message: `New draft: ${newFilePath}`,
    content: Buffer.from(updatedContent, "utf-8").toString("base64"),
  });

  const changelogBody = `# Changelog\n\n## v${nextVersion} - ${dotDate}\n\n_Pending - describe what changed from v${currentVersion}._\n`;
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: changelogPath,
    message: `New draft: ${changelogPath}`,
    content: Buffer.from(changelogBody, "utf-8").toString("base64"),
  });

  res.status(200).json({ newFilePath, changelogPath });
}
