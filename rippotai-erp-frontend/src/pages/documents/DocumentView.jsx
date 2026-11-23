import { useParams } from 'react-router-dom';
import { CloudUpload } from 'lucide-react';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { recordContextApi } from '@/api/doc-flow/record-context.api';
import { useAddDocumentVersionMutation, useGetDocumentQuery } from '@/api/documents/document.api';
import { Page, PageHeader, Card, EmptyState } from '@/components/inos';
import { useDocumentAccess } from '@/hooks/use-permission';
import DrawingPreview from '../design-studio/DrawingPreview';
import { fileKind } from '../design-studio/drawingUtils';
import RecordContext from '@/components/record-context/RecordContext';
import VersionHistory from '@/components/record-context/VersionHistory';
import OpenFileLink from '@/components/record-context/OpenFileLink';
import { useRecordInfo } from '@/components/record-context/useRecordInfo';
import RecordEditDelete from '@/components/record-context/RecordEditDelete';

/** Upload a new version of the document (primary header action). */
function UploadVersion({ documentId }) {
  const [addVersion, { isLoading }] = useAddDocumentVersionMutation();
  const dispatch = useDispatch();
  const upload = async (file) => {
    if (!file) return;
    try {
      await addVersion({ documentId, data: {}, file }).unwrap();
      toast.success('New version uploaded');
      dispatch(
        recordContextApi.util.invalidateTags([
          { type: 'RecordContext', id: `document:${documentId}` },
        ]),
      );
    } catch (e) {
      toast.error(e?.data?.message || 'Upload failed');
    }
  };
  return (
    <label
      className="inos-btn inos-btn--primary"
      style={{ cursor: 'pointer' }}
      data-testid="document-new-version"
    >
      <CloudUpload aria-hidden />
      <span>{isLoading ? 'Uploading…' : 'Upload new version'}</span>
      <input
        type="file"
        hidden
        disabled={isLoading}
        onChange={(e) => upload(e.target.files?.[0])}
      />
    </label>
  );
}

export default function DocumentView() {
  const { id } = useParams();
  const recordInfo = useRecordInfo('document', id);
  const access = useDocumentAccess('documents');
  const { currentData: document, isLoading, isError } = useGetDocumentQuery(id);
  const kind = fileKind({ name: document?.filename, mime: document?.mime });
  const hasFile = !!(document?.storageFilename || document?.url);
  const title = document?.documentType?.name || document?.title || 'Document';
  const openPath = `/documents/${id}/download`;
  return (
    <Page>
      <PageHeader
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
            {document?.id && <RecordEditDelete kind="document" record={document} />}
            {document?.id && (access.canCreate || access.canEdit) && (
              <UploadVersion documentId={document.id} />
            )}
          </>
        }
      />
      {document?.id && (
        <RecordContext
          type="document"
          id={id}
          listTo={
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
