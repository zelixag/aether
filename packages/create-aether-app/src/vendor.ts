/**
 * Vendor utilities - simple wrappers around Node.js APIs
 *
 * Provides execa-like functionality using native child_process.
 */

import { exec as nodeExec, ChildProcess } from 'child_process';
import { promisify } from 'util';
import type { ExecOptions, ExecResult } from './types.js';

const exec = promisify(nodeExec);

/**
 * Execute a command and return a promise
 */
export async function execa(command: string, args: string[], options: ExecOptions = {}): Promise<ExecResult> {
  const fullCommand = `${command} ${args.join(' ')}`;

  return new Promise((resolve, reject) => {
    const child: ChildProcess = nodeExec(fullCommand, {
      cwd: options.cwd,
      stdio: options.stdio || 'pipe',
      shell: options.shell ?? true
    });

    if (options.stdio === 'inherit') {
      child.stdout?.pipe(process.stdout);
      child.stderr?.pipe(process.stderr);
    }

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: string) => {
      stdout += data;
    });

    child.stderr?.on('data', (data: string) => {
      stderr += data;
    });

    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${stderr || stdout}`));
      }
    });

    child.on('error', (error: Error) => {
      reject(error);
    });
  });
}
