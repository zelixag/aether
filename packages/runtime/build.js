// 简单的构建脚本：将 src 合并为单文件
import { readFileSync, writeFileSync } from 'fs';

const signal = readFileSync('src/signal.js', 'utf-8');
const dom = readFileSync('src/dom.js', 'utf-8');
const index = readFileSync('src/index.js', 'utf-8');

// 对于 Phase 1，直接把 src/index.js 作为入口即可
// 后续可以用 Rollup/esbuild 打包
writeFileSync('dist/aether.js', index);
console.log('Runtime built to dist/aether.js');
