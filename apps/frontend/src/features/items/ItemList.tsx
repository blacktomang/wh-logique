import { useState } from "react";
import { Link } from "react-router-dom";
import { useItems, useDeleteItem } from "../../hooks/useItems";
import { ApiError } from "../../api/client";
import { Spinner } from "../../components/Spinner";
import { ErrorAlert } from "../../components/ErrorAlert";
import { EmptyState } from "../../components/EmptyState";
import { paths } from "../../router/paths";
import { formatDate } from "../../utils/format";
import { ITEM_CATEGORIES } from "../../types/item";
import type { ItemCategory } from "../../types/item";

export function ItemList() {
  const [category, setCategory] = useState<ItemCategory | undefined>(undefined);
  const { data, isPending, isError, error } = useItems(
    category ? { category } : {},
  );
  const deleteMutation = useDeleteItem();

  const items = data?.data ?? [];

  if (isPending) return <Spinner />;
  if (isError) {
    return <ErrorAlert message={error instanceof ApiError ? error.message : "Failed to load items"} />;
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          Category
          <select
            value={category ?? ""}
            onChange={(e) => setCategory((e.target.value as ItemCategory) || undefined)}
          >
            <option value="">All</option>
            {ITEM_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <Link to={paths.itemNew}>New item</Link>
      </div>

      {items.length === 0 ? (
        <EmptyState message="No items found." />
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>SKU</th>
              <th style={{ textAlign: "left" }}>Name</th>
              <th style={{ textAlign: "left" }}>Category</th>
              <th style={{ textAlign: "left" }}>Unit</th>
              <th style={{ textAlign: "left" }}>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.sku}</td>
                <td>
                  <Link to={paths.itemDetail(item.id)}>{item.name}</Link>
                </td>
                <td>{item.category}</td>
                <td>{item.unit}</td>
                <td>{formatDate(item.created_at)}</td>
                <td>
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(item.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
