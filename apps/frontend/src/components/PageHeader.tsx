import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-5 border-b border-ink-950/10 pb-7 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-[0.7rem] font-bold tracking-[0.17em] text-sage-700 uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-balance text-3xl font-bold leading-[1.05] tracking-[-0.045em] text-ink-950 sm:text-[2.65rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-[62ch] text-pretty text-[0.95rem] leading-6 text-ink-600">
          {description}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
