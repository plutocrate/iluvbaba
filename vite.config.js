import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  root: '.',
  plugins: [basicSsl()],
  server: {
    https: true,
    port: 3000,
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } },
    // SPA fallback: serve index.html for all non-asset routes
    historyApiFallback: true,
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
      external: ['better-sqlite3', 'pg', 'bcryptjs', 'jsonwebtoken', 'redis'],
    },
    outDir: 'dist',
  },
});
