/**
 * Type definitions for create-aether-app
 */

/**
 * Template names available for project creation
 */
export type TemplateName = 'minimal' | 'minimal-ts' | 'ssr' | 'ssr-ts';

/**
 * Supported package managers
 */
export type PackageManager = 'npm' | 'pnpm' | 'yarn';

/**
 * CLI options for creating a project
 */
export interface CreateOptions {
  /** Target directory for the project */
  dir: string;
  /** Template name to use */
  template?: TemplateName;
  /** Skip interactive prompts */
  skipPrompts?: boolean;
  /** Skip git initialization */
  skipGit?: boolean;
  /** Skip dependency installation */
  skipInstall?: boolean;
}

/**
 * User answers collected from prompts or defaults
 */
export interface UserAnswers {
  /** Project name */
  projectName: string;
  /** Selected template */
  template: TemplateName;
  /** Package manager to use */
  packageManager: PackageManager;
  /** Whether to install dependencies */
  install: boolean;
  /** Whether to initialize git */
  git: boolean;
}

/**
 * CLI options parsed from cac
 */
export interface CliOptions {
  template?: TemplateName;
  yes?: boolean;
  noGit?: boolean;
  noInstall?: boolean;
}

/**
 * Result from executing a command
 */
export interface ExecResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

/**
 * Options for execa function
 */
export interface ExecOptions {
  cwd?: string;
  stdio?: 'pipe' | 'inherit';
  shell?: boolean;
}

/**
 * Template choice for prompts
 */
export interface TemplateChoice {
  title: string;
  value: TemplateName;
  description: string;
}

/**
 * Package manager configuration
 */
export interface PackageManagerConfig {
  install: string[];
  devInstall: string[];
}
