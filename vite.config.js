import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import webExtension from 'vite-plugin-web-extension';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

// Plugin to copy build output to /mnt/d/ext
function copyToExtFolder(targetPath) {
  let outDir;

  return {
    name: 'copy-to-ext-folder',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const copyRecursive = (src, dest) => {
        try {
          mkdirSync(dest, { recursive: true });
          const entries = readdirSync(src, { withFileTypes: true });

          for (const entry of entries) {
            const srcPath = join(src, entry.name);
            const destPath = join(dest, entry.name);

            if (entry.isDirectory()) {
              copyRecursive(srcPath, destPath);
            } else {
              copyFileSync(srcPath, destPath);
            }
          }
          console.log(`\n✓ Build copied to ${targetPath}`);
        } catch (error) {
          console.error(`\n✗ Failed to copy to ${targetPath}:`, error.message);
        }
      };

      copyRecursive(outDir, targetPath);
    }
  };
}

export default defineConfig(({ mode }) => {
  const isFirefox = mode === 'firefox';

  return {
    base: './',
    plugins: [
      svelte(),
      webExtension({
        manifest: isFirefox ? 'src/manifest.firefox.json' : 'src/manifest.chrome.json',
        watchFilePaths: ['src/**/*'],
        browser: isFirefox ? 'firefox' : 'chrome'
      }),
      copyToExtFolder('/mnt/d/ext')
    ],
    build: {
      outDir: isFirefox ? 'dist-firefox' : 'dist-chrome',
      emptyOutDir: true,
      sourcemap: true,
      minify: false
    }
  };
});
