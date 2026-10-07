import { Link } from "react-router-dom";
import { ItemList } from "../features/items/ItemList";
import { Button } from "../components/Button";
import { PageHeader } from "../components/PageHeader";
import { paths } from "../router/paths";

export function ItemsPage() {
  return (
    <section>
      <PageHeader
        eyebrow="Inventory control"
        title="Items"
        description="Find, review, and maintain every item moving through your warehouse."
        action={
          <Link to={paths.itemNew}>
            <Button><span className="text-lg font-medium leading-none" aria-hidden="true">+</span>New item</Button>
          </Link>
        }
      />
      <ItemList />
    </section>
  );
}
