import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
}

export function SoilMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative inline-flex h-11 w-11 items-center justify-center rounded-full border-[5px] border-[#445d30] bg-[#dbe79d] shadow-[inset_0_0_0_4px_rgba(68,93,48,0.08)]',
        className,
      )}
    >
      <span className="absolute h-3 w-3 rounded-full bg-[#445d30]" />
      <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-[#445d30]" />
    </div>
  );
}

export function MobileAppShell({
  eyebrow,
  title,
  subtitle,
  backHref,
  backLabel = 'Voltar',
  headerAction,
  navItems,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  headerAction?: ReactNode;
  navItems?: NavItem[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-8 xl:px-8">
      <div className="mx-auto w-full max-w-[1480px]">
        <div className="relative overflow-hidden rounded-[34px] border border-[#d4deb1] bg-[#f6f7eb] shadow-[0_28px_90px_rgba(42,61,26,0.22)] lg:rounded-[40px]">
          <div className="relative flex min-h-[calc(100dvh-2rem)] flex-col lg:min-h-[calc(100vh-4rem)] lg:flex-row">
            {navItems?.length ? (
              <aside className="hidden lg:flex lg:w-[252px] lg:flex-col lg:border-r lg:border-[#d7e0bf] lg:bg-[linear-gradient(180deg,#edf1c6_0%,#e7ecc1_48%,#eef2d7_100%)] lg:px-5 lg:py-6">
                <div className="rounded-[28px] bg-white/54 px-4 py-4 shadow-[0_20px_40px_rgba(51,71,34,0.08)]">
                  <div className="flex items-center gap-3">
                    <SoilMark className="h-10 w-10 border-[4px]" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#61744c]">
                        Processo Seletivo
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[#22311d]">
                        Soil
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-5 text-[#5d6d53]">
                    Navegacao principal do painel operacional.
                  </p>
                </div>

                <nav className="mt-6 space-y-2">
                  {navItems.map(({ href, icon: Icon, label, active }) => (
                    <Link
                      key={`${href}-${label}-desktop`}
                      href={href}
                      className={cn(
                        'flex min-h-[60px] items-center gap-3 rounded-[22px] px-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#6d7d61] transition',
                        active &&
                          'bg-white text-[#2e7f3f] shadow-[0_16px_30px_rgba(75,109,47,0.12)]',
                      )}
                    >
                      <Icon size={18} strokeWidth={2.1} />
                      <span>{label}</span>
                    </Link>
                  ))}
                </nav>

                <div className="mt-auto rounded-[24px] bg-[#2f8f41] px-4 py-4 text-[#fdfef8] shadow-[0_22px_36px_rgba(47,143,65,0.24)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/76">
                    Ambiente
                  </p>
                  <p className="mt-2 text-lg font-semibold">Operacao ativa</p>
                  <p className="mt-2 text-sm leading-5 text-white/76">
                    Dados em tempo real, comandos e historico no mesmo fluxo.
                  </p>
                </div>
              </aside>
            ) : null}

            <div className="relative flex min-h-full flex-1 flex-col">
              <div className="relative overflow-hidden px-5 pb-5 pt-5 lg:px-8 lg:pb-6 lg:pt-7">
                <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,#edf1c6_0%,#e6eabb_54%,#f6f7eb_100%)] lg:h-36" />
                <div className="absolute inset-x-0 top-0 h-28 bg-[repeating-linear-gradient(140deg,rgba(147,166,80,0.18)_0_10px,rgba(255,255,255,0)_10px_24px)] opacity-60 lg:h-36" />
                <div className="absolute right-[-22px] top-[-22px] h-24 w-24 rounded-full bg-[#b6d281]/45 blur-2xl lg:h-32 lg:w-32" />

                <div className="relative flex items-center justify-between gap-3">
                  {backHref ? (
                    <Link
                      href={backHref}
                      className="inline-flex items-center gap-1 rounded-full bg-[#f9fbf1]/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#50653c]"
                    >
                      <ChevronLeft size={14} />
                      {backLabel}
                    </Link>
                  ) : (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#61744c] lg:hidden">
                      Processo Seletivo
                    </p>
                  )}

                  {headerAction ?? (
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#f9fbf1]/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#50653c] lg:hidden">
                      <SoilMark className="h-5 w-5 border-[2.5px]" />
                      SOIL
                    </div>
                  )}
                </div>

                <div className="relative mt-6 lg:mt-8">
                  {eyebrow ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#667851] lg:text-xs">
                      {eyebrow}
                    </p>
                  ) : null}
                  <h1 className="mt-2 text-[29px] font-semibold leading-[1.05] text-[#22311d] lg:max-w-3xl lg:text-[42px]">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="mt-2 max-w-[270px] text-sm leading-5 text-[#5f6f55] lg:max-w-2xl lg:text-base">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </div>

              <div
                className={cn(
                  'relative flex-1 px-4 pb-[92px] pt-2 lg:px-8 lg:pb-8 lg:pt-4',
                  className,
                )}
              >
                {children}
              </div>

              {navItems?.length ? (
                <div
                  className="absolute inset-x-0 bottom-0 border-t border-[#d7e0bf] bg-[#eef3d9]/92 px-3 pt-3 backdrop-blur-xl lg:hidden"
                  style={{
                    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
                  }}
                >
                  <div className="grid grid-cols-4 gap-2">
                    {navItems.map(({ href, icon: Icon, label, active }) => (
                      <Link
                        key={`${href}-${label}`}
                        href={href}
                        className={cn(
                          'flex min-h-[58px] flex-col items-center justify-center rounded-[18px] px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7d8d70] transition',
                          active &&
                            'bg-[#ffffff] text-[#2e7f3f] shadow-[0_12px_24px_rgba(75,109,47,0.12)]',
                        )}
                      >
                        <Icon size={18} strokeWidth={2.1} />
                        <span className="mt-1">{label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
