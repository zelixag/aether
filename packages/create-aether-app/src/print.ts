/**
 * Terminal Output Utilities
 *
 * Handles all console output with styled ASCII art and colored text.
 */

import kleur from 'kleur';
import type { UserAnswers } from './types.js';

/**
 * Print the Aether ASCII art banner
 */
export function printBanner(): void {
  console.log(`
${kleur.cyan().bold('    █▀▀█ ▀▀█▀▀ █▀▀█ █▀▀▀ █▄─░█')}
${kleur.cyan().bold('    █▄▄█ ─░█── █▄▄▀ ──▀▀▄ █░█░█')}
${kleur.cyan().bold('    █─░█ ─░█── █─░█ ░█▄▄▀ █──▀')}
${kleur.reset()}
${kleur.bold().white('    AI-Friendly Reactive Framework')}
${kleur.reset()}
`);
}

/**
 * Print a step in the creation process
 */
export function printStep(message: string): void {
  console.log(`${kleur.gray('  >')} ${kleur.white(message)}`);
}

/**
 * Print a success message with checkmark
 */
export function printSuccessMessage(message: string): void {
  console.log(`${kleur.green().bold('  ✓')} ${kleur.green(message)}`);
}

/**
 * Print an error message
 */
export function printError(message: string): void {
  console.error(`${kleur.red().bold('  ✗')} ${kleur.red(message)}`);
}

/**
 * Print the final success message and usage instructions
 */
export function printSuccess(projectDir: string, answers: UserAnswers): void {
  console.log(`
${kleur.green().bold('  Project created successfully!')}
${kleur.reset()}
${kleur.gray('  ─────────────────────────────')}
${kleur.reset()}
  ${kleur.white('Directory:')} ${kleur.bold().cyan(projectDir)}
  ${kleur.white('Template:')}  ${kleur.bold().cyan(answers.template)}
  ${kleur.white('Package Manager:')} ${kleur.bold().cyan(answers.packageManager)}

${kleur.reset()}
  ${kleur.white('To get started:')}
  ${kleur.reset()}
    ${kleur.gray('$')} ${kleur.bold(`cd ${projectDir}`)}
    ${kleur.gray('$')} ${kleur.bold(`${answers.packageManager} run dev`)}
${kleur.reset()}
`);
}

/**
 * Print an error and exit
 */
export function printFatal(message: string): never {
  printError(message);
  process.exit(1);
}
