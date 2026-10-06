import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useItems, useDeleteItem } from "../../hooks/useItems";
import { ApiError } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { ErrorAlert } from "../../components/ErrorAlert";
import { EmptyState } from "../../components/EmptyState";
import { Button } from "../../components/Button";
import { Dialog } from "../../components/Dialog";
import { Input, Select, Field } from "../../components/Field";
import { paths } from "../../router/paths";
import { formatDate } from "../../utils/format";
import { ITEM_CATEGORIES } from "../../types/item";
import type { ItemCategory } from "../../types/item";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export function ItemList() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ItemCategory | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const params = {
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
    page,
    limit: PAGE_SIZE,
  };
  const { data, isPending, isError, error } = useItems(params);
  const deleteMutation = useDeleteItem();

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // When search/filter shrinks the result set while the user is on a later
  // page, the API returns an empty page with a smaller `total`. Clamp the page
  // back so the user lands on the last page that actually has results.
  useEffect(() => {
    if (!isPending && !isError && page > totalPages) {
      setPage(totalPages);
    }
  }, [isPending, isError, page, totalPages]);

  function handleCategoryChange(value: string) {
    setCategory((value as ItemCategory) || undefined);
    setPage(1);
  }

  function handleDelete() {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete, {
      onSettled: () => setPendingDelete(null),
    });
  }

  if (isPending) return <Spinner />;
  if (isError) {
    return (
      <ErrorAlert
        message={
          error instanceof ApiError ? error.message : "Failed to load items"
        }
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Search">
            <Input
              type="search"
              placeholder="Search by SKU or name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </Field>
          <Field label="Category">
            <Select
              value={category ?? ""}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">All</option>
              {ITEM_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Link to={paths.itemNew}>
          <Button>New item</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState message="No items found." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={paths.itemDetail(item.id)}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{item.unit}</td>
                  <td className="px-4 py-3">{formatDate(item.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={paths.itemDetail(item.id)}>
                      <Button variant="secondary">Edit</Button>
                    </Link>
                    <Button
                      variant="danger"
                      className="ml-2"
                      onClick={() => setPendingDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {total} item{total === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete item"
        description="This action cannot be undone. The item will be soft-deleted."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
