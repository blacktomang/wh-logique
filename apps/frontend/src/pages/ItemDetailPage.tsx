import { useState } from "react";
import type { FormEvent } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useItem, useDeleteItem } from "../hooks/useItems";
import { useLocations } from "../hooks/useLocations";
import { useItemStock, useItemStockLogs, useReceiveStock } from "../hooks/useStock";
import { errorDescription, errorMessage, useErrorToast } from "../hooks/useErrorToast";
import { useToast } from "../contexts/toast";
import { ApiError } from "../api/client";
import { Spinner } from "../components/Spinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { Button } from "../components/Button";
import { Dialog } from "../components/Dialog";
import { FormField } from "../components/FormField";
import { Input, Select } from "../components/Field";
import { PageHeader } from "../components/PageHeader";
import { paths } from "../router/paths";
import { formatDate, formatLabel } from "../utils/format";

export function ItemDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const itemQuery = useItem(id);
  const stockQuery = useItemStock(id);
  const stockLogsQuery = useItemStockLogs(id);
  const locationsQuery = useLocations();
  const deleteMutation = useDeleteItem();
  const receiveMutation = useReceiveStock();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [restockOpen, setRestockOpen] = useState(location.state?.restock === true);
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ location?: string; quantity?: string }>({});

  useErrorToast(itemQuery.error, "Failed to load item");
  useErrorToast(stockQuery.error, "Failed to load stock");
  useErrorToast(stockLogsQuery.error, "Failed to load stock log");
  useErrorToast(locationsQuery.error, "Failed to load locations");

  if (itemQuery.isPending || stockQuery.isPending || stockLogsQuery.isPending || locationsQuery.isPending) return <Spinner />;
  if (itemQuery.isError) return <ErrorAlert message={itemQuery.error instanceof ApiError ? itemQuery.error.message : "Failed to load item"} />;

  const item = itemQuery.data?.data;
  if (!item) return <ErrorAlert message="Item not found" />;

  const stocks = stockQuery.data?.data ?? [];
  const stockLogs = stockLogsQuery.data?.data ?? [];
  const locations = locationsQuery.data?.data ?? [];
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const totalStock = stocks.reduce((sum, stock) => sum + stock.qty, 0);

  async function handleDelete() {
    try {
      const response = await deleteMutation.mutateAsync(item!.id);
      toast.success(response.message || "Item deleted successfully");
      navigate(paths.items);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to delete item"), errorDescription(error));
    }
  }

  function closeRestock() {
    if (receiveMutation.isPending) return;
    setRestockOpen(false);
    setLocationId("");
    setQuantity("");
    setFieldErrors({});
    receiveMutation.reset();
  }

  async function handleRestock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const qty = Number(quantity);
    const errors: { location?: string; quantity?: string } = {};
    if (!locationId) errors.location = "Select a location";
    if (!quantity) errors.quantity = "Enter a quantity";
    else if (!Number.isInteger(qty) || qty < 1) errors.quantity = "Quantity must be a positive whole number";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Check the receipt details", "Select a location and enter a positive whole number.");
      return;
    }

    try {
      const response = await receiveMutation.mutateAsync({
        lines: [{ item_id: item!.id, location_id: locationId, qty }],
      });
      closeRestock();
      toast.success(response.message || "Stock received successfully");
    } catch (error) {
      toast.error(errorMessage(error, "Failed to receive stock"), errorDescription(error));
    }
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
        description="Review identifying information and stock balances across warehouse locations."
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setRestockOpen(true)}>Restock</Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete</Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(18rem,0.65fr)_minmax(0,1.35fr)] lg:items-start">
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

        <div className="overflow-hidden rounded-2xl border border-ink-950/8 bg-paper shadow-[0_18px_48px_rgb(54_83_66/0.09)]">
          <div className="flex flex-col justify-between gap-4 border-b border-ink-950/10 px-5 py-5 sm:flex-row sm:items-end sm:px-6">
            <div>
              <p className="text-[0.68rem] font-bold tracking-[0.14em] text-sage-700 uppercase">Inventory balance</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-ink-950">Stock by location</h2>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-mono text-2xl font-bold tabular-nums text-ink-950">{totalStock}</p>
              <p className="text-xs font-semibold text-ink-600">total {item.unit}</p>
            </div>
          </div>

          {stockQuery.isError ? (
            <div className="p-5"><ErrorAlert message={stockQuery.error instanceof ApiError ? stockQuery.error.message : "Failed to load stock"} /></div>
          ) : stocks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-bold text-ink-950">No stock received yet</p>
              <p className="mt-1.5 text-sm text-ink-600">Receive stock to assign quantity to a warehouse location.</p>
              <Button className="mt-5" onClick={() => setRestockOpen(true)}>Restock item</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-ink-950/8 bg-sage-50/60 text-ink-600">
                  <tr>
                    {['Location', 'Zone', 'Quantity', 'Updated'].map((heading) => <th key={heading} className="px-5 py-3 text-[0.68rem] font-bold tracking-[0.09em] uppercase">{heading}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-950/7">
                  {stocks.map((stock) => {
                    const location = locationById.get(stock.location_id);
                    return (
                      <tr key={stock.id}>
                        <td className="px-5 py-4 font-mono text-xs font-bold text-ink-950">{location?.code ?? stock.location_id}</td>
                        <td className="px-5 py-4 text-ink-800">{location?.zone ?? "—"}</td>
                        <td className="px-5 py-4 font-mono font-bold tabular-nums text-ink-950">{stock.qty} <span className="font-sans text-xs font-medium text-ink-600">{item.unit}</span></td>
                        <td className="whitespace-nowrap px-5 py-4 text-ink-600">{formatDate(stock.updated_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-950/8 bg-paper shadow-[0_18px_48px_rgb(54_83_66/0.09)]">
        <div className="flex flex-col justify-between gap-3 border-b border-ink-950/10 px-5 py-5 sm:flex-row sm:items-end sm:px-6">
          <div>
            <p className="text-[0.68rem] font-bold tracking-[0.14em] text-sage-700 uppercase">Receipt history</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-ink-950">Stock log</h2>
            <p className="mt-1 text-sm text-ink-600">Every restock is recorded separately, newest first.</p>
          </div>
          <p className="font-mono text-xs font-semibold tabular-nums text-ink-600">{stockLogs.length} {stockLogs.length === 1 ? "ENTRY" : "ENTRIES"}</p>
        </div>

        {stockLogsQuery.isError ? (
          <div className="p-5"><ErrorAlert message={stockLogsQuery.error instanceof ApiError ? stockLogsQuery.error.message : "Failed to load stock log"} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-ink-950/8 bg-sage-50/60 text-ink-600">
                <tr>
                  {['Received', 'Location', 'Zone', 'Quantity'].map((heading) => <th key={heading} className="px-5 py-3 text-[0.68rem] font-bold tracking-[0.09em] uppercase">{heading}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/7">
                {stockLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center">
                      <p className="font-bold text-ink-950">No receipt history</p>
                      <p className="mt-1.5 text-sm text-ink-600">Restock activity will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  stockLogs.map((log) => {
                    const location = locationById.get(log.location_id);
                    return (
                      <tr key={log.id} className="transition-colors hover:bg-sage-50/45">
                        <td className="whitespace-nowrap px-5 py-4 text-ink-600">{formatDate(log.created_at)}</td>
                        <td className="px-5 py-4 font-mono text-xs font-bold text-ink-950">{location?.code ?? log.location_id}</td>
                        <td className="px-5 py-4 text-ink-800">{location?.zone ?? "—"}</td>
                        <td className="px-5 py-4 font-mono font-bold tabular-nums text-sage-700">+{log.qty} <span className="font-sans text-xs font-medium text-ink-600">{item.unit}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={restockOpen}
        onClose={closeRestock}
        title={`Restock ${item.name}`}
        description={`Add incoming stock for ${item.sku} to a warehouse location.`}
      >
        <form onSubmit={handleRestock} noValidate className="grid gap-5">
          <FormField label="Location" id="location" error={fieldErrors.location}>
            <Select
              value={locationId}
              onChange={(event) => {
                setLocationId(event.target.value);
                setFieldErrors((current) => current.quantity ? { quantity: current.quantity } : {});
              }}
              disabled={receiveMutation.isPending}
              aria-invalid={fieldErrors.location ? true : undefined}
              aria-describedby={fieldErrors.location ? "location-error" : undefined}
            >
              <option value="">Select a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.code} · Zone {location.zone} · {formatLabel(location.type)}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={`Quantity (${item.unit})`} id="quantity" error={fieldErrors.quantity}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder="0"
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                setFieldErrors((current) => current.location ? { location: current.location } : {});
              }}
              disabled={receiveMutation.isPending}
              aria-invalid={fieldErrors.quantity ? true : undefined}
              aria-describedby={fieldErrors.quantity ? "quantity-error" : undefined}
            />
          </FormField>

          <div className="flex justify-end gap-2 border-t border-ink-950/10 pt-5">
            <Button type="button" variant="secondary" onClick={closeRestock} disabled={receiveMutation.isPending}>Cancel</Button>
            <Button type="submit" isLoading={receiveMutation.isPending}>Receive stock</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete item" description={`Remove ${item.name} from active inventory? This action cannot be undone.`} actions={<><Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="danger" isLoading={deleteMutation.isPending} onClick={handleDelete}>Delete item</Button></>} />
    </section>
  );
}
