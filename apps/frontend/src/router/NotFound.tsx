import { Link } from "react-router-dom";
import { paths } from "./paths";
import { Button } from "../components/Button";

export function NotFound() {
  return (
    <section className="grid min-h-[60dvh] place-items-center text-center">
      <div className="max-w-md">
        <p className="font-mono text-sm font-bold tracking-[0.15em] text-sage-700">ERROR 404</p>
        <h1 className="mt-3 text-4xl font-bold tracking-[-0.045em] text-ink-950">This aisle doesn’t exist.</h1>
        <p className="mt-4 text-pretty leading-7 text-ink-600">The page may have moved, or the address may be incorrect. Return to inventory to keep working.</p>
        <Link to={paths.items} className="mt-7 inline-block"><Button>View inventory</Button></Link>
      </div>
    </section>
  );
}
