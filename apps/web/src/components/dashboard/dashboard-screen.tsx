'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock3,
  CloudSun,
  Droplets,
  Gauge,
  History,
  House,
  LogOut,
  MapPinned,
  RotateCcw,
  RotateCw,
  Search,
  Sprout,
  Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { RequireAuth } from '@/components/auth/require-auth';
import { HistoryChart } from '@/components/pivots/history-chart';
import { PivotWheel } from '@/components/pivots/pivot-wheel';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { WeatherCard } from '@/components/weather/weather-card';
import { getPivotHistory, getPivots, getWeather } from '@/lib/api';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { useRealtimePivots } from '@/hooks/use-realtime-pivots';
import type { Pivot, PivotState, WeatherResponse } from '@/types/domain';

type DashboardTab = 'pivots' | 'mapa' | 'historico';

interface DashboardNavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
}

export function DashboardScreen({
  initialTab = 'pivots',
}: {
  initialTab?: DashboardTab;
}) {
  const { token, logout } = useAuth();
  const currentTab = initialTab;
  const [pivots, setPivots] = useState<Pivot[]>([]);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mapPivotId, setMapPivotId] = useState<string | null>(null);
  const [historyPivotId, setHistoryPivotId] = useState<string | null>(null);
  const [historyStates, setHistoryStates] = useState<PivotState[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!token) {
      return;
    }

    async function loadDashboard() {
      const authToken = token;

      if (!authToken) {
        return;
      }

      try {
        const pivotsResponse = await getPivots(authToken);
        setPivots(pivotsResponse);
        setMapPivotId((current) => current ?? pivotsResponse[0]?.id ?? null);
        setHistoryPivotId((current) => current ?? pivotsResponse[0]?.id ?? null);

        const firstPivot = pivotsResponse[0];
        if (firstPivot) {
          const weatherResponse = await getWeather(
            firstPivot.latitude,
            firstPivot.longitude,
            authToken,
          );
          setWeather(weatherResponse);
        }
      } catch (loadError) {
        setError((loadError as Error).message);
      }
    }

    void loadDashboard();
  }, [token]);

  useEffect(() => {
    if (!pivots.length) {
      return;
    }

    if (!mapPivotId || !pivots.some((pivot) => pivot.id === mapPivotId)) {
      setMapPivotId(pivots[0]?.id ?? null);
    }

    if (
      !historyPivotId ||
      !pivots.some((pivot) => pivot.id === historyPivotId)
    ) {
      setHistoryPivotId(pivots[0]?.id ?? null);
    }
  }, [historyPivotId, mapPivotId, pivots]);

  useEffect(() => {
    if (currentTab !== 'historico') {
      return;
    }

    const authToken = token;
    const selectedHistoryPivotId = historyPivotId;

    if (
      typeof authToken !== 'string' ||
      typeof selectedHistoryPivotId !== 'string'
    ) {
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      try {
        const response = await getPivotHistory(
          selectedHistoryPivotId!,
          authToken!,
        );
        if (!cancelled) {
          setHistoryStates(response);
          setHistoryError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setHistoryError((loadError as Error).message);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [currentTab, historyPivotId, token]);

  useRealtimePivots({
    enabled: Boolean(token),
    token,
    onSnapshot: (incomingPivot) => {
      setPivots((currentPivots) =>
        currentPivots.some((pivot) => pivot.id === incomingPivot.id)
          ? currentPivots.map((pivot) =>
              pivot.id === incomingPivot.id ? incomingPivot : pivot,
            )
          : [incomingPivot, ...currentPivots],
      );
    },
  });

  const filteredPivots = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return pivots;
    }

    return pivots.filter((pivot) =>
      `${pivot.name} ${pivot.farm.name} ${pivot.code}`
        .toLowerCase()
        .includes(query),
    );
  }, [deferredSearch, pivots]);

  const irrigatingCount = useMemo(
    () => pivots.filter((pivot) => pivot.live.isIrrigating).length,
    [pivots],
  );

  const mapPivot =
    pivots.find((pivot) => pivot.id === mapPivotId) ?? pivots[0] ?? null;

  const historyPivot =
    pivots.find((pivot) => pivot.id === historyPivotId) ?? pivots[0] ?? null;

  const historyPivotView = historyPivot
    ? {
        ...historyPivot,
        states: historyStates.length ? historyStates : historyPivot.states,
      }
    : null;

  const navItems = getDashboardNavItems(currentTab);

  return (
    <RequireAuth>
      <main className="min-h-screen bg-[#151513] lg:p-1">
        <div className="min-h-screen bg-[#dbdbd7] lg:grid lg:grid-cols-[308px_minmax(0,1fr)]">
          <DashboardSidebar navItems={navItems} />

          <div className="flex min-h-screen flex-col">
            <DashboardHero currentTab={currentTab} onLogout={logout} />

            <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
              <MobileDashboardNav navItems={navItems} />

              {error ? (
                <p className="rounded-[22px] border border-[#efc7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#ae4343]">
                  {error}
                </p>
              ) : null}

              {currentTab === 'pivots' ? (
                <PivotCatalogView
                  pivots={filteredPivots}
                  search={search}
                  onSearchChange={setSearch}
                />
              ) : null}

              {currentTab === 'mapa' ? (
                pivots.length > 0 ? (
                  <div className="mt-6">
                    <DashboardMapView
                      pivots={pivots}
                      selectedPivotId={mapPivot?.id ?? null}
                      onSelect={setMapPivotId}
                      weather={weather}
                    />
                  </div>
                ) : (
                  <EmptyDashboardState message="Nenhum pivo encontrado para exibir no mapa." />
                )
              ) : null}

              {currentTab === 'historico' ? (
                pivots.length > 0 ? (
                  <div className="mt-6">
                    <DashboardHistoryView
                      pivots={pivots}
                      selectedPivotId={historyPivot?.id ?? null}
                      onSelect={setHistoryPivotId}
                      pivot={historyPivotView}
                      error={historyError}
                      irrigatingCount={irrigatingCount}
                    />
                  </div>
                ) : (
                  <EmptyDashboardState message="Nenhum pivo encontrado para exibir no historico." />
                )
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}

function PivotCatalogView({
  pivots,
  search,
  onSearchChange,
}: {
  pivots: Pivot[];
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <section>
      <div className="mx-auto mt-2 max-w-[430px]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#a8b0bc]"
            size={24}
          />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-[56px] rounded-full border-none bg-white/75 pl-15 text-base shadow-[0_18px_30px_rgba(113,113,113,0.08)] placeholder:text-[#b7bdc6]"
            placeholder="Procurar"
          />
        </div>
      </div>

      {pivots.length === 0 ? (
        <EmptyDashboardState message="Nenhum pivo encontrado para o filtro atual." />
      ) : (
        <div className="mt-9 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {pivots.map((pivot) => (
            <PivotCatalogCard key={pivot.id} pivot={pivot} />
          ))}
        </div>
      )}
    </section>
  );
}

function PivotCatalogCard({ pivot }: { pivot: Pivot }) {
  const isActive = pivot.live.isOn;
  const directionIcon =
    pivot.live.direction === 'counter-clockwise' ? RotateCcw : RotateCw;
  const lastUpdate = getPivotLastUpdateLabel(pivot);

  return (
    <Link
      href={`/pivots/${pivot.id}`}
      className="block transition duration-200 hover:-translate-y-1"
    >
      <article className="overflow-hidden rounded-[16px] bg-[#259640] text-white shadow-[0_18px_34px_rgba(24,98,42,0.24)]">
        <div className="flex items-start justify-between gap-3 bg-[#58ad69] px-5 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-[20px] font-semibold leading-none">
              {pivot.name}
            </h3>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isActive ? (
              <RoundStatusBubble icon={directionIcon} tone="neutral" />
            ) : null}
            {isActive ? (
              <WaterStateBubble irrigating={pivot.live.isIrrigating} />
            ) : null}
            <CardStateSeal active={isActive} />
          </div>
        </div>

        <div
          className={cn(
            'px-5 py-4',
            isActive && 'grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end',
          )}
        >
          {isActive ? (
            <div className="text-[14px] font-medium leading-6 text-white/96">
              <p>
                Percentimetro:{' '}
                {formatNumber(pivot.live.percentimeter, {
                  maximumFractionDigits: 0,
                })}
                %
              </p>
              <p>
                Lamina:{' '}
                {formatNumber(pivot.live.appliedBlade, {
                  maximumFractionDigits: 1,
                })}{' '}
                mm
              </p>
            </div>
          ) : null}

          <div className={cn('text-[12px] leading-5 text-white/96', isActive && 'sm:text-right')}>
            <p className="font-semibold text-white/82">Ultima atualizacao:</p>
            <p className="mt-1">{lastUpdate}</p>
          </div>
        </div>
      </article>
    </Link>
  );
}

