import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export interface ExecResult {
  stdout: string
  stderr: string
}

export async function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd,
      maxBuffer: 10 * 1024 * 1024,
      encoding: 'utf-8',
    })
    return {
      stdout: stdout ?? '',
      stderr: stderr ?? '',
    }
  } catch (error: unknown) {
    const err = error as {
      message?: string
      stderr?: string
      stdout?: string
      code?: number | string
    }
    const message = err.stderr || err.message || 'Command failed'
    const wrapped = new Error(message.trim())
    ;(wrapped as Error & { code?: number | string }).code = err.code
    ;(wrapped as Error & { stdout?: string }).stdout = err.stdout
    ;(wrapped as Error & { stderr?: string }).stderr = err.stderr
    throw wrapped
  }
}

export function runGit(args: string[], cwd: string): Promise<ExecResult> {
  return runCommand('git', args, cwd)
}
