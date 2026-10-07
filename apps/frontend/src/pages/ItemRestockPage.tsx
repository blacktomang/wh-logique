import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { Button } from "../components/Button";
import { ErrorAlert } from "../components/ErrorAlert";
import { FormField } from "../components/FormField";
import { Input, Select } from "../components/Field";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { useItem } from "../hooks/useItems";
import { useLocations } from "../hooks/useLocations";
import { useReceiveStock } from "../hooks/useStock";
import { paths } from "../router/paths";
import { formatLabel } from "../utils/format";

export function ItemRestockPage() {
  const { id = "" } = useParams();
  const itemQuery = useItem(id);
  const locationsQuery = useLocations();
  const receiveMutation = useReceiveStock();
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ location?: string; quantity?: string }>({});
  const [success, setSuccess] = useState<string | null>(null);

  if (itemQuery.isPending || locationsQuery.isPending) return <Spinner />;
  if (itemQuery.isError) return <ErrorAlert message={itemQuery.error instanceof ApiError ? itemQuery.error.message : "Failed to load item"} />;
  if (locationsQuery.isError) return <ErrorAlert message={locationsQuery.error instanceof ApiError ? locationsQuery.error.message : "Failed to load locations"} />;

  const item = itemQuery.data?.data;
  const locations = locationsQuery.data?.data ?? [];
  if (!item) return <ErrorAlert message="Item not found" />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(null);

    const qty = Number(quantity);
    const errors: { location?: string; quantity?: string } = {};
    if (!locationId) errors.location = "Select a location";
    if (!quantity) errors.quantity = "Enter a quantity";
    else if (!Number.isInteger(qty) || qty < 1) errors.quantity = "Quantity must be a positive whole number";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const response = await receiveMutation.mutateAsync({
        lines: [{ item_id: item!.id, location_id: locationId, qty }],
      });
      setSuccess(response.message || "Stock received successfully");
      setQuantity("");
    } catch {
      // The mutation error is rendered below with the backend's message.
    }
  }

  const mutationError = receiveMutation.error;

  return (
    <section>
      <Link to={paths.itemDetail(item.id)} className="mb-6 inline-flex items-center gap-2 rounded-md text-sm font-bold text-sage-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500">
        <span aria-hidden="true">←</span> Back to item details
      </Link>
      <PageHeader eyebrow="Stock receipt" title={`Restock ${item.name}`} description={`Add incoming stock for ${item.sku} to a warehouse location.`} />

      <div className="max-w-2xl rounded-2xl border border-ink-950/8 bg-paper p-5 shadow-[0_18px_48px_rgb(54_83_66/0.09)] sm:p-7">
        <div className="mb-6 border-b border-ink-950/10 pb-5">
          <h2 className="text-lg font-bold tracking-[-0.025em] text-ink-950">Receipt details</h2>
          <p className="mt-1 text-sm text-ink-600">Received quantity is added to the selected location’s current balance.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
          {success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 sm:col-span-2">{success}</div>}
          {mutationError && (
            <div className="sm:col-span-2">
              <ErrorAlert
                message={mutationError instanceof ApiError ? mutationError.message : "Failed to receive stock"}
                {...(mutationError instanceof ApiError && mutationError.details.length > 0 ? { details: mutationError.details } : {})}
              />
            </div>
          )}

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

          <div className="flex flex-wrap items-center gap-3 border-t border-ink-950/10 pt-5 sm:col-span-2">
            <Button type="submit" isLoading={receiveMutation.isPending}>Receive stock</Button>
            <Link to={paths.itemDetail(item.id)}><Button type="button" variant="secondary">Cancel</Button></Link>
          </div>
        </form>
      </div>
    </section>
  );
}
