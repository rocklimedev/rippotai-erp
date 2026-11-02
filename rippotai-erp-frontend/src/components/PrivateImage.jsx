import React, { useEffect, useState } from 'react';
import { acquirePrivateImage } from '@/lib/private-image';

export default function PrivateImage({ src, alt = '', ...props }) {
  const privateFile = /\/private-[^/?]+\?/.test(src || '');
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!privateFile) return;
    let mounted = true;
    const lease = acquirePrivateImage(src);
    lease.promise.then(
      (url) => {
        if (mounted) setImage({ src, url });
      },
      (error) => {
        if (mounted) setImage({ src, error: error.message });
      },
    );
    return () => {
      mounted = false;
      lease.release();
    };
  }, [src, privateFile]);
  if (!privateFile) return <img {...props} src={src} alt={alt} />;
  if (image?.src === src && image.error) {
    return (
      <span data-image-error role="img" aria-label={alt || 'Image unavailable'}>
        Image unavailable. Refresh the report to try again.
      </span>
    );
  }
  return (
    <img
      {...props}
      src={image?.src === src ? image.url : undefined}
      alt={alt}
      aria-busy={image?.src !== src}
    />
  );
}