function RoundStatusBubble({
  icon: Icon,
  tone,
}: {
  icon: LucideIcon;
  tone: 'neutral' | 'blue';
}) {
  return (
    <span
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full',
        tone === 'neutral' && 'bg-white text-[#222723]',
        tone === 'blue' && 'bg-[#a8dcf2] text-[#1799c7]',
      )}
    >
      <Icon size={18} />
    </span>
  );
}

function WaterStateBubble({ irrigating }: { irrigating: boolean }) {
  return (
    <span
      className={cn(
        'relative inline-flex h-8 w-8 items-center justify-center rounded-full',
        irrigating ? 'bg-[#a8dcf2] text-[#1799c7]' : 'bg-white text-[#1799c7]',
      )}
    >
      <Droplets size={18} />
      {!irrigating ? (
        <span className="absolute h-[2px] w-7 rotate-[-45deg] rounded-full bg-[#ff4037]" />
      ) : null}
    </span>
  );
}

function CardStateSeal({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-8 min-w-[34px] items-center justify-center px-1 text-[7px] font-bold uppercase tracking-[0.06em] text-white',
        active ? 'opacity-100' : 'opacity-92',
      )}
      style={{
        clipPath:
          'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
        backgroundColor: active ? '#2e8f49' : '#ef2f2f',
      }}
    >
      {active ? 'Ligado' : 'Parado'}
    </span>
  );
}

