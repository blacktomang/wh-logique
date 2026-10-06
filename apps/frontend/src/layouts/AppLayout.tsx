import { NavLink, Outlet } from "react-router-dom";
import { paths } from "../router/paths";

const navLinkStyle = ({ isActive }: { isActive: boolean }) =>
  ({
    padding: "0.5rem 1rem",
    borderRadius: "0.375rem",
    color: isActive ? "#fff" : "#e5e7eb",
    background: isActive ? "#374151" : "transparent",
  }) as const;

export function AppLayout() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          background: "#111827",
          color: "#fff",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <strong style={{ marginRight: "1rem" }}>WH Logique</strong>
        <nav style={{ display: "flex", gap: "0.5rem" }}>
          <NavLink to={paths.items} style={navLinkStyle}>
            Items
          </NavLink>
          <NavLink to={paths.locations} style={navLinkStyle}>
            Locations
          </NavLink>
        </nav>
      </header>
      <main style={{ flex: 1, padding: "1.5rem", maxWidth: "72rem", width: "100%", margin: "0 auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
