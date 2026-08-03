import { config } from '../config'
import { runGit } from '../lib/exec'
import { toGitRelativePath } from '../lib/paths'

export interface BranchInfo {
  name: string
  current: boolean
}

export async function listBranches(): Promise<BranchInfo[]> {
  const { stdout } = await runGit(['branch'], config.gitDir)

  return stdout
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const isCurrent = line.startsWith('*')
      const name = line.replace('*', '').trim()
      return { name, current: isCurrent }
    })
}

export async function checkoutBranch(branch: string): Promise<{ branch: string; synced?: boolean; warning?: string }> {
  await runGit(['checkout', branch], config.gitDir)

  try {
    await runGit(['pull', '--ff-only'], config.gitDir)
    return { branch, synced: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      branch,
      warning: `Branch checked out but failed to sync with remote: ${message}`,
    }
  }
}

export async function createBranch(name: string): Promise<{ branch: string }> {
  await runGit(['checkout', '-b', name], config.gitDir)
  return { branch: name }
}

export async function commitAll(message: string): Promise<{ commit: string }> {
  await runGit(['add', '.'], config.gitDir)

  try {
    await runGit(['commit', '-m', message], config.gitDir)
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error)
    if (
      messageText.includes('nothing to commit') ||
      messageText.includes('no changes added')
    ) {
      throw new Error('Nothing to commit')
    }
    throw error
  }

  try {
    const { stdout } = await runGit(['rev-parse', 'HEAD'], config.gitDir)
    return { commit: stdout.trim() }
  } catch {
    return { commit: 'unknown' }
  }
}

export async function push(): Promise<void> {
  await runGit(['push'], config.gitDir)
}

export async function currentBranch(): Promise<string> {
  const { stdout } = await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], config.gitDir)
  return stdout.trim()
}

export async function defaultBaseBranch(): Promise<string> {
  try {
    const { stdout } = await runGit(['remote', 'show', 'origin'], config.gitDir)
    const match = stdout.match(/HEAD branch: (\S+)/)
    if (match) {
      return match[1]
    }
  } catch {
    // fall through
  }
  return 'main'
}

export interface RemoteFileInfo {
  exists: boolean
  content: string | null
}

/** Content of a file as it exists on the origin base branch (e.g. origin/main). */
export async function getRemoteFile(relativePath: string): Promise<RemoteFileInfo> {
  const gitPath = toGitRelativePath(config.gitDir, config.blogDir, relativePath)
  const base = await defaultBaseBranch()

  try {
    const { stdout } = await runGit(['show', `origin/${base}:${gitPath}`], config.gitDir)
    return { exists: true, content: stdout }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (
      message.includes('does not exist') ||
      message.includes('unknown revision') ||
      message.includes('bad revision') ||
      message.includes('invalid object')
    ) {
      return { exists: false, content: null }
    }
    throw error
  }
}

/** Restore a single file to its content on the origin base branch. */
export async function discardFileChanges(relativePath: string): Promise<void> {
  const gitPath = toGitRelativePath(config.gitDir, config.blogDir, relativePath)
  const base = await defaultBaseBranch()
  await runGit(['checkout', `origin/${base}`, '--', gitPath], config.gitDir)
}
