import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

function mpaCleanUrls() {
  const routes = ['editor', 'community', 'login', 'register', 'profile'];
  return {
    name: 'mpa-clean-urls',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url.split('?')[0].replace(/\/$/, '');
        if (routes.includes(url.slice(1))) req.url = `${url}/index.html`;
        next();
      });
    },
  };
}

export default defineConfig({
  root: '.',
  plugins: [basicSsl(), mpaCleanUrls()],
  server: {
    https: true,
    port: 3000,
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } },
  },
  build: {
    rollupOptions: {
      input: {
        main:      'index.html',
        editor:    'editor/index.html',
        community: 'community/index.html',
        login:     'login/index.html',
        register:  'register/index.html',
        profile:   'profile/index.html',
      },
    },
    outDir: 'dist',
  },
});
