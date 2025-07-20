import { defineConfig } from 'wxt';
import type { PreRenderedAsset } from 'rollup';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: [
      'declarativeNetRequest',
      'declarativeNetRequestFeedback',
      'cookies','storage', 'tabs', 'scripting', "activeTab"
    ],
    host_permissions: [
      '*://*.twitch.tv/*'
    ],
    web_accessible_resources: [{
      resources: ['accounts.json'],
      matches: ['<all_urls>']
    }]
  },
  browser: 'chrome',
  publicDir: 'public',
  vite: () => ({
    build: {
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo: PreRenderedAsset) => {
            if (assetInfo.name === 'accounts.json') {
              return 'accounts.json';
            }
            return 'assets/[name]-[hash][extname]';
          }
        }
      }
    }
  })
});
