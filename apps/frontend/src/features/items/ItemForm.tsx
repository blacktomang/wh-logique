import { Link } from "react-router-dom";
import { useItemForm } from "../../hooks/useItemForm";
import { ErrorAlert } from "../../components/ErrorAlert";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { Input, Select } from "../../components/Field";
import { paths } from "../../router/paths";
import { ITEM_CATEGORIES, ITEM_UNITS } from "../../types/item";
import type { Item, ItemCategory, ItemUnit } from "../../types/item";

interface ItemFormProps {
  initial?: Item;
}

export function ItemForm({ initial }: ItemFormProps) {
  const {
    isEditing,
    form,
    fieldErrors,
    isPending,
    success,
    error,
    errorDetails,
    createdId,
    updateField,
    handleSubmit,
  } = useItemForm(initial);

  return (
    <form onSubmit={handleSubmit} noValidate className="grid max-w-md gap-4">
      {success && (
        <div
          role="status"
          className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800"
        >
          {success}
        </div>
      )}
      {error && (
        <ErrorAlert
          message={error}
          {...(errorDetails ? { details: errorDetails } : {})}
        />
      )}

      <FormField label="SKU" id="sku" error={fieldErrors.sku}>
        <Input
          value={form.sku}
          onChange={(e) => updateField("sku", e.target.value)}
          maxLength={64}
          required
          disabled={isPending}
          aria-invalid={fieldErrors.sku ? true : undefined}
          aria-describedby={fieldErrors.sku ? "sku-error" : undefined}
        />
      </FormField>

      <FormField label="Name" id="name" error={fieldErrors.name}>
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
              {category}
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

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isPending} disabled={isPending}>
          {isPending ? "Saving…" : isEditing ? "Update" : "Create"}
        </Button>
        {createdId && (
          <Link
            to={paths.itemDetail(createdId)}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            View item
          </Link>
        )}
      </div>
    </form>
  );
}
