import app from './app';

const port = Number(Bun.env.PORT ?? 3000);
const distRoot = new URL('../dist/', import.meta.url);
const indexFile = new URL('index.html', distRoot);

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return app.fetch(request);
    }

    const staticPath = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const staticFile = Bun.file(new URL(staticPath, distRoot));

    if (await staticFile.exists()) {
      return new Response(staticFile);
    }

    return new Response(Bun.file(indexFile), {
      headers: {
        'content-type': 'text/html; charset=utf-8',
      },
    });
  },
});

console.log(`DevCon-Comm listening on http://localhost:${port}`);
