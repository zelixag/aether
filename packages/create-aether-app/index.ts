/**
 * create-aether-app - Main Entry
 *
 * Orchestrates the project creation process:
 * 1. Display banner
 * 2. Collect user options (prompts or CLI args)
 * 3. Create project directory
 * 4. Copy template files
 * 5. Install dependencies
 * 6. Initialize git (optional)
 * 7. Print success message
 */

import { printBanner, printSuccess, printStep } from './src/print.js';
import { promptUser } from './src/prompts.js';
import { createDirectory, copyTemplate, getProjectName } from './src/create.js';
import { installDependencies } from './src/install.js';
import { initGit } from './src/git.js';

export interface CreateOptions {
  dir?: string;
  template?: string;
  skipPrompts?: boolean;
  skipGit?: boolean;
  skipInstall?: boolean;
}

interface UserAnswers {
  projectName: string;
  template: string;
  packageManager: string;
  install: boolean;
  git: boolean;
}

export async function createProject(options: CreateOptions): Promise<void> {
  const {
    dir = '.',
    template: templateOption,
    skipPrompts = false,
    skipGit = false,
    skipInstall = false
  } = options;

  // Step 1: Display banner
  printBanner();

  // Step 2: Collect user options
  const answers = skipPrompts
    ? getDefaultAnswers(dir, templateOption)
    : await promptUser(dir, templateOption);

  const {
    projectName,
    template,
    packageManager,
    install: shouldInstall,
    git: shouldGit
  } = answers;

  // Step 3: Create project directory
  printStep('Creating project directory...');
  const projectDir = await createDirectory(projectName);

  // Step 4: Copy template files
  printStep(`Downloading ${template} template...`);
  await copyTemplate(template, projectDir);

  // Step 5: Install dependencies
  if (shouldInstall) {
    printStep('Installing dependencies...');
    await installDependencies(projectDir, packageManager);
  }

  // Step 6: Initialize git
  if (shouldGit && !skipGit) {
    printStep('Initializing git repository...');
    await initGit(projectDir);
  }

  // Step 7: Print success message
  printSuccess(projectDir, answers);
}

/**
 * Get default answers for non-interactive mode
 */
function getDefaultAnswers(dir: string | undefined, templateOption: string | undefined): UserAnswers {
  const projectName = getProjectName(dir);

  return {
    projectName,
    template: templateOption || 'minimal',
    packageManager: 'npm',
    install: true,
    git: true
  };
}
