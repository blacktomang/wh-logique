import { Link } from "react-router-dom";
import { ItemForm } from "../features/items/ItemForm";
import { paths } from "../router/paths";

export function ItemNewPage() {
  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div>
        <Link to={paths.items}>← Back to items</Link>
      </div>
      <h1>New item</h1>
      <ItemForm />
    </div>
  );
}
