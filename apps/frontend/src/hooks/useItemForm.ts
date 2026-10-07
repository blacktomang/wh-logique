import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../api/client";
import { useCreateItem, useSKUAvailability, useUpdateItem } from "./useItems";
import { errorDescription, errorMessage } from "./useErrorToast";
import { useToast } from "../contexts/toast";
import type { Item, ItemCategory, ItemInput, ItemUnit } from "../types/item";
import type { SKUAvailabilityStatusValue } from "../features/items/SKUAvailabilityStatus";

export interface ItemFormValues {
  sku: string;
  name: string;
  category: ItemCategory | "";
  unit: ItemUnit | "";
}

export type ItemFormFieldName = keyof ItemFormValues;

export type ItemFormFieldErrors = Partial<Record<ItemFormFieldName, string>>;

const requiredMessage = "This field is required";
const SKU_AVAILABILITY_DEBOUNCE_MS = 400;

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}

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

  const normalizedSKU = form.sku.trim().toUpperCase();
  const initialSKU = initial?.sku.trim().toUpperCase() ?? "";
  const shouldCheckSKU =
    normalizedSKU.length > 0 &&
    normalizedSKU.length <= 64 &&
    normalizedSKU !== initialSKU;
  const debouncedSKU = useDebouncedValue(normalizedSKU, SKU_AVAILABILITY_DEBOUNCE_MS);
  const isSKUReadyToCheck = shouldCheckSKU && debouncedSKU === normalizedSKU;
  const skuAvailabilityQuery = useSKUAvailability(
    debouncedSKU,
    initial?.id,
    isSKUReadyToCheck,
  );

  let skuAvailabilityStatus: SKUAvailabilityStatusValue = "idle";
  if (shouldCheckSKU && (!isSKUReadyToCheck || skuAvailabilityQuery.isFetching)) {
    skuAvailabilityStatus = "checking";
  } else if (isSKUReadyToCheck && skuAvailabilityQuery.isError) {
    skuAvailabilityStatus = "error";
  } else if (isSKUReadyToCheck && skuAvailabilityQuery.data?.data) {
    skuAvailabilityStatus = skuAvailabilityQuery.data.data.available
      ? "available"
      : "unavailable";
  }

  const skuAvailabilityError =
    skuAvailabilityStatus === "unavailable" ? "SKU is already in use" : undefined;

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
    if (skuAvailabilityError) errors.sku = skuAvailabilityError;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Check the item details", "Complete all required fields before saving.");
      return;
    }

    if (skuAvailabilityStatus === "checking") return;

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
      if (err instanceof ApiError) {
        const apiFieldErrors = err.details.reduce<ItemFormFieldErrors>(
          (result, detail) => {
            if (detail.field && detail.field in form) {
              result[detail.field as ItemFormFieldName] = detail.reason;
            }
            return result;
          },
          {},
        );
        if (Object.keys(apiFieldErrors).length > 0) {
          setFieldErrors((current) => ({ ...current, ...apiFieldErrors }));
        }
      }
      toast.error(errorMessage(err, "Failed to save item"), errorDescription(err));
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isSubmitDisabled =
    isPending ||
    skuAvailabilityStatus === "checking" ||
    skuAvailabilityStatus === "unavailable";

  return {
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
  };
}
