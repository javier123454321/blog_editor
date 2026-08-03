import { config } from '../config'
import { currentBranch, defaultBaseBranch } from './git'

interface GitHubPull {
  number: number
  html_url: string
}

function requireGitHubConfig(): { token: string; owner: string; repo: string } {
  const { token, owner, repo } = config.github
  if (!token || !owner || !repo) {
    throw new Error(
      'GitHub configuration missing (GITHUB_TOKEN, GITHUB_REPO_OWNER, GITHUB_REPO_NAME)',
    )
  }
  return { token, owner, repo }
}

function ghHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

export async function createOrUpdatePullRequest(
  title: string,
  body: string,
): Promise<{ url: string }> {
  const { token, owner, repo } = requireGitHubConfig()
  const head = await currentBranch()
  const base = await defaultBaseBranch()

  const listRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?head=${owner}:${head}&state=open`,
    { headers: ghHeaders(token) },
  )

  if (!listRes.ok) {
    const errorData = (await listRes.json().catch(() => ({}))) as { message?: string }
    throw new Error(
      `Failed to check existing PRs: ${errorData.message || listRes.statusText}`,
    )
  }

  const existingPRs = (await listRes.json()) as GitHubPull[]

  if (existingPRs.length > 0) {
    const existingPR = existingPRs[0]
    const updateRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${existingPR.number}`,
      {
        method: 'PATCH',
        headers: ghHeaders(token),
        body: JSON.stringify({ title, body: body || '' }),
      },
    )

    if (!updateRes.ok) {
      const errorData = (await updateRes.json().catch(() => ({}))) as { message?: string }
      throw new Error(
        `Failed to update PR: ${errorData.message || updateRes.statusText}`,
      )
    }

    const updatedPR = (await updateRes.json()) as GitHubPull
    return { url: updatedPR.html_url }
  }

  const createRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers: ghHeaders(token),
    body: JSON.stringify({
      title,
      body: body || '',
      head,
      base,
    }),
  })

  if (!createRes.ok) {
    const errorData = (await createRes.json().catch(() => ({}))) as { message?: string }
    throw new Error(
      `Failed to create PR: ${errorData.message || createRes.statusText}`,
    )
  }

  const newPR = (await createRes.json()) as GitHubPull
  return { url: newPR.html_url }
}
