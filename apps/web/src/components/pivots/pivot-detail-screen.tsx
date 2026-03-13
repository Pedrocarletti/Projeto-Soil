'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Compass,
  Gauge,
  History,
  House,
  Info,
  MapPinned,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Sprout,
  Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { RequireAuth } from '@/components/auth/require-auth';
import { ControlPanel } from '@/components/pivots/control-panel';
import { HistoryChart } from '@/components/pivots/history-chart';
import { Card } from '@/components/ui/card';
import { WeatherCard } from '@/components/weather/weather-card';
import { useRealtimePivots } from '@/hooks/use-realtime-pivots';
import { getPivot, getPivotHistory, getWeather } from '@/lib/api';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import type { Pivot, WeatherResponse } from '@/types/domain';

interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard?tab=pivots',
    icon: House,
    label: 'Fazendas',
  },
  {
    href: '/dashboard?tab=pivots',
    icon: Sprout,
    label: 'Pivos',
    active: true,
  },
  {
    icon: CalendarDays,
    label: 'Agenda',
    disabled: true,
  },
  {
    href: '/dashboard?tab=historico',
    icon: History,
    label: 'Historico',
  },
  {
    href: '/dashboard?tab=mapa',
    icon: MapPinned,
    label: 'Mapa',
  },
];

