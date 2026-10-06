import { NavLink, Outlet } from "react-router-dom";
import { paths } from "../router/paths";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
    isActive
      ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]"
      : "text-white/65 hover:bg-white/7 hover:text-white"
  }`;

function InventoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[1.1rem] w-[1.1rem]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4.5 7.5 12 3l7.5 4.5v9L12 21l-7.5-4.5v-9Z" />
      <path d="m4.8 7.7 7.2 4.2 7.2-4.2M12 12v8.6" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[1.1rem] w-[1.1rem]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

export function AppLayout() {
  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-white/8 bg-ink-950/96 text-white shadow-[0_12px_35px_rgb(23_32_31/0.18)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-5 px-4 py-3 sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-7">
            <NavLink to={paths.items} className="group flex shrink-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
              <span className="grid h-9 w-9 place-items-center rounded-[0.65rem] bg-amber-400 text-ink-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_7px_18px_rgb(0_0_0/0.18)] transition-transform duration-200 group-hover:-rotate-2 group-hover:scale-105">
                <span className="text-sm font-black tracking-[-0.08em]">WH</span>
              </span>
              <span className="hidden sm:block">
                <strong className="block text-[0.95rem] leading-tight tracking-[-0.02em]">WH Logique</strong>
                <span className="block text-[0.65rem] font-medium tracking-[0.14em] text-white/45">WAREHOUSE DESK</span>
              </span>
            </NavLink>
            <nav aria-label="Primary navigation" className="flex items-center gap-1">
              <NavLink to={paths.items} className={navLinkClass}>
                <InventoryIcon />
                <span>Inventory</span>
              </NavLink>
              <NavLink to={paths.locations} className={navLinkClass}>
                <LocationIcon />
                <span>Locations</span>
              </NavLink>
            </nav>
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-white/55 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgb(52_211_153/0.1)]" />
            System online
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-[90rem] flex-1 px-4 pb-16 pt-8 sm:px-7 sm:pt-10 lg:px-10 lg:pt-12">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
