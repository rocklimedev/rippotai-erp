import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/inos';
import { downloadRow } from './uploadDocs';

export default function DownloadFileButton({ kind, record }) {
  const [downloading, setDownloading] = useState(false);

  async function download() {
    setDownloading(true);
    try {
      await downloadRow({ kind, id: record.id, record, title: record.title });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button icon={Download} disabled={downloading} onClick={download}>
      {downloading ? 'Downloading…' : 'Download'}
    </Button>
  );
}
