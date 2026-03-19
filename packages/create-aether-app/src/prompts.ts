/**
 * Interactive Prompts
 *
 * Uses prompts library for interactive CLI experience.
 */

import prompts from 'prompts';
import { getProjectName } from './create.js';
import type { UserAnswers, TemplateName } from './types.js';

/**
 * Collect user answers via interactive prompts
 */
export async function promptUser(initialDir: string, templateOption?: TemplateName): Promise<UserAnswers> {
  const projectName = getProjectName(initialDir);

  const templateIndex = templateOption
    ? (['minimal', 'minimal-ts', 'ssr', 'ssr-ts'] as TemplateName[]).indexOf(templateOption)
    : 0;

  const response = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: projectName,
      validate: (value: string) => {
        if (!/^[a-z0-9-_]+$/i.test(value)) {
          return 'Project name can only contain letters, numbers, hyphens, and underscores';
        }
        return true;
      }
    },
    {
      type: 'select',
      name: 'template',
      message: 'Select a template:',
      choices: [
        {
          title: 'minimal    (Basic Aether project)',
          value: 'minimal',
          description: 'Perfect for learning and small projects'
        },
        {
          title: 'minimal-ts (TypeScript template)',
          value: 'minimal-ts',
          description: 'TypeScript with full type checking'
        },
        {
          title: 'ssr        (Server-side rendering)',
          value: 'ssr',
          description: 'SSR template for SEO-critical applications'
        },
        {
          title: 'ssr-ts     (SSR + TypeScript)',
          value: 'ssr-ts',
          description: 'SSR with TypeScript'
        }
      ],
      initial: templateIndex >= 0 ? templateIndex : 0
    },
    {
      type: 'select',
      name: 'packageManager',
      message: 'Select package manager:',
      choices: [
        { title: 'npm', value: 'npm' },
        { title: 'pnpm', value: 'pnpm' },
        { title: 'yarn', value: 'yarn' }
      ],
      initial: 0
    },
    {
      type: 'confirm',
      name: 'install',
      message: 'Install dependencies?',
      initial: true
    },
    {
      type: 'confirm',
      name: 'git',
      message: 'Initialize git repository?',
      initial: true
    }
  ]);

  return {
    projectName: response.projectName || projectName,
    template: response.template || 'minimal',
    packageManager: response.packageManager || 'npm',
    install: response.install !== false,
    git: response.git !== false
  };
}
