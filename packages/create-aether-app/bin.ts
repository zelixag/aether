#!/usr/bin/env node

/**
 * create-aether-app CLI Entry Point
 */

import cac from 'cac';
import { createProject } from './index.js';

interface CreateOptions {
  template?: string;
  yes?: boolean;
  noGit?: boolean;
  noInstall?: boolean;
}

const cli = cac('create-aether-app');

cli
  .command('[dir]', 'Create a new Aether project')
  .option('-t, --template <name>', 'Choose a template (minimal, minimal-ts, ssr, ssr-ts)')
  .option('-y, --yes', 'Skip all interactive prompts and use defaults')
  .option('--no-git', 'Skip git initialization')
  .option('--no-install', 'Skip dependency installation')
  .action(async (dir: string | undefined, options: CreateOptions) => {
    try {
      await createProject({
        dir: dir || '.',
        template: options.template,
        skipPrompts: options.yes,
        skipGit: options.noGit,
        skipInstall: options.noInstall
      });
    } catch (error) {
      console.error('\n Error:', (error as Error).message);
      process.exit(1);
    }
  });

cli.help(() => {
  return `
  Aether CLI - AI-Friendly Reactive Framework

  Usage:
    $ npm create aether-app [dir]        Create a new project
    $ npm create aether-app --template minimal-ts  Use specific template

  Templates:
    minimal      Basic Aether project (default)
    minimal-ts   TypeScript template
    ssr          SSR template
    ssr-ts       SSR with TypeScript

  Options:
    -t, --template <name>   Select template
    -y, --yes               Skip all prompts
    --no-git                Skip git initialization
    --no-install            Skip dependency installation

  Examples:
    $ npm create aether-app my-app
    $ npm create aether-app my-app --template minimal-ts
    $ npm create aether-app --yes
  `;
});

cli.version('0.2.0');
cli.parse();
