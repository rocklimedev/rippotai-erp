import { HttpException } from '@nestjs/common';
import type { RequestHandler } from 'express';
import { CdnService } from './cdn.service';
import { verifyFileAccess } from './file-access';

// Local development uses the same absolute CDN URL shape. This middleware must
// run before express.static, so a private filename never bypasses validation.
export function localPrivateCdn(storage: CdnService): RequestHandler {
  return async (req, res, next) => {
    const key = req.path.slice(1);
    if (!key.startsWith('private-')) return next();
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
    try {
      verifyFileAccess(
        key,
        req.query.expires as string,
        req.query.signature as string,
      );
      res.type(key);
      await storage.streamFile(key, res);
    } catch (error) {
      if (error instanceof HttpException)
        return void res
          .status(error.getStatus())
          .json({ message: error.message });
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        return void res.status(404).json({ message: 'File not found' });
      next(error);
    }
  };
}