function EmptyDashboardState({ message }: { message: string }) {
  return (
    <Card className="mt-8 bg-[#f4f4ee] text-sm text-[#5e6d54]">{message}</Card>
  );
}

function DashboardHero({
  currentTab,
  onLogout,
}: {
  currentTab: DashboardTab;
  onLogout: () => void;
}) {
  const copy =
    currentTab === 'mapa'
      ? {
          title: 'Mapa',
          subtitle: 'acompanhe a distribuicao dos pivos em campo',
        }
      : currentTab === 'historico'
        ? {
            title: 'Historico',
            subtitle: 'acompanhe leituras e variacao operacional',
          }
        : {
            title: 'Pivos',
            subtitle: 'selecione o pivo desejado',
          };

  return (
    <header className="relative min-h-[182px] overflow-hidden border-b border-[#d6d6d2] lg:min-h-[182px]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/pivot-hero.svg')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(242,231,190,0.78)_0%,rgba(249,245,226,0.48)_42%,rgba(255,255,255,0)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.32),transparent_32%)]" />

      <div className="relative px-4 pb-5 pt-5 sm:px-6 lg:px-10 lg:pb-4 lg:pt-7">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <Link
            href="/"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/72 text-[#3b3e38] shadow-[0_12px_28px_rgba(74,70,47,0.12)] backdrop-blur-[2px]"
          >
            <ArrowLeft size={18} />
          </Link>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full bg-white/74 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#556148] shadow-[0_12px_28px_rgba(74,70,47,0.12)] backdrop-blur-[2px]"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>

        <div className="hidden items-center justify-end lg:flex">
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full bg-white/74 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#556148] shadow-[0_10px_24px_rgba(74,70,47,0.1)] backdrop-blur-[2px]"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>

        <div className="mt-5 max-w-[560px] rounded-[30px] bg-[#f3ead1]/64 px-5 py-5 shadow-[0_18px_40px_rgba(82,75,42,0.08)] backdrop-blur-[2px] lg:mt-0 lg:px-7 lg:py-4">
          <h1 className="text-[48px] font-semibold leading-none text-[#303434] lg:text-[58px]">
            {copy.title}
          </h1>
          <p className="mt-1 text-[24px] font-medium text-[#4c4d47] lg:text-[22px]">
            {copy.subtitle}
          </p>
        </div>
      </div>
    </header>
  );
}

function DashboardSidebar({ navItems }: { navItems: DashboardNavItem[] }) {
  return (
    <aside className="hidden min-h-screen flex-col bg-[#d2d9b4] text-[#444843] lg:flex">
      <div className="px-7 pt-6">
        <Link
          href="/"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#3d403a] transition hover:bg-white/35"
        >
          <ArrowLeft size={24} />
        </Link>
      </div>

      <nav className="mt-5 border-y border-white/42">
        {navItems.map((item) => (
          <DashboardSidebarItem key={item.label} item={item} />
        ))}
      </nav>

      <DashboardBrand />
    </aside>
  );
}

function DashboardSidebarItem({ item }: { item: DashboardNavItem }) {
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

function DashboardBrand() {
  return (
    <div className="mt-auto px-8 pb-10 pt-8">
      <div className="inline-flex flex-col text-[#2a341d]">
        <div className="flex items-end leading-none">
          <span className="text-[76px] font-extrabold tracking-[-0.14em]">S</span>
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

function MobileDashboardNav({ navItems }: { navItems: DashboardNavItem[] }) {
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

function getDashboardNavItems(currentTab: DashboardTab): DashboardNavItem[] {
  return [
    {
      href: '/dashboard?tab=pivots',
      icon: House,
      label: 'Fazendas',
      active: false,
    },
    {
      href: '/dashboard?tab=pivots',
      icon: Sprout,
      label: 'Pivos',
      active: currentTab === 'pivots',
    },
    {
      icon: Clock3,
      label: 'Agenda',
      disabled: true,
    },
    {
      href: '/dashboard?tab=historico',
      icon: History,
      label: 'Historico',
      active: currentTab === 'historico',
    },
    {
      href: '/dashboard?tab=mapa',
      icon: MapPinned,
      label: 'Mapa',
      active: currentTab === 'mapa',
    },
  ];
}

function getPivotLastUpdateLabel(pivot: Pivot) {
  const lastStateTimestamp = pivot.states[0]?.timestamp;

  if (lastStateTimestamp) {
    return formatDate(lastStateTimestamp);
  }

  const fallback = getStatusStringValue(pivot.status, 'receivedAt');
  return fallback ? formatDate(fallback) : 'Aguardando leitura';
}

function getStatusStringValue(
  status: Pivot['status'],
  key: string,
): string | null {
  if (!status || typeof status !== 'object' || Array.isArray(status)) {
    return null;
  }

  const value = status[key];
  return typeof value === 'string' ? value : null;
}

function SummaryChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-[#f1f5df] px-3 py-3 lg:h-full">
      <div className="flex items-center justify-between gap-2">
        <Icon size={15} className="text-[#2e7f3f]" />
        <span className="text-xs font-semibold text-[#23311d]">{value}</span>
      </div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#718061]">
        {label}
      </p>
    </div>
  );
}

function DashboardMapView({
  pivots,
  selectedPivotId,
  onSelect,
  weather,
}: {
  pivots: Pivot[];
  selectedPivotId: string | null;
  onSelect: (id: string) => void;
  weather: WeatherResponse | null;
}) {
  const selectedPivot =
    pivots.find((pivot) => pivot.id === selectedPivotId) ?? pivots[0] ?? null;
  const latitudes = pivots.map((pivot) => pivot.latitude);
  const longitudes = pivots.map((pivot) => pivot.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1.25fr)_360px] lg:items-start lg:gap-4 lg:space-y-0">
      <Card className="overflow-hidden p-0 lg:min-h-[620px]">
        <div className="relative h-[320px] overflow-hidden rounded-[24px] bg-[#7d6240] lg:h-full lg:min-h-[620px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,#4c7239_0_14%,transparent_15%),radial-gradient(circle_at_75%_35%,#537436_0_18%,transparent_19%),radial-gradient(circle_at_48%_66%,#5a7d3d_0_16%,transparent_17%),linear-gradient(135deg,#6a4b33_0%,#7d5c3f_38%,#456534_100%)] opacity-95" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.04)_0_12px,rgba(0,0,0,0)_12px_24px)]" />

          {pivots.map((pivot) => {
            const left = 14 + ((pivot.longitude - minLng) / lngRange) * 70;
            const top = 16 + ((maxLat - pivot.latitude) / latRange) * 62;
            const isActive = pivot.id === selectedPivot?.id;

            return (
              <button
                key={pivot.id}
                type="button"
                onClick={() => onSelect(pivot.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition hover:scale-105"
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                <PivotWheel
                  angle={pivot.live.angle}
                  percentimeter={pivot.live.percentimeter}
                  size={isActive ? 92 : 74}
                  tileClassName={
                    isActive
                      ? 'rounded-full bg-[#7d6240]/70 p-1.5 shadow-[0_16px_26px_rgba(0,0,0,0.28)]'
                      : 'rounded-full bg-[#7d6240]/50 p-1 shadow-none'
                  }
                />
              </button>
            );
          })}

          <div className="absolute bottom-4 left-4 rounded-[18px] bg-[#f8f8ef]/92 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5f6d54] shadow-[0_18px_30px_rgba(18,24,11,0.18)]">
            Visao operacional
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {selectedPivot ? (
          <Card className="bg-[#fffef8]">
            <div className="flex items-start gap-4">
              <PivotWheel
                angle={selectedPivot.live.angle}
                percentimeter={selectedPivot.live.percentimeter}
                size={84}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7f63]">
                  {selectedPivot.farm.name}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-[#22311d]">
                  {selectedPivot.name}
                </h3>
                <p className="mt-2 text-sm leading-5 text-[#5e6d54]">
                  Codigo {selectedPivot.code} - percentimetro em{' '}
                  {formatNumber(selectedPivot.live.percentimeter, {
                    maximumFractionDigits: 0,
                  })}
                  %
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <MapMetric
                icon={Gauge}
                label="Angulo"
                value={`${formatNumber(selectedPivot.live.angle, {
                  maximumFractionDigits: 0,
                })} deg`}
              />
              <MapMetric
                icon={Droplets}
                label="Modo"
                value={selectedPivot.live.isIrrigating ? 'Agua' : 'Movimento'}
              />
              <MapMetric
                icon={Clock3}
                label="Estado"
                value={selectedPivot.live.isOn ? 'Ligado' : 'Parado'}
              />
              <MapMetric
                icon={Waves}
                label="Lamina"
                value={`${formatNumber(selectedPivot.live.appliedBlade, {
                  maximumFractionDigits: 1,
                })} mm`}
              />
            </div>
          </Card>
        ) : null}

        <WeatherCard weather={weather} title="Condicao da area" />
      </div>
    </div>
  );
}

function MapMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-[#f1f5df] px-3 py-3">
      <Icon size={15} className="text-[#2e7f3f]" />
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#708062]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#22311d]">{value}</p>
    </div>
  );
}

