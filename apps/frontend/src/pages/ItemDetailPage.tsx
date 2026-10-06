import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useItem, useDeleteItem } from "../hooks/useItems";
import { ApiError } from "../api/client";
import { Spinner } from "../components/Spinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { Button } from "../components/Button";
import { Dialog } from "../components/Dialog";
import { PageHeader } from "../components/PageHeader";
import { paths } from "../router/paths";
import { ItemForm } from "../features/items/ItemForm";
import { formatDate, formatLabel } from "../utils/format";

export function ItemDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, isPending, isError, error } = useItem(id);
  const deleteMutation = useDeleteItem();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isPending) return <Spinner />;
  if (isError) return <ErrorAlert message={error instanceof ApiError ? error.message : "Failed to load item"} />;

  const item = data?.data;
  if (!item) return <ErrorAlert message="Item not found" />;

  async function handleDelete() {
    await deleteMutation.mutateAsync(item!.id);
    navigate(paths.items);
  }

  const details = [
    { label: "SKU", value: item.sku, mono: true },
    { label: "Category", value: formatLabel(item.category) },
    { label: "Unit", value: item.unit },
    { label: "Created", value: formatDate(item.created_at) },
  ];

  return (
    <section>
      <Link to={paths.items} className="mb-6 inline-flex items-center gap-2 rounded-md text-sm font-bold text-sage-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">
        <span aria-hidden="true">←</span> Back to items
      </Link>
      <PageHeader
        eyebrow="Item record"
        title={item.name}
        description="Review the current item record or update its warehouse details."
        action={<Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete item</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(28rem,1.28fr)] lg:items-start">
        <aside className="overflow-hidden rounded-2xl bg-ink-950 text-white shadow-[0_20px_50px_rgb(23_32_31/0.2)]">
          <div className="border-b border-white/10 px-6 py-5">
            <p className="text-[0.68rem] font-bold tracking-[0.14em] text-amber-400 uppercase">At a glance</p>
            <h2 className="mt-2 text-xl font-bold tracking-[-0.025em]">Record details</h2>
          </div>
          <dl className="divide-y divide-white/8 px-6">
            {details.map((detail) => (
              <div key={detail.label} className="grid grid-cols-[6rem_1fr] gap-4 py-4">
                <dt className="text-xs font-semibold text-white/45">{detail.label}</dt>
                <dd className={`text-sm font-semibold text-white ${detail.mono ? "font-mono tabular-nums" : ""}`}>{detail.value}</dd>
              </div>
            ))}
          </dl>
        </aside>

        <div className="rounded-2xl border border-ink-950/8 bg-paper p-5 shadow-[0_18px_48px_rgb(54_83_66/0.09)] sm:p-7">
          <div className="mb-6 border-b border-ink-950/10 pb-5">
            <p className="text-[0.68rem] font-bold tracking-[0.14em] text-sage-700 uppercase">Edit record</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-ink-950">Item details</h2>
            <p className="mt-1 text-sm text-ink-600">Changes are applied to this item only.</p>
          </div>
          <ItemForm initial={item} />
        </div>
      </div>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete item"
        description={`Remove ${item.name} from active inventory? This action cannot be undone.`}
        actions={<><Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="danger" isLoading={deleteMutation.isPending} onClick={handleDelete}>Delete item</Button></>}
      />
    </section>
  );
}
