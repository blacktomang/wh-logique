import { Link } from "react-router-dom";
import { ItemForm } from "../features/items/ItemForm";
import { paths } from "../router/paths";
import { PageHeader } from "../components/PageHeader";

export function ItemNewPage() {
  return (
    <section>
      <Link to={paths.items} className="mb-6 inline-flex items-center gap-2 rounded-md text-sm font-bold text-sage-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">
        <span aria-hidden="true">←</span> Back to items
      </Link>
      <PageHeader eyebrow="Inventory control" title="New item" description="Add the identifying details used to track this item throughout the warehouse." />
      <div className="max-w-3xl rounded-2xl border border-ink-950/8 bg-paper p-5 shadow-[0_18px_48px_rgb(54_83_66/0.09)] sm:p-7">
        <div className="mb-6 border-b border-ink-950/10 pb-5">
          <h2 className="text-lg font-bold tracking-[-0.025em] text-ink-950">Item details</h2>
          <p className="mt-1 text-sm text-ink-600">All fields are required.</p>
        </div>
        <ItemForm />
      </div>
    </section>
  );
}
