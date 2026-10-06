import { useState } from "react";
import type { FormEvent } from "react";
import { useCreateItem, useUpdateItem } from "./useItems";
import { ApiError } from "../api/client";
import type { ErrorDetail } from "../types/api";
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

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem(initial?.id ?? "");

  const [form, setForm] = useState<ItemFormValues>({
    sku: initial?.sku ?? "",
    name: initial?.name ?? "",
    category: initial?.category ?? "",
    unit: initial?.unit ?? "",
  });

  const [fieldErrors, setFieldErrors] = useState<ItemFormFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetail[] | undefined>(
    undefined,
  );
  const [success, setSuccess] = useState<string | null>(null);
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
    setError(null);
    setErrorDetails(undefined);
    setSuccess(null);
    setCreatedId(null);

    const { input, errors } = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      if (isEditing && initial) {
        const envelope = await updateMutation.mutateAsync(input);
        setSuccess(envelope.message || "Item updated successfully");
      } else {
        const envelope = await createMutation.mutateAsync(input);
        setSuccess(envelope.message || "Item created successfully");
        if (envelope.data?.id) setCreatedId(envelope.data.id);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrorDetails(err.details.length > 0 ? err.details : undefined);
      } else {
        setError("Failed to save item");
      }
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return {
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
  };
}
