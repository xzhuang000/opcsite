import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('vendor',{recursive:true});
await copyFile('node_modules/phaser/dist/phaser.esm.min.js','vendor/phaser.esm.min.js');
await copyFile('node_modules/phaser/LICENSE.md','vendor/PHASER-LICENSE.md');
