import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import autoprefixer from 'autoprefixer';
import { fileURLToPath, URL } from 'node:url';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
// import { createSvgPlugin } from "vite-plugin-vue2-svg";
// import svgLoader from 'vite-svg-loader';
import federation from '@originjs/vite-plugin-federation';
import { IconsAutoImport, CyIconResolver } from './src/utils/IconsPlugin';
import { CyfaResolver } from '@cyware/cy-frontend-framework-v3/resolver';

function getMfaRemotes(mfaList) {
  const random = Math.floor(Math.random() * 10000000000);
  const remotes = JSON.parse(mfaList) || {};
  for (const i in remotes) {
    remotes[i] = `${remotes[i]}?v=${random}`;
  }
  return remotes;
}

function getBasePath(baseSlug: string) {
  if (process.env.VITE_USER_NODE_ENV === 'development' && process.env.NODE_ENV === 'production') {
    return `${process.env.VITE_PREVIEW_URL || ''}${baseSlug}`;
  } else {
    return baseSlug;
  }
}

export default ({ mode }) => {
  process.env = {
    ...process.env,
    ...loadEnv(mode, process.cwd()),
    VITE_APP_VERSION: require('./package.json').version
  };
  const remotes = getMfaRemotes(process.env.VITE_MFA);

  return defineConfig({
    define: {
      'process.env': process.env
    },
    plugins: [
      vue(),
      viteCommonjs(),
      // svgLoader(),
      IconsAutoImport(),
      AutoImport({
        resolvers: [ElementPlusResolver()]
      }),
      Components({
        resolvers: [CyIconResolver(), CyfaResolver(), ElementPlusResolver()]
      }),
      federation({
        name: 'csap-analyst',
        filename: 'csap-analyst.js',
        exposes: {
          './alertList': './src/views/alert/AlertListView.vue',
          './alertForm': './src/views/alert/AlertCreateForm.vue',
          './mfaConnectors': './src/utils/mfaConnectors.ts',
          './alertDetails': './src/components/alert/AlertDetailsModal.vue',
          './rssView': './src/views/rss/RssFeedsView.vue'
        },
        remotes: remotes
      })
    ],
    base: getBasePath('/dashboard/csap-analyst/'),
    css: {
      postcss: {
        plugins: [autoprefixer]
      },
      preprocessorOptions: {
        scss: {
          additionalData: `
				// @import "csap-design-system/scss/utilities/_all.scss";
			  `
        }
      }
    },
    optimizeDeps: {
      include: [
        'vue-focus',
        'sanitize-html',
        'lodash/debounce',
        'vue-froala-wysiwyg',
        'froala-editor',
        'lodash/isEqual',
        'vue-clipboard2',
        'mixpanel-browser'
      ]
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        './icons': fileURLToPath(new URL('./node_modules/icons/icons.ts', import.meta.url))
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue', '.scss', '.css']
    },
    server: {
      port: 5175
    },
    preview: {
      port: 5176
    },
    build: {
      target: 'esnext',
      commonjsOptions: {
        transformMixedEsModules: true
      }
    }
  });
};
