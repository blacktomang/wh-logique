import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateItem, useUpdateItem } from "../../hooks/useItems";
import { ApiError } from "../../api/client";
import { ErrorAlert } from "../../components/ErrorAlert";
import { paths } from "../../router/paths";
import { ITEM_CATEGORIES, ITEM_UNITS } from "../../types/item";
import type { Item, ItemInput } from "../../types/item";

interface ItemFormProps {
  initial?: Item;
}

interface FormState {
  sku: string;
  name: string;
  category: ItemInput["category"];
  unit: ItemInput["unit"];
}

export function ItemForm({ initial }: ItemFormProps) {
  const navigate = useNavigate();
  const isEditing = Boolean(initial);

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem(initial?.id ?? "");

  const [form, setForm] = useState<FormState>({
    sku: initial?.sku ?? "",
    name: initial?.name ?? "",
    category: initial?.category ?? ITEM_CATEGORIES[0],
    unit: initial?.unit ?? ITEM_UNITS[0],
  });

  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const input: ItemInput = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      category: form.category,
      unit: form.unit,
    };

    try {
      if (isEditing && initial) {
        await updateMutation.mutateAsync(input);
        navigate(paths.itemDetail(initial.id));
      } else {
        await createMutation.mutateAsync(input);
        navigate(paths.items);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save item");
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: "1rem", maxWidth: "32rem" }}
    >
      {error && <ErrorAlert message={error} />}

      <label style={{ display: "grid", gap: "0.25rem" }}>
        SKU
        <input
          value={form.sku}
          onChange={(e) => updateField("sku", e.target.value)}
          required
          maxLength={64}
        />
      </label>

      <label style={{ display: "grid", gap: "0.25rem" }}>
        Name
        <input
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
          maxLength={255}
        />
      </label>

      <label style={{ display: "grid", gap: "0.25rem" }}>
        Category
        <select
          value={form.category}
          onChange={(e) => updateField("category", e.target.value as FormState["category"])}
        >
          {ITEM_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "grid", gap: "0.25rem" }}>
        Unit
        <select
          value={form.unit}
          onChange={(e) => updateField("unit", e.target.value as FormState["unit"])}
        >
          {ITEM_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : isEditing ? "Update" : "Create"}
      </button>
    </form>
  );
}
