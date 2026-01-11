import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import webExtension from 'vite-plugin-web-extension';

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
            })
        ],
        build: {
            outDir: isFirefox ? 'dist-firefox' : 'dist-chrome',
            emptyOutDir: true,
            sourcemap: true,
            minify: false
        }
    };
});
