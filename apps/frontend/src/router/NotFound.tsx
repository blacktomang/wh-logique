import { Link } from "react-router-dom";
import { paths } from "./paths";

export function NotFound() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>404 — Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to={paths.items}>View items</Link>
    </div>
  );
}