function DashboardHistoryView({
  pivots,
  selectedPivotId,
  onSelect,
  pivot,
  error,
  irrigatingCount,
}: {
  pivots: Pivot[];
  selectedPivotId: string | null;
  onSelect: (id: string) => void;
  pivot: Pivot | null;
  error: string | null;
  irrigatingCount: number;
}) {
  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-4 lg:space-y-0">
      <div className="space-y-4 lg:sticky lg:top-6">
        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {pivots.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={
                item.id === selectedPivotId
                  ? 'rounded-full bg-[#319747] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white lg:rounded-[20px] lg:px-4 lg:py-3 lg:text-left'
                  : 'rounded-full bg-[#fffef8] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d7c61] lg:rounded-[20px] lg:px-4 lg:py-3 lg:text-left'
              }
            >
              {item.name}
            </button>
          ))}
        </div>

        <Card className="bg-[#fffef8]">
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <SummaryChip
              icon={History}
              label="Leituras"
              value={String(pivot?.states.length ?? 0)}
            />
            <SummaryChip
              icon={Droplets}
              label="Agua"
              value={String(irrigatingCount)}
            />
            <SummaryChip
              icon={CloudSun}
              label="Foco"
              value={pivot?.name ?? '--'}
            />
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {error ? (
          <p className="rounded-[18px] bg-[#fff1f1] px-4 py-3 text-sm text-[#b33c3c]">
            {error}
          </p>
        ) : null}

        {pivot ? (
          <>
            <Card className="bg-[#fffef8]">
              <div className="flex items-center gap-4">
                <PivotWheel
                  angle={pivot.live.angle}
                  percentimeter={pivot.live.percentimeter}
                  size={76}
                />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7f63]">
                    {pivot.farm.name}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-[#22311d]">
                    {pivot.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#5e6d54]">
                    Codigo {pivot.code} - ultimo pacote em{' '}
                    {pivot.states[0] ? formatDate(pivot.states[0].timestamp) : '--'}
                  </p>
                </div>
              </div>
            </Card>

            <HistoryChart pivot={pivot} />

            <div className="grid gap-3 xl:grid-cols-2">
              {pivot.states.slice(0, 4).map((state) => {
                const lastCycle = state.cycles[0];

                return (
                  <Card key={state.id} className="bg-[#fffef8]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#738264]">
                          Registro
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#22311d]">
                          {formatDate(state.timestamp)}
                        </p>
                      </div>
                      <Badge tone={state.endedAt ? 'neutral' : 'success'}>
                        {state.endedAt ? 'Fechado' : 'Em curso'}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <MapMetric
                        icon={Gauge}
                        label="Angulo"
                        value={`${formatNumber(lastCycle?.angle ?? 0, {
                          maximumFractionDigits: 1,
                        })} deg`}
                      />
                      <MapMetric
                        icon={Waves}
                        label="Lamina"
                        value={`${formatNumber(lastCycle?.appliedBlade ?? 0, {
                          maximumFractionDigits: 1,
                        })} mm`}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
