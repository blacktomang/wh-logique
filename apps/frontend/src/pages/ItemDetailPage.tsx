import { useParams, Link } from "react-router-dom";
import { useItem, useDeleteItem } from "../hooks/useItems";
import { ApiError } from "../api/client";
import { Spinner } from "../components/Spinner";
import { ErrorAlert } from "../components/ErrorAlert";
import { paths } from "../router/paths";
import { ItemForm } from "../features/items/ItemForm";
import { formatDate } from "../utils/format";
import { useNavigate } from "react-router-dom";

export function ItemDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, isPending, isError, error } = useItem(id);
  const deleteMutation = useDeleteItem();

  if (isPending) return <Spinner />;
  if (isError) {
    return <ErrorAlert message={error instanceof ApiError ? error.message : "Failed to load item"} />;
  }

  const item = data?.data;
  if (!item) return <ErrorAlert message="Item not found" />;

  async function handleDelete() {
    await deleteMutation.mutateAsync(item!.id);
    navigate(paths.items);
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div>
        <Link to={paths.items}>← Back to items</Link>
      </div>
      <h1>{item.name}</h1>
      <dl>
        <dt>SKU</dt>
        <dd>{item.sku}</dd>
        <dt>Category</dt>
        <dd>{item.category}</dd>
        <dt>Unit</dt>
        <dd>{item.unit}</dd>
        <dt>Created</dt>
        <dd>{formatDate(item.created_at)}</dd>
      </dl>
      <button type="button" onClick={handleDelete} disabled={deleteMutation.isPending}>
        Delete
      </button>
      <h2>Edit</h2>
      <ItemForm initial={item} />
    </div>
  );
}
