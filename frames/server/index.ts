// This file isn't processed by Vite, see https://github.com/vikejs/vike/issues/562
// Consequently:
//  - When changing this file, you needed to manually restart your server for your changes to take effect.
//  - To use your environment variables defined in your .env files, you need to install dotenv, see https://vike.dev/env
//  - To use your path aliases defined in your vite.config.js, you need to tell Node.js about them, see https://vike.dev/path-aliases

// If you want Vite to process your server code then use one of these:
//  - vavite (https://github.com/cyco130/vavite)
//     - See vavite + Vike examples at https://github.com/cyco130/vavite/tree/main/examples
//  - vite-node (https://github.com/antfu/vite-node)
//  - HatTip (https://github.com/hattipjs/hattip)
//    - You can use Bati (https://batijs.github.io/) to scaffold a Vike + HatTip app. Note that Bati generates apps that use the V1 design (https://vike.dev/migration/v1-design) and Vike packages (https://vike.dev/vike-packages)

import express from 'express';
import compression from 'compression';
import { renderPage } from 'vike/server';
import { root } from './root.js';

import { htmlToImage } from '../src/utils/image.js';
import { test } from '../src/components/test.js';

const isProduction = process.env.NODE_ENV === 'production';

startServer();

async function startServer() {
  const app = express();

  app.use(compression());

  // Vite integration
  if (isProduction) {
    // In production, we need to serve our static assets ourselves.
    const sirv = (await import('sirv')).default;
    app.use(sirv(`${root}/dist/client`));
  } else {
    // We instantiate Vite's development server and integrate its middleware to our server.
    const vite = await import('vite');
    const viteDevMiddleware = (
      await vite.createServer({
        root,
        server: { middlewareMode: true }
      })
    ).middlewares;
    app.use(viteDevMiddleware);
  }

  // handling frames image generation
  app.get('/images/welcome.png', async (_, res) => {
    const image = await htmlToImage(test('Payflow'), 'landscape');
    res.type('png').send(image);
  });

  // Vike middleware. It should always be our last middleware
  app.get('*', async (req, res, next) => {
    const pageContextInit = {
      urlOriginal: req.originalUrl
    };
    const pageContext = await renderPage(pageContextInit);
    if (pageContext.errorWhileRendering) {
      // Install error tracking here, see https://vike.dev/errors
    }
    const { httpResponse } = pageContext;
    if (!httpResponse) {
      return next();
    } else {
      const { body, statusCode, headers, earlyHints } = httpResponse;
      if (res.writeEarlyHints)
        res.writeEarlyHints({ link: earlyHints.map((e) => e.earlyHintLink) });
      headers.forEach(([name, value]) => res.setHeader(name, value));
      res.status(statusCode);
      res.send(body);
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log(`Server running at http://localhost:${port}`);
}