export function PivotDetailScreen({ pivotId }: { pivotId: string }) {
  const { token } = useAuth();
  const [pivot, setPivot] = useState<Pivot | null>(null);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const authToken = token;

    if (!authToken) {
      return;
    }

    try {
      const pivotResponse = await getPivot(pivotId, authToken);
      const historyResponse = await getPivotHistory(pivotId, authToken);
      const weatherResponse = await getWeather(
        pivotResponse.latitude,
        pivotResponse.longitude,
        authToken,
      );

      setPivot({
        ...pivotResponse,
        states: historyResponse,
      });
      setWeather(weatherResponse);
      setError(null);
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }, [pivotId, token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useRealtimePivots({
    enabled: Boolean(token),
    pivotId,
    token,
    onDetail: (incomingPivot) => {
      if (incomingPivot.id === pivotId) {
        setPivot(incomingPivot);
      }
    },
  });

  const lastState = useMemo(() => pivot?.states[0] ?? null, [pivot]);

  const scrollToMoreInfo = useCallback(() => {
    document
      .getElementById('more-info')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <RequireAuth>
      <main className="min-h-screen bg-[#151513] lg:p-1">
        <div className="min-h-screen bg-[#dbdbd7] lg:grid lg:grid-cols-[304px_minmax(0,1fr)]">
          <DetailSidebar navItems={NAV_ITEMS} />

          <div className="flex min-h-screen flex-col">
            <PivotHero pivot={pivot} onReload={reload} />

            <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
              <MobileNav navItems={NAV_ITEMS} />

              {error ? (
                <p className="rounded-[22px] border border-[#efc7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#ae4343]">
                  {error}
                </p>
              ) : null}

              {!pivot ? (
                <Card className="mt-6 bg-[#f4f4ee] text-sm text-[#5f6656]">
                  Carregando telemetria e configuracoes do pivo...
                </Card>
              ) : (
                <>
                  <div className="mt-2 grid gap-4 md:max-w-[840px] md:grid-cols-2">
                    <HeroActionButton
                      icon={RefreshCw}
                      label="Atualizar painel"
                      onClick={() => void reload()}
                    />
                    <HeroActionButton
                      icon={Info}
                      label="Mais informacoes"
                      onClick={scrollToMoreInfo}
                    />
                  </div>

                  <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <section className="rounded-[34px] bg-[rgba(255,255,255,0.14)] px-5 py-5 shadow-[inset_0_0_0_1px_rgba(121,132,102,0.18)] sm:px-7 sm:py-7">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h2 className="text-[30px] font-semibold leading-none text-[#299247] sm:text-[36px]">
                            Situacao atual do pivo
                          </h2>
                          <p className="mt-2 max-w-[440px] text-sm leading-6 text-[#5e6558]">
                            Leitura em tempo real do equipamento com o mesmo
                            foco visual da proposta do Figma.
                          </p>
                        </div>

                        <span
                          className={cn(
                            'rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]',
                            pivot.live.isOn
                              ? 'bg-[#e8f4df] text-[#2a9348]'
                              : 'bg-[#f1e3e3] text-[#b34848]',
                          )}
                        >
                          {pivot.live.isOn ? 'Operacao ativa' : 'Operacao parada'}
                        </span>
                      </div>

                      <div className="mt-6">
                        <StatusOverviewRail
                          leftLabel="Desligado"
                          rightLabel="Ligado"
                          activeSide={pivot.live.isOn ? 'right' : 'left'}
                        />
                      </div>

                      <div className="mt-7 max-w-[332px] rounded-[28px] border border-[#c8c8c2] bg-[#e6e6e2] px-5 py-5 shadow-[0_14px_34px_rgba(87,87,81,0.08)]">
                        <LiveSummaryRow
                          icon={Waves}
                          label="Estado"
                          value={pivot.live.isIrrigating ? 'Com agua' : 'Sem agua'}
                          iconTone="blue"
                        />
                        <LiveSummaryRow
                          icon={
                            pivot.live.direction === 'counter-clockwise'
                              ? RotateCcw
                              : RotateCw
                          }
                          label="Sentido"
                          value={getDirectionLabel(pivot.live.direction)}
                          iconTone="neutral"
                          className="mt-4"
                        />
                        <LiveSummaryRow
                          icon={Gauge}
                          label="Percentimetro"
                          value={`${formatNumber(pivot.live.percentimeter, {
                            maximumFractionDigits: 0,
                          })}%`}
                          iconTone="green"
                          className="mt-4"
                        />
                      </div>

                      <div className="mt-7 grid gap-3 sm:grid-cols-3">
                        <StatPill
                          icon={Compass}
                          label="Angulo"
                          value={`${formatNumber(pivot.live.angle, {
                            maximumFractionDigits: 1,
                          })} deg`}
                        />
                        <StatPill
                          icon={Waves}
                          label="Lamina"
                          value={`${formatNumber(pivot.live.appliedBlade, {
                            maximumFractionDigits: 1,
                          })} mm`}
                        />
                        <StatPill
                          icon={Clock3}
                          label="Ultima leitura"
                          value={
                            lastState ? formatDate(lastState.timestamp) : 'Sem dados'
                          }
                        />
                      </div>
                    </section>

                    {token ? (
                      <ControlPanel pivot={pivot} token={token} onSuccess={reload} />
                    ) : null}
                  </div>

                  <div
                    id="more-info"
                    className="mt-10 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_360px]"
                  >
                    <HistoryChart pivot={pivot} />

                    <div className="space-y-5">
                      <Card className="bg-[#f6f5ef]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6c7a5d]">
                          Ultimo estado
                        </p>
                        <h3 className="mt-2 text-[28px] font-semibold leading-tight text-[#25311f]">
                          {lastState
                            ? formatDate(lastState.timestamp)
                            : 'Sem registro recente'}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#5e6856]">
                          Fechamento:{' '}
                          {lastState?.endedAt
                            ? formatDate(lastState.endedAt)
                            : 'Ciclo em aberto'}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <StatPill
                            icon={
                              pivot.live.direction === 'counter-clockwise'
                                ? RotateCcw
                                : RotateCw
                            }
                            label="Sentido"
                            value={getDirectionLabel(pivot.live.direction)}
                          />
                          <StatPill
                            icon={Gauge}
                            label="Percentimetro"
                            value={`${formatNumber(pivot.live.percentimeter, {
                              maximumFractionDigits: 0,
                            })}%`}
                          />
                        </div>
                      </Card>

                      <WeatherCard weather={weather} title="Condicao local" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}

function PivotHero({
  pivot,
  onReload,
}: {
  pivot: Pivot | null;
  onReload: () => void;
}) {
  return (
    <header className="relative min-h-[220px] overflow-hidden border-b border-[#d6d6d2] lg:min-h-[270px]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/pivot-hero.svg')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(242,231,190,0.78)_0%,rgba(249,245,226,0.48)_42%,rgba(255,255,255,0)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.32),transparent_32%)]" />

      <div className="relative px-4 pb-8 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <Link
            href="/dashboard?tab=pivots"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/72 text-[#3b3e38] shadow-[0_12px_28px_rgba(74,70,47,0.12)] backdrop-blur-[2px]"
          >
            <ArrowLeft size={18} />
          </Link>

          <button
            type="button"
            onClick={onReload}
            className="inline-flex items-center gap-2 rounded-full bg-white/74 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#556148] shadow-[0_12px_28px_rgba(74,70,47,0.12)] backdrop-blur-[2px]"
          >
            <RefreshCw size={14} />
            Atualizar
          </button>
        </div>

        <div className="hidden items-center justify-end gap-3 lg:flex">
          <span
            className={cn(
              'rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] shadow-[0_10px_24px_rgba(74,70,47,0.1)] backdrop-blur-[2px]',
              pivot?.live.isOn
                ? 'bg-[#f7fbf1]/82 text-[#299247]'
                : 'bg-[#fff4f1]/82 text-[#b34d48]',
            )}
          >
            {pivot?.live.isOn ? 'Ligado' : 'Desligado'}
          </span>
          <button
            type="button"
            onClick={onReload}
            className="inline-flex items-center gap-2 rounded-full bg-white/74 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#556148] shadow-[0_10px_24px_rgba(74,70,47,0.1)] backdrop-blur-[2px]"
          >
            <RefreshCw size={14} />
            Atualizar
          </button>
        </div>

        <div className="mt-8 max-w-[540px] rounded-[30px] bg-[#f3ead1]/64 px-5 py-6 shadow-[0_18px_40px_rgba(82,75,42,0.08)] backdrop-blur-[2px] lg:mt-10 lg:px-7 lg:py-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#60704c]">
            {pivot?.farm.name ?? 'Operacao Soil'}
          </p>
          <h1 className="mt-2 text-[48px] font-semibold leading-none text-[#303434] lg:text-[66px]">
            Pivos
          </h1>
          <p className="mt-1 text-[27px] font-medium text-[#4c4d47] lg:text-[34px]">
            {pivot?.name ?? 'Carregando pivo'}
          </p>
          <p className="mt-3 max-w-[420px] text-sm leading-6 text-[#5d6654] lg:text-base">
            {pivot
              ? `Codigo ${pivot.code} com comandos remotos, leitura ao vivo e ajuste visual alinhado a referencia.`
              : 'Carregando telemetria, historico e configuracoes operacionais.'}
          </p>
        </div>
      </div>
    </header>
  );
}

function DetailSidebar({ navItems }: { navItems: NavItem[] }) {
  return (
    <aside className="hidden min-h-screen flex-col bg-[#d2d9b4] text-[#444843] lg:flex">
      <div className="px-7 pt-6">
        <Link
          href="/dashboard?tab=pivots"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#3d403a] transition hover:bg-white/35"
        >
          <ArrowLeft size={24} />
        </Link>
      </div>

      <nav className="mt-5 border-y border-white/42">
        {navItems.map((item) => (
          <SidebarNavItem key={item.label} item={item} />
        ))}
      </nav>

      <SidebarBrand />
    </aside>
  );
}

function SidebarNavItem({ item }: { item: NavItem }) {
  const content = (
    <>
      <item.icon size={26} strokeWidth={1.8} />
      <span>{item.label}</span>
    </>
  );

  const className = cn(
    'flex h-[54px] items-center gap-3 border-b border-white/42 px-8 text-[20px] font-medium transition',
    item.active ? 'text-[#2a9348]' : 'text-[#4c5148]',
    item.disabled && 'cursor-default opacity-60',
  );

  if (item.disabled || !item.href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}

function SidebarBrand() {
  return (
    <div className="mt-auto px-8 pb-10 pt-8">
      <div className="inline-flex flex-col text-[#2a341d]">
        <div className="flex items-end leading-none">
          <span className="text-[76px] font-extrabold tracking-[-0.14em]">
            S
          </span>
          <span className="relative ml-1 text-[76px] font-extrabold tracking-[-0.14em]">
            O
            <span className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d8e18d]" />
            <span className="absolute -right-2 top-0 h-6 w-6 rounded-full border-2 border-[#95ac5d] opacity-70" />
          </span>
          <span className="ml-1 text-[76px] font-extrabold tracking-[-0.14em]">
            IL
          </span>
        </div>
        <p className="mt-1 pl-1 text-[10px] uppercase tracking-[0.62em] text-[#64714c]">
          Tecnologia
        </p>
      </div>
    </div>
  );
}

function MobileNav({ navItems }: { navItems: NavItem[] }) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
      {navItems.map((item) => {
        const className = cn(
          'inline-flex min-w-max items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]',
          item.active
            ? 'bg-[#2a9348] text-white'
            : 'bg-[#eff1e8] text-[#607055]',
          item.disabled && 'opacity-60',
        );

        if (item.disabled || !item.href) {
          return (
            <span key={item.label} className={className}>
              <item.icon size={14} />
              {item.label}
            </span>
          );
        }

        return (
          <Link key={item.label} href={item.href} className={className}>
            <item.icon size={14} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function HeroActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-[#299247] px-6 py-4 text-sm font-semibold text-white shadow-[0_20px_38px_rgba(41,146,71,0.22)] transition hover:bg-[#247d3d]"
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

function StatusOverviewRail({
  leftLabel,
  rightLabel,
  activeSide,
}: {
  leftLabel: string;
  rightLabel: string;
  activeSide: 'left' | 'right';
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[#2b3126]">
      <span
        className={cn(
          'text-[15px] font-semibold',
          activeSide === 'left' ? 'text-[#2a9449]' : 'text-[#51604a]',
        )}
      >
        {leftLabel}
      </span>
      <StatusSeal tone="red" active={activeSide === 'left'}>
        OFF
      </StatusSeal>
      <div className="relative h-5 w-14 rounded-full bg-[#c8c8c4]">
        <span
          className={cn(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#299247] transition-all',
            activeSide === 'right' ? 'left-[34px]' : 'left-[4px]',
          )}
        />
      </div>
      <StatusSeal tone="green" active={activeSide === 'right'}>
        ON
      </StatusSeal>
      <span
        className={cn(
          'text-[15px] font-semibold',
          activeSide === 'right' ? 'text-[#2a9449]' : 'text-[#51604a]',
        )}
      >
        {rightLabel}
      </span>
    </div>
  );
}

function StatusSeal({
  tone,
  active,
  children,
}: {
  tone: 'red' | 'green';
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center text-[9px] font-bold text-white shadow-[0_8px_16px_rgba(0,0,0,0.08)]',
        active ? 'opacity-100' : 'opacity-55',
      )}
      style={{
        clipPath:
          'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
        backgroundColor: tone === 'red' ? '#dd4f48' : '#2e8f49',
      }}
    >
      {children}
    </span>
  );
}

function LiveSummaryRow({
  icon: Icon,
  label,
  value,
  iconTone,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  iconTone: 'blue' | 'green' | 'neutral';
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-[#2a9449]">{label}:</p>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-full',
            iconTone === 'blue' && 'bg-[#a6dcf4] text-[#1b99c7]',
            iconTone === 'green' && 'bg-[#d9ead3] text-[#2a9449]',
            iconTone === 'neutral' && 'bg-white text-[#252825]',
          )}
        >
          <Icon size={19} />
        </span>
        <p className="text-right text-[15px] font-semibold text-[#2a9449]">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#d2d2cc] bg-[#f0f0eb] px-4 py-4">
      <Icon size={16} className="text-[#2a9348]" />
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#708062]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#22311d]">{value}</p>
    </div>
  );
}

function getDirectionLabel(direction: string) {
  if (direction === 'counter-clockwise') {
    return 'Reverso';
  }

  if (direction === 'clockwise') {
    return 'Avanco';
  }

  return 'Parado';
}
