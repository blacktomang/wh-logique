import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useItems, useDeleteItem } from "../../hooks/useItems";
import { ApiError } from "../../api/client";
import { errorDescription, errorMessage, useErrorToast } from "../../hooks/useErrorToast";
import { useToast } from "../../contexts/toast";
import { Spinner } from "../../components/Spinner";
import { ErrorAlert } from "../../components/ErrorAlert";
import { Button } from "../../components/Button";
import { Dialog } from "../../components/Dialog";
import { Input, Select, Field } from "../../components/Field";
import { PageHeader } from "../../components/PageHeader";
import { paths } from "../../router/paths";
import { formatDate, formatLabel } from "../../utils/format";
import { ITEM_CATEGORIES } from "../../types/item";
import type { ItemCategory } from "../../types/item";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export function ItemList() {
  const toast = useToast();
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
  useErrorToast(error, "Failed to load items");

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (!isPending && !isError && page > totalPages) setPage(totalPages);
  }, [isPending, isError, page, totalPages]);

  function handleCategoryChange(value: string) {
    setCategory((value as ItemCategory) || undefined);
    setPage(1);
  }

  function handleDelete() {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete, {
      onSuccess: (response) => toast.success(response.message || "Item deleted successfully"),
      onError: (mutationError) => toast.error(errorMessage(mutationError, "Failed to delete item"), errorDescription(mutationError)),
      onSettled: () => setPendingDelete(null),
    });
  }

  if (isPending) return <Spinner />;
  if (isError) return <ErrorAlert message={error instanceof ApiError ? error.message : "Failed to load items"} />;

  return (
    <section>
      <PageHeader
        eyebrow="Inventory control"
        title="Items"
        description="Find, review, and maintain every item moving through your warehouse."
        action={
          <Link to={paths.itemNew}>
            <Button><span className="text-lg font-medium leading-none" aria-hidden="true">+</span>New item</Button>
          </Link>
        }
      />

      <div className="mb-5 flex flex-col justify-between gap-4 rounded-xl border border-ink-950/8 bg-paper/85 p-4 shadow-[0_14px_38px_rgb(54_83_66/0.07)] backdrop-blur sm:flex-row sm:items-end sm:p-5">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end">
          <Field label="Search">
            <Input type="search" placeholder="SKU or item name" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="sm:min-w-64" />
          </Field>
          <Field label="Category">
            <Select value={category ?? ""} onChange={(event) => handleCategoryChange(event.target.value)}>
              <option value="">All categories</option>
              {ITEM_CATEGORIES.map((value) => <option key={value} value={value}>{formatLabel(value)}</option>)}
            </Select>
          </Field>
        </div>
        <div className="flex items-center gap-2 border-t border-ink-950/8 pt-4 text-sm text-ink-600 sm:border-l sm:border-t-0 sm:py-2 sm:pl-5">
          <span className="font-mono text-lg font-semibold tabular-nums text-ink-950">{total}</span>
          <span>{total === 1 ? "record" : "records"}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-950/8 bg-paper shadow-[0_16px_42px_rgb(54_83_66/0.08)]">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-ink-950/10 bg-sage-50/75 text-ink-600">
            <tr>
              {["SKU", "Item name", "Category", "Unit", "Created"].map((heading) => (
                <th key={heading} className="px-5 py-3.5 text-[0.7rem] font-bold tracking-[0.09em] uppercase">{heading}</th>
              ))}
              <th className="px-5 py-3.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-950/7">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center">
                  <div className="mx-auto max-w-sm">
                    <span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-sage-50 text-sage-700 ring-1 ring-sage-500/15">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                        <path d="M5 5.5h14v13H5zM8 9h8M8 12h5" />
                      </svg>
                    </span>
                    <p className="font-bold tracking-[-0.02em] text-ink-950">No items match this view</p>
                    <p className="mt-1.5 text-sm leading-6 text-ink-600">
                      {search || category ? "Try changing the search or category filter." : "Create the first item to start tracking inventory."}
                    </p>
                    {!search && !category && (
                      <Link to={paths.itemNew} className="mt-5 inline-block"><Button>New item</Button></Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="group transition-colors duration-200 hover:bg-sage-50/55">
                  <td className="px-5 py-4 font-mono text-xs font-semibold tabular-nums text-ink-600">{item.sku}</td>
                  <td className="px-5 py-4">
                    <Link to={paths.itemDetail(item.id)} className="font-bold tracking-[-0.01em] text-ink-950 underline-offset-4 transition-colors hover:text-sage-700 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">{item.name}</Link>
                  </td>
                  <td className="px-5 py-4"><span className="inline-flex rounded-md bg-sage-100/70 px-2.5 py-1 text-xs font-semibold text-sage-900">{formatLabel(item.category)}</span></td>
                  <td className="px-5 py-4 font-medium text-ink-800">{item.unit}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-ink-600">{formatDate(item.created_at)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <Link to={paths.itemDetail(item.id)}><Button variant="secondary">Detail</Button></Link>
                    <Link to={paths.itemEdit(item.id)} className="ml-2"><Button variant="secondary">Edit</Button></Link>
                    <Button variant="danger" className="ml-2" onClick={() => setPendingDelete(item.id)}>Delete</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm font-medium text-ink-600">Showing page <span className="font-mono tabular-nums text-ink-950">{page}</span> of <span className="font-mono tabular-nums text-ink-950">{totalPages}</span></p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
        </div>
      </div>

      <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)} title="Delete item" description="This item will be removed from active inventory. This action cannot be undone." actions={<><Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button><Button variant="danger" isLoading={deleteMutation.isPending} onClick={handleDelete}>Delete item</Button></>} />
    </section>
  );
}
