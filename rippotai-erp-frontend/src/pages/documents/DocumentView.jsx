import { useParams, useSearchParams } from 'react-router-dom';
import { backLabel } from '@/components/projects/upload-docs/uploadDocs';
import { useGetDocumentQuery } from '@/api/documents/document.api';
import { Page, PageHeader, Card, EmptyState } from '@/components/inos';
import DrawingPreview from '../design-studio/DrawingPreview';
import { fileKind } from '../design-studio/drawingUtils';
import RecordContext from '@/components/record-context/RecordContext';
import VersionHistory from '@/components/record-context/VersionHistory';
import OpenFileLink from '@/components/record-context/OpenFileLink';
import { useRecordInfo } from '@/components/record-context/useRecordInfo';
import RecordEditDelete from '@/components/record-context/RecordEditDelete';

export default function DocumentView() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const back = params.get('back');
  const recordInfo = useRecordInfo('document', id);
  const { currentData: document, isLoading, isError } = useGetDocumentQuery(id);
  const kind = fileKind({ name: document?.filename, mime: document?.mime });
  const hasFile = !!(document?.storageFilename || document?.url);
  const title = document?.documentType?.name || document?.title || 'Document';
  const openPath = `/documents/${id}/download`;
  return (
    <Page>
      <PageHeader
        crumbs={back ? [{ label: backLabel(back), to: back }, { label: document?.title || title }] : undefined}
        title={title}
        info={recordInfo}
        actions={
          <>
            {hasFile && (
              <OpenFileLink
                button
                source={openPath}
                title={document?.filename}
                testId="document-open"
              >
                Open in new tab
              </OpenFileLink>
            )}
            {document?.id && <RecordEditDelete kind="document" record={document} backTo={back} />}
          </>
        }
      />
      {document?.id && (
        <RecordContext
          type="document"
          id={id}
          listTo={
            back ||
            document.projectId
              ? `/projects/${encodeURIComponent(document.projectId)}?tab=documents`
              : undefined
          }
          listLabel="Project documents"
        />
      )}
      <Card>
        {isLoading ? (
          <p>Loading document…</p>
        ) : isError || !document ? (
          <EmptyState
            title="Document unavailable"
            text="The document may have been deleted or you may not have access."
          />
        ) : !hasFile ? (
          <EmptyState title="No file attached" />
        ) : ['image', 'pdf'].includes(kind) ? (
          <div className="ds-preview">
            <DrawingPreview
              key={`${id}:${document.storageFilename}`}
              drawingId={id}
              revision={document}
              kind={kind}
              title={document.title}
              downloadPath={openPath}
            />
          </div>
        ) : (
          <EmptyState
            title="No preview for this file type"
            action={
              <OpenFileLink button source={openPath} title={document.filename}>
                Open in new tab
              </OpenFileLink>
            }
          />
        )}
        {document?.remarks && <p>{document.remarks}</p>}
      </Card>
      {document?.id && <VersionHistory type="document" id={id} />}
    </Page>
  );
}
