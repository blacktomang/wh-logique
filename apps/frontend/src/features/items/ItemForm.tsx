import { Link } from "react-router-dom";
import { useItemForm } from "../../hooks/useItemForm";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { Input, Select } from "../../components/Field";
import { paths } from "../../router/paths";
import { formatLabel } from "../../utils/format";
import { ITEM_CATEGORIES, ITEM_UNITS } from "../../types/item";
import type { Item, ItemCategory, ItemUnit } from "../../types/item";
import { SKUAvailabilityStatus } from "./SKUAvailabilityStatus";

interface ItemFormProps {
  initial?: Item;
}

export function ItemForm({ initial }: ItemFormProps) {
  const {
    isEditing,
    form,
    fieldErrors,
    skuAvailabilityError,
    skuAvailabilityStatus,
    isPending,
    isSubmitDisabled,
    createdId,
    updateField,
    handleSubmit,
  } = useItemForm(initial);

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      <FormField
        label="SKU"
        id="sku"
        error={fieldErrors.sku ?? skuAvailabilityError}
      >
        <Input
          value={form.sku}
          onChange={(e) => updateField("sku", e.target.value)}
          maxLength={64}
          required
          disabled={isPending}
          aria-invalid={fieldErrors.sku || skuAvailabilityError ? true : undefined}
          aria-describedby={
            [
              fieldErrors.sku || skuAvailabilityError ? "sku-error" : null,
              skuAvailabilityStatus !== "idle" &&
              skuAvailabilityStatus !== "unavailable"
                ? "sku-availability-status"
                : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        <SKUAvailabilityStatus status={skuAvailabilityStatus} />
      </FormField>

      <FormField label="Item name" id="name" error={fieldErrors.name}>
        <Input
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          maxLength={255}
          required
          disabled={isPending}
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
        />
      </FormField>

      <FormField label="Category" id="category" error={fieldErrors.category}>
        <Select
          value={form.category}
          onChange={(e) =>
            updateField("category", e.target.value as ItemCategory | "")
          }
          required
          disabled={isPending}
          aria-invalid={fieldErrors.category ? true : undefined}
          aria-describedby={
            fieldErrors.category ? "category-error" : undefined
          }
        >
          <option value="">Select a category</option>
          {ITEM_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {formatLabel(category)}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Unit" id="unit" error={fieldErrors.unit}>
        <Select
          value={form.unit}
          onChange={(e) => updateField("unit", e.target.value as ItemUnit | "")}
          required
          disabled={isPending}
          aria-invalid={fieldErrors.unit ? true : undefined}
          aria-describedby={fieldErrors.unit ? "unit-error" : undefined}
        >
          <option value="">Select a unit</option>
          {ITEM_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="flex items-center gap-3 border-t border-ink-950/10 pt-5 sm:col-span-2">
        <Button
          type="submit"
          isLoading={isPending}
          disabled={isSubmitDisabled}
        >
          {isPending ? "Saving…" : isEditing ? "Update" : "Create"}
        </Button>
        {createdId && (
          <Link
            to={paths.itemDetail(createdId)}
            className="rounded-sm text-sm font-bold text-sage-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500"
          >
            View item
          </Link>
        )}
      </div>
    </form>
  );
}
