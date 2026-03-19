/**
 * Dependency Installation
 *
 * Handles npm/pnpm/yarn dependency installation.
 */

import { execa } from './vendor.js';
import type { PackageManager, PackageManagerConfig } from './types.js';

const PACKAGE_MANAGERS: Record<PackageManager, PackageManagerConfig> = {
  npm: {
    install: ['npm', 'install'],
    devInstall: ['npm', 'install', '-D']
  },
  pnpm: {
    install: ['pnpm', 'install'],
    devInstall: ['pnpm', 'add', '-D']
  },
  yarn: {
    install: ['yarn', 'install'],
    devInstall: ['yarn', 'add', '-D']
  }
};

/**
 * Install dependencies using the specified package manager
 */
export async function installDependencies(projectDir: string, packageManager: PackageManager = 'npm'): Promise<void> {
  const pm = PACKAGE_MANAGERS[packageManager];

  if (!pm) {
    throw new Error(`Unsupported package manager: ${packageManager}`);
  }

  try {
    await execa(pm.install[0], pm.install.slice(1), {
      cwd: projectDir,
      stdio: 'inherit'
    });
  } catch (error) {
    throw new Error(`Failed to install dependencies: ${(error as Error).message}`);
  }
}
