/**
 * Git Initialization
 *
 * Handles git repository setup for new projects.
 */

import { execa } from './vendor.js';

/**
 * Initialize a git repository
 */
export async function initGit(projectDir: string): Promise<void> {
  try {
    // Check if git is available
    await execa('git', ['--version'], { stdio: 'ignore' });
  } catch {
    // Git not available, skip initialization
    return;
  }

  try {
    // Initialize repository
    await execa('git', ['init'], { cwd: projectDir });

    // Create initial commit
    await execa('git', ['add', '.'], { cwd: projectDir });
    await execa('git', ['commit', '-m', 'Initial commit - created with create-aether-app'], {
      cwd: projectDir,
      stdio: 'ignore'
    });
  } catch {
    // Git operations failed, skip
  }
}
