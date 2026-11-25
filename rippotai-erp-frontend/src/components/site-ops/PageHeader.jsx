// Site-ops / procurement pages: same header as every other INOS page (breadcrumb,
// back arrow, title, info line, actions) so it lines up with the page content.
import { PageHeader as InosPageHeader } from '@/components/inos';

// eslint-disable-next-line no-unused-vars
export function PageHeader({ title, description, backTo, actions, className, eyebrow }) {
  return <InosPageHeader title={title} info={description || null} actions={actions} eyebrow={eyebrow} />;
}

export default PageHeader;
