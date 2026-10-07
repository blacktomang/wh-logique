import { useState } from "react";
import type { FormEvent } from "react";
import { useCreateItem, useUpdateItem } from "./useItems";
import { errorDescription, errorMessage } from "./useErrorToast";
import { useToast } from "../contexts/toast";
import type { Item, ItemCategory, ItemInput, ItemUnit } from "../types/item";

export interface ItemFormValues {
  sku: string;
  name: string;
  category: ItemCategory | "";
  unit: ItemUnit | "";
}

export type ItemFormFieldName = keyof ItemFormValues;

export type ItemFormFieldErrors = Partial<Record<ItemFormFieldName, string>>;

const requiredMessage = "This field is required";

export function useItemForm(initial?: Item) {
  const isEditing = Boolean(initial);
  const toast = useToast();

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem(initial?.id ?? "");

  const [form, setForm] = useState<ItemFormValues>({
    sku: initial?.sku ?? "",
    name: initial?.name ?? "",
    category: initial?.category ?? "",
    unit: initial?.unit ?? "",
  });

  const [fieldErrors, setFieldErrors] = useState<ItemFormFieldErrors>({});
  const [createdId, setCreatedId] = useState<string | null>(null);

  function updateField<K extends ItemFormFieldName>(
    key: K,
    value: ItemFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear the field's stale validation message as soon as it is edited.
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(): { input: ItemInput; errors: ItemFormFieldErrors } {
    const errors: ItemFormFieldErrors = {};

    const sku = form.sku.trim();
    if (!sku) errors.sku = requiredMessage;

    const name = form.name.trim();
    if (!name) errors.name = requiredMessage;

    if (!form.category) errors.category = requiredMessage;
    if (!form.unit) errors.unit = requiredMessage;

    return {
      input: {
        sku,
        name,
        category: form.category as ItemCategory,
        unit: form.unit as ItemUnit,
      },
      errors,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setCreatedId(null);

    const { input, errors } = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Check the item details", "Complete all required fields before saving.");
      return;
    }

    try {
      if (isEditing && initial) {
        const envelope = await updateMutation.mutateAsync(input);
        toast.success(envelope.message || "Item updated successfully");
      } else {
        const envelope = await createMutation.mutateAsync(input);
        toast.success(envelope.message || "Item created successfully");
        if (envelope.data?.id) setCreatedId(envelope.data.id);
      }
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save item"), errorDescription(err));
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return {
    isEditing,
    form,
    fieldErrors,
    isPending,
    createdId,
    updateField,
    handleSubmit,
  };
}
