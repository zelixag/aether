/**
 * Project Creation Logic
 *
 * Handles directory creation and template copying.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { TemplateName } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

/**
 * Get project name from directory path
 */
export function getProjectName(dir: string): string {
  if (dir === '.' || dir === './') {
    return path.basename(process.cwd());
  }
  return path.basename(dir);
}

/**
 * Create project directory
 */
export async function createDirectory(projectName: string): Promise<string> {
  const targetDir = path.join(process.cwd(), projectName);

  try {
    await fs.mkdir(targetDir, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(`Directory "${projectName}" already exists`);
    }
    throw error;
  }

  return targetDir;
}

/**
 * Copy template files to target directory
 */
export async function copyTemplate(templateName: TemplateName, targetDir: string): Promise<void> {
  const templateDir = path.join(TEMPLATES_DIR, templateName);

  // Check if template exists
  try {
    await fs.access(templateDir);
  } catch {
    throw new Error(`Template "${templateName}" not found. Available templates: minimal, minimal-ts, ssr, ssr-ts`);
  }

  // Copy all files from template
  await copyDirectory(templateDir, targetDir);

  // Update package.json with correct project name
  const packageJsonPath = path.join(targetDir, 'package.json');
  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    packageJson.name = path.basename(targetDir);
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  } catch {
    // package.json might not exist in all templates
  }
}

/**
 * Recursively copy directory contents
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}
