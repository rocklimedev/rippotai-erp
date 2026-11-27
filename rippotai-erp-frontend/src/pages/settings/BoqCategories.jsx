import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, Page, PageHeader, SearchInput, Toolbar } from '@/components/inos';
import { useAuth } from '@/context/AuthContext';
import { appConfirm, appPrompt } from '@/lib/app-dialog';
import {
  useCreateLibraryCategoryMutation,
  useDeleteLibraryCategoryMutation,
  useGetLibraryCategoriesQuery,
  useUpdateLibraryCategoryMutation,
} from '@/api/boq/boq.api';
import { AdminAccessDenied, adminCrumbs, SkeletonRows, TableEmpty } from './_admin-ui';

const title = 'BOQ Categories';

export default function BoqCategories() {
  const { user } = useAuth();
  const canRead = user?.permissions?.includes('library:read');
  const canCreate = user?.permissions?.includes('library:create');
  const canEdit = user?.permissions?.includes('library:update');
  const canDelete = user?.permissions?.includes('library:delete');
  const [search, setSearch] = useState('');
  const { data: categories = [], isLoading, isFetching, isError, refetch } =
    useGetLibraryCategoriesQuery(undefined, { skip: !canRead });
  const [createCategory, { isLoading: creating }] = useCreateLibraryCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateLibraryCategoryMutation();
  const [deleteCategory, { isLoading: deleting }] = useDeleteLibraryCategoryMutation();
  const busy = creating || updating || deleting || isFetching;
  const visibleCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  if (!canRead) {
    return (
      <AdminAccessDenied
        crumb={title}
        title="Library access required"
        text="You need permission to view the BOQ library."
      />
    );
  }

  const saveCategory = async (category) => {
    const name = (await appPrompt(category ? 'Edit category name' : 'New category name', category?.name))?.trim();
    if (name == null || name === category?.name) return;
    if (!name || name.length > 255) {
      toast.error('Enter a category name between 1 and 255 characters.');
      return;
    }
    if (categories.some((row) => row.id !== category?.id && row.name.trim().toLowerCase() === name.toLowerCase())) {
      toast.error('A category with this name already exists.');
      return;
    }
    try {
      if (category) await updateCategory({ id: category.id, name }).unwrap();
      else await createCategory({ name }).unwrap();
      toast.success(category ? 'Category updated' : 'Category added');
    } catch (error) {
      toast.error(error?.data?.message || 'Could not save category.');
    }
  };

  const removeCategory = async (category) => {
    if (!(await appConfirm(`Delete “${category.name}” from the BOQ category library?`))) return;
    try {
      await deleteCategory(category.id).unwrap();
      toast.success('Category deleted');
    } catch (error) {
      toast.error(error?.data?.message || 'Could not delete category.');
    }
  };

  return (
    <Page>
      <PageHeader
        crumbs={adminCrumbs(title)}
        title={title}
        subtitle="Reusable categories available when building a BOQ."
        actions={canCreate && (
          <Button icon={Plus} onClick={() => saveCategory()} disabled={busy || isError}>
            Add Category
          </Button>
        )}
      />
      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search categories" />
        {(!canEdit || !canDelete) && (
          <p className="text-sm text-muted-foreground">
            {!canEdit && !canDelete
              ? 'Editing and deleting categories require BOQ library permissions.'
              : canEdit
                ? 'Deleting categories requires BOQ library delete permission.'
                : 'Editing categories requires BOQ library update permission.'}
          </p>
        )}
      </Toolbar>
      <Card flush>
        <div className="inos-table-wrap">
          <table className="inos-table">
            <thead>
              <tr>
                <th scope="col">Category name</th>
                <th scope="col" className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows cols={2} />
              ) : isError ? (
                <TableEmpty
                  cols={2}
                  title="Could not load BOQ categories"
                  action={<Button onClick={refetch}>Try again</Button>}
                />
              ) : !visibleCategories.length ? (
                <TableEmpty cols={2} title={categories.length ? 'No matching categories' : 'No BOQ categories yet'} />
              ) : visibleCategories.map((category) => (
                <tr key={category.id}>
                  <td className="adm-cell-title">{category.name}</td>
                  <td className="actions">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" icon={Pencil} disabled={busy || !canEdit} onClick={() => saveCategory(category)} aria-label={`Edit ${category.name}`}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" icon={Trash2} disabled={busy || !canDelete} onClick={() => removeCategory(category)} aria-label={`Delete ${category.name}`}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Page>
  );
}
