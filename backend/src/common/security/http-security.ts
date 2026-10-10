import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

export function configureHttpSecurity(app: NestExpressApplication) {
  // Trust only the configured proxy hops/networks, never arbitrary forwarded IPs.
  const proxy = process.env.TRUST_PROXY;
  if (proxy) {
    if (/^\d+$/.test(proxy)) {
      const hops = Number(proxy);
      if (!Number.isSafeInteger(hops))
        throw new Error('Invalid TRUST_PROXY hop count');
      app.set('trust proxy', hops);
    } else {
      if (proxy === 'true' || proxy === 'false') {
        throw new Error(
          'TRUST_PROXY must specify proxy hops or trusted networks',
        );
      }
      app.set(
        'trust proxy',
        proxy.split(',').map((network) => network.trim()),
      );
    }
  }
  app.use(
    helmet({
      // Uploaded CDN images are embedded by the separately hosted ERP frontend.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
}
