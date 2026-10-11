import { mkdir, copyFile, cp, rm } from 'node:fs/promises';
// This directory contains only generated build output.
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js']) await copyFile(file, `dist/${file}`);
await cp('assets', 'dist/assets', { recursive: true, filter: path => !path.endsWith('outpost.jpg') && !path.endsWith('outpost.png') });
await cp('src', 'dist/src', { recursive: true });
await cp('vendor', 'dist/vendor', { recursive: true });
console.log('Built playable Z → dist/ (Phaser, self-hosted static assets)');
