import { createServer } from 'node:http';
import { httpServerHandler } from 'cloudflare:node';

import app from './server.js';

const server = createServer(app);
server.listen(8787);
const handleApiRequest = httpServerHandler({ port: 8787 });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return handleApiRequest(request);
    }

    const assetPath = url.pathname === '/'
      ? '/index.html'
      : url.pathname.endsWith('/')
        ? `${url.pathname}index.html`
        : url.pathname.includes('.')
          ? url.pathname
          : `${url.pathname}.html`;
    url.pathname = assetPath;

    const assetRequest = new Request(url, {
      method: request.method,
      headers: request.headers
    });
    const assetResponse = await env.ASSETS.fetch(assetRequest);
    if (assetResponse.status !== 404) return assetResponse;

    const notFoundUrl = new URL('/404.html', request.url);
    const notFoundRequest = new Request(notFoundUrl, {
      method: request.method,
      headers: request.headers
    });
    const notFoundResponse = await env.ASSETS.fetch(notFoundRequest);
    return new Response(notFoundResponse.body, {
      status: 404,
      headers: notFoundResponse.headers
    });
  }
};
