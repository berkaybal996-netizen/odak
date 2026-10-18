import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  server: { watch: { ignored: ['**/release*/**', '**/dist*/**', '**/test-results/**'] } },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'development-csp',
      transformIndexHtml(html, context) {
        // Vite geliştirme betikleri yalnızca yerel önizlemede çalışır.
        // Paketlenen masaüstü uygulaması sıkı CSP politikasını korur.
        return context.server
          ? html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*\/>/, '')
          : html;
      },
    },
  ],
});
