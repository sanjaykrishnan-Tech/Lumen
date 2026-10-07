import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Returning visitors: fetch the events for their last project right away from an
// inline script, in parallel with the JS download, and leave the promise on
// window.__lumenEvents for apiDataService to pick up. It mirrors how
// ProjectsProvider picks the current project (stored choice, else first) from the
// cache written by services/sessionCache.ts — keep the storage keys in sync.
// Any failure just means no early request; the app then fetches normally.
const earlyEventsScript = (apiUrl: string) => `(function(){try{
var u=JSON.parse(localStorage.getItem('lumen.user')||'null');if(!u||!u.id)return;
var ps=JSON.parse(localStorage.getItem('lumen.projects.'+u.id)||'[]');
var sel=localStorage.getItem('lumen.projectId');
var p=ps.filter(function(x){return x.id===sel})[0]||ps[0];if(!p)return;
window.__lumenEvents={projectId:p.id,promise:fetch(${JSON.stringify(apiUrl)}+'/api/events?projectId='+encodeURIComponent(p.id),{credentials:'include'})
.then(function(r){return r.ok?r.json():null}).catch(function(){return null})};
}catch(e){}})();`

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const apiUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        // Start talking to the API before the JS bundle has even downloaded.
        name: 'early-api-requests',
        transformIndexHtml: () =>
          apiUrl
            ? [
                {
                  tag: 'link',
                  attrs: { rel: 'preconnect', href: apiUrl, crossorigin: 'use-credentials' },
                  injectTo: 'head-prepend' as const,
                },
                { tag: 'script', children: earlyEventsScript(apiUrl), injectTo: 'head-prepend' as const },
              ]
            : [],
      },
    ],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  }
})
