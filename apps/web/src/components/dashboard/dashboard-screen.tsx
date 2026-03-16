'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Clock3,
  CloudSun,
  Droplets,
  Gauge,
  History,
  House,
  LogOut,
  MapPinned,
  Pencil,
  Plus,
  RotateCcw,
  RotateCw,
  Search,
  Sprout,
  Trash2,
  Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { RequireAuth } from '@/components/auth/require-auth';
import { HistoryChart } from '@/components/pivots/history-chart';
import { PivotWheel } from '@/components/pivots/pivot-wheel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { WeatherCard } from '@/components/weather/weather-card';
import {
  createFarm,
  deleteFarm,
  getFarms,
  getPivotHistoryFiltered,
  getPivots,
  getWeather,
  updateFarm,
} from '@/lib/api';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import { useRealtimePivots } from '@/hooks/use-realtime-pivots';
import type {
  Farm,
  FarmRecord,
  Pivot,
  PivotState,
  WeatherResponse,
} from '@/types/domain';

type DashboardTab = 'fazendas' | 'pivots' | 'mapa' | 'historico';

interface DashboardNavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
}

type HistoryStatusFilter = 'all' | 'on' | 'off';
type HistoryModeFilter = 'all' | 'water' | 'movement';
type HistoryPeriodPreset = 'custom' | '24h' | '7d' | '30d';
type HistorySortOrder = 'recent' | 'oldest';

interface HistoryFiltersForm {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  status: HistoryStatusFilter;
  mode: HistoryModeFilter;
  periodPreset: HistoryPeriodPreset;
}

interface FarmFormValues {
  name: string;
  latitude: string;
  longitude: string;
}

export function DashboardScreen({
  initialTab = 'pivots',
  initialFarmId,
}: {
  initialTab?: DashboardTab;
  initialFarmId?: string;
}) {
  const { token, user, logout } = useAuth();
  const currentTab = initialTab;
  const currentFarmId = initialFarmId ?? null;
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [pivots, setPivots] = useState<Pivot[]>([]);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [farmError, setFarmError] = useState<string | null>(null);
  const [farmForm, setFarmForm] = useState<FarmFormValues>(() => createEmptyFarmForm());
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);
  const [isSavingFarm, setIsSavingFarm] = useState(false);
  const [isDeletingFarmId, setIsDeletingFarmId] = useState<string | null>(null);
  const [mapPivotId, setMapPivotId] = useState<string | null>(null);
  const [historyPivotId, setHistoryPivotId] = useState<string | null>(null);
  const [historyStates, setHistoryStates] = useState<PivotState[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyFiltersDraft, setHistoryFiltersDraft] = useState<HistoryFiltersForm>(
    () => createEmptyHistoryFilters(),
  );
  const [appliedHistoryFilters, setAppliedHistoryFilters] =
    useState<HistoryFiltersForm>(() => createEmptyHistoryFilters());
  const [historySortOrder, setHistorySortOrder] =
    useState<HistorySortOrder>('recent');
  const deferredSearch = useDeferredValue(search);
  const canManageFarms =
    user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  useEffect(() => {
    setSearch('');
  }, [currentFarmId, currentTab]);

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
        const [farmsResponse, pivotsResponse] = await Promise.all([
          getFarms(authToken),
          getPivots(authToken),
        ]);
        const nextFarmPivots = currentFarmId
          ? pivotsResponse.filter((pivot) => pivot.farmId === currentFarmId)
          : pivotsResponse;
        const firstRelevantPivot = nextFarmPivots[0] ?? pivotsResponse[0];

        setFarms(sortFarmRecords(farmsResponse));
        setPivots(pivotsResponse);
        setMapPivotId((current) => current ?? firstRelevantPivot?.id ?? null);
        setHistoryPivotId((current) => current ?? firstRelevantPivot?.id ?? null);

        if (firstRelevantPivot) {
          const weatherResponse = await getWeather(
            firstRelevantPivot.latitude,
            firstRelevantPivot.longitude,
            authToken,
          );
          setWeather(weatherResponse);
        }
      } catch (loadError) {
        setError((loadError as Error).message);
      }
    }

    void loadDashboard();
  }, [currentFarmId, token]);

  const farmScopedPivots = useMemo(
    () =>
      currentFarmId
        ? pivots.filter((pivot) => pivot.farmId === currentFarmId)
        : pivots,
    [currentFarmId, pivots],
  );

  const selectedFarm =
    farms.find((farm) => farm.id === currentFarmId) ?? null;

  const hasActiveHistoryFilters = useMemo(
    () => historyFiltersAreActive(appliedHistoryFilters),
    [appliedHistoryFilters],
  );

  function updateHistoryFiltersDraft(patch: Partial<HistoryFiltersForm>) {
    setHistoryFiltersDraft((current) => ({
      ...current,
      ...patch,
    }));
  }

  function applyHistoryFilters(filters = historyFiltersDraft) {
    const validationError = validateHistoryFilters(filters);

    if (validationError) {
      setHistoryError(validationError);
      return;
    }

    setHistoryError(null);
    setAppliedHistoryFilters(filters);
  }

  function clearHistoryFilters() {
    const emptyFilters = createEmptyHistoryFilters();
    setHistoryError(null);
    setHistoryFiltersDraft(emptyFilters);
    setAppliedHistoryFilters(emptyFilters);
  }

  function applyHistoryPeriodPreset(preset: Exclude<HistoryPeriodPreset, 'custom'>) {
    const presetFilters = createHistoryPresetFilters(
      preset,
      historyFiltersDraft,
    );

    setHistoryError(null);
    setHistoryFiltersDraft(presetFilters);
    setAppliedHistoryFilters(presetFilters);
  }

  function updateFarmForm(patch: Partial<FarmFormValues>) {
    setFarmForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function startCreateFarm() {
    setFarmError(null);
    setEditingFarmId(null);
    setFarmForm(createEmptyFarmForm());
  }

  function startEditFarm(farm: FarmRecord) {
    setFarmError(null);
    setEditingFarmId(farm.id);
    setFarmForm({
      name: farm.name,
      latitude: String(farm.latitude),
      longitude: String(farm.longitude),
    });
  }

  function cancelFarmEditing() {
    setFarmError(null);
    setEditingFarmId(null);
    setFarmForm(createEmptyFarmForm());
  }

  async function submitFarmForm() {
    if (!token) {
      return;
    }

    const payload = parseFarmForm(farmForm);

    if (!payload) {
      setFarmError(
        'Preencha nome, latitude e longitude com valores numericos validos.',
      );
      return;
    }

    try {
      setIsSavingFarm(true);
      setFarmError(null);

      const savedFarm = editingFarmId
        ? await updateFarm(editingFarmId, token, payload)
        : await createFarm(token, payload);

      setFarms((currentFarms) =>
        sortFarmRecords(
          editingFarmId
            ? currentFarms.map((farm) =>
                farm.id === editingFarmId ? savedFarm : farm,
              )
            : [...currentFarms, savedFarm],
        ),
      );
      setEditingFarmId(null);
      setFarmForm(createEmptyFarmForm());
    } catch (saveError) {
      setFarmError((saveError as Error).message);
    } finally {
      setIsSavingFarm(false);
    }
  }

  async function handleDeleteFarm(farm: FarmRecord) {
    if (!token) {
      return;
    }

    const confirmed = window.confirm(
      `Excluir a fazenda "${farm.name}"? Essa acao nao pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingFarmId(farm.id);
      setFarmError(null);
      await deleteFarm(farm.id, token);
      setFarms((currentFarms) =>
        currentFarms.filter((currentFarm) => currentFarm.id !== farm.id),
      );

      if (editingFarmId === farm.id) {
        setEditingFarmId(null);
        setFarmForm(createEmptyFarmForm());
      }
    } catch (deleteError) {
      setFarmError((deleteError as Error).message);
    } finally {
      setIsDeletingFarmId(null);
    }
  }

  useEffect(() => {
    if (!farmScopedPivots.length) {
      return;
    }

    if (
      !mapPivotId ||
      !farmScopedPivots.some((pivot) => pivot.id === mapPivotId)
    ) {
      setMapPivotId(farmScopedPivots[0]?.id ?? null);
    }

    if (
      !historyPivotId ||
      !farmScopedPivots.some((pivot) => pivot.id === historyPivotId)
    ) {
      setHistoryPivotId(farmScopedPivots[0]?.id ?? null);
    }
  }, [farmScopedPivots, historyPivotId, mapPivotId]);

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
        const response = await getPivotHistoryFiltered(
          selectedHistoryPivotId!,
          authToken!,
          buildHistoryApiFilters(appliedHistoryFilters),
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
  }, [appliedHistoryFilters, currentTab, historyPivotId, token]);

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
      return farmScopedPivots;
    }

    return farmScopedPivots.filter((pivot) =>
      `${pivot.name} ${pivot.farm.name} ${pivot.code}`
        .toLowerCase()
        .includes(query),
    );
  }, [deferredSearch, farmScopedPivots]);

  const mapPivot =
    farmScopedPivots.find((pivot) => pivot.id === mapPivotId) ??
    farmScopedPivots[0] ??
    null;

  const historyPivot =
    farmScopedPivots.find((pivot) => pivot.id === historyPivotId) ??
    farmScopedPivots[0] ??
    null;

  const historyPivotView = useMemo(
    () =>
      historyPivot
        ? {
            ...historyPivot,
            states: historyStates.length ? historyStates : historyPivot.states,
          }
        : null,
    [historyPivot, historyStates],
  );

  const filteredHistoryCycleCount = useMemo(
    () =>
      historyPivotView?.states.reduce(
        (totalCycles, state) => totalCycles + state.cycles.length,
        0,
      ) ?? 0,
    [historyPivotView],
  );

  const filteredHistoryWaterCount = useMemo(
    () =>
      historyPivotView?.states.filter((state) => state.isIrrigating).length ?? 0,
    [historyPivotView],
  );

  const navItems = getDashboardNavItems(currentTab, currentFarmId);
  const heroMobileContextLabel =
    currentTab === 'historico'
      ? historyPivot?.name ?? 'Selecione o pivo desejado'
      : currentTab === 'mapa'
        ? selectedFarm?.name ?? 'Visao operacional'
        : currentTab === 'pivots'
          ? selectedFarm?.name ?? 'Catalogo operacional'
          : undefined;
  const heroQuickAction =
    currentTab === 'historico' && currentFarmId
      ? {
          href: buildDashboardHref('mapa', currentFarmId),
          icon: MapPinned,
          label: 'Mapa',
        }
      : null;

  return (
    <RequireAuth>
      <main className="min-h-screen bg-[#151513] lg:p-1">
        <div className="min-h-screen bg-[#dbdbd7] lg:grid lg:grid-cols-[308px_minmax(0,1fr)]">
          <DashboardSidebar navItems={navItems} />

          <div className="flex min-h-screen flex-col">
            <DashboardHero
              currentTab={currentTab}
              onLogout={logout}
              mobileContextLabel={heroMobileContextLabel}
              quickAction={heroQuickAction}
            />

            <div className="px-4 pb-28 pt-6 sm:px-6 sm:pb-30 lg:px-10 lg:py-8">
              <MobileDashboardNav navItems={navItems} />

              {error ? (
                <p className="rounded-[22px] border border-[#efc7c7] bg-[#fff3f3] px-4 py-3 text-sm text-[#ae4343]">
                  {error}
                </p>
              ) : null}

              {currentTab === 'fazendas' ? (
                <FarmCatalogView
                  farms={farms}
                  canManage={canManageFarms}
                  farmForm={farmForm}
                  farmError={farmError}
                  editingFarmId={editingFarmId}
                  isSavingFarm={isSavingFarm}
                  isDeletingFarmId={isDeletingFarmId}
                  onFarmFormChange={updateFarmForm}
                  onStartCreateFarm={startCreateFarm}
                  onStartEditFarm={startEditFarm}
                  onCancelFarmEditing={cancelFarmEditing}
                  onSubmitFarm={submitFarmForm}
                  onDeleteFarm={handleDeleteFarm}
                />
              ) : null}

              {currentTab === 'pivots' ? (
                <PivotCatalogView
                  selectedFarm={selectedFarm}
                  pivots={filteredPivots}
                  search={search}
                  onSearchChange={setSearch}
                />
              ) : null}

              {currentTab === 'mapa' ? (
                farmScopedPivots.length > 0 ? (
                  <div className="mt-6">
                    <DashboardMapView
                      pivots={farmScopedPivots}
                      selectedPivotId={mapPivot?.id ?? null}
                      onSelect={setMapPivotId}
                      weather={weather}
                    />
                  </div>
                ) : (
                  <EmptyDashboardState
                    message={
                      selectedFarm
                        ? `Nenhum pivo encontrado para exibir no mapa da fazenda ${selectedFarm.name}.`
                        : 'Nenhum pivo encontrado para exibir no mapa.'
                    }
                  />
                )
              ) : null}

              {currentTab === 'historico' ? (
                farmScopedPivots.length > 0 ? (
                  <div className="mt-6">
                    <DashboardHistoryView
                      pivots={farmScopedPivots}
                      selectedPivotId={historyPivot?.id ?? null}
                      onSelect={setHistoryPivotId}
                      pivot={historyPivotView}
                      error={historyError}
                      filters={historyFiltersDraft}
                      hasActiveFilters={hasActiveHistoryFilters}
                      onFiltersChange={updateHistoryFiltersDraft}
                      onApplyFilters={applyHistoryFilters}
                      onClearFilters={clearHistoryFilters}
                      onApplyPeriodPreset={applyHistoryPeriodPreset}
                      sortOrder={historySortOrder}
                      onSortOrderChange={setHistorySortOrder}
                      cycleCount={filteredHistoryCycleCount}
                      waterStateCount={filteredHistoryWaterCount}
                    />
                  </div>
                ) : (
                  <EmptyDashboardState
                    message={
                      selectedFarm
                        ? `Nenhum pivo encontrado para exibir no historico da fazenda ${selectedFarm.name}.`
                        : 'Nenhum pivo encontrado para exibir no historico.'
                    }
                  />
                )
              ) : null}
            </div>
          </div>
        </div>

        <MobileBottomDashboardNav navItems={navItems} />
      </main>
    </RequireAuth>
  );
}

function FarmCatalogView({
  farms,
  canManage,
  farmForm,
  farmError,
  editingFarmId,
  isSavingFarm,
  isDeletingFarmId,
  onFarmFormChange,
  onStartCreateFarm,
  onStartEditFarm,
  onCancelFarmEditing,
  onSubmitFarm,
  onDeleteFarm,
}: {
  farms: FarmRecord[];
  canManage: boolean;
  farmForm: FarmFormValues;
  farmError: string | null;
  editingFarmId: string | null;
  isSavingFarm: boolean;
  isDeletingFarmId: string | null;
  onFarmFormChange: (patch: Partial<FarmFormValues>) => void;
  onStartCreateFarm: () => void;
  onStartEditFarm: (farm: FarmRecord) => void;
  onCancelFarmEditing: () => void;
  onSubmitFarm: () => Promise<void>;
  onDeleteFarm: (farm: FarmRecord) => Promise<void>;
}) {
  const isEditing = Boolean(editingFarmId);

  if (farms.length === 0) {
    return (
      <section className="space-y-4">
        {canManage ? (
          <FarmEditorCard
            farmForm={farmForm}
            farmError={farmError}
            isSavingFarm={isSavingFarm}
            isEditing={isEditing}
            onFarmFormChange={onFarmFormChange}
            onCancelFarmEditing={onCancelFarmEditing}
            onSubmitFarm={onSubmitFarm}
          />
        ) : null}

        <EmptyDashboardState message="Nenhuma fazenda encontrada para o ambiente atual." />
      </section>
    );
  }

  return (
    <section className="mt-2 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[26px] bg-[#eef2de] px-5 py-5 shadow-[0_16px_30px_rgba(122,136,84,0.08)]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7e60]">
            Operacao de fazendas
          </p>
          <h2 className="mt-2 text-[28px] font-semibold text-[#22311d]">
            Cadastro e selecao de fazendas
          </h2>
          <p className="mt-2 max-w-[720px] text-sm leading-6 text-[#5e6d54]">
            Cadastre novas fazendas, ajuste coordenadas e selecione o destino para
            abrir os pivots, o mapa e o historico da area escolhida.
          </p>
        </div>

        {canManage ? (
          <Button
            type="button"
            onClick={onStartCreateFarm}
            className="rounded-full px-5"
            variant="primary"
          >
            <Plus size={16} className="mr-2" />
            {isEditing ? 'Voltar para cadastro' : 'Cadastrar nova fazenda'}
          </Button>
        ) : null}
      </div>

      {canManage ? (
        <FarmEditorCard
          farmForm={farmForm}
          farmError={farmError}
          isSavingFarm={isSavingFarm}
          isEditing={isEditing}
          onFarmFormChange={onFarmFormChange}
          onCancelFarmEditing={onCancelFarmEditing}
          onSubmitFarm={onSubmitFarm}
        />
      ) : farmError ? (
        <p className="rounded-[18px] bg-[#fff1f1] px-4 py-3 text-sm text-[#b33c3c]">
          {farmError}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {farms.map((farm) => (
          <article
            key={farm.id}
            className="rounded-[20px] bg-[#259640] px-5 py-5 text-white shadow-[0_16px_32px_rgba(35,120,56,0.24)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/72">
                  Fazenda
                </p>
                <h3 className="mt-2 truncate text-[24px] font-semibold leading-none">
                  {farm.name}
                </h3>
              </div>

              <span className="rounded-full bg-white/18 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90">
                {farm.pivots.length} pivos
              </span>
            </div>

            <p className="mt-4 text-base font-medium leading-7 text-white/94">
              Localizacao: {getFarmLocationLabel(farm)}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href={buildDashboardHref('pivots', farm.id)}
                className="inline-flex rounded-full bg-[#edf7df] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#215b30] shadow-[0_10px_18px_rgba(17,61,30,0.12)] transition hover:bg-white"
              >
                Abrir fazenda
              </Link>

              {canManage ? (
                <>
                  <button
                    type="button"
                    onClick={() => onStartEditFarm(farm)}
                    className={cn(
                      'inline-flex items-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition',
                      editingFarmId === farm.id
                        ? 'bg-white/28'
                        : 'bg-white/16 hover:bg-white/24',
                    )}
                  >
                    <Pencil size={14} className="mr-2" />
                    {editingFarmId === farm.id ? 'Editando' : 'Editar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteFarm(farm)}
                    disabled={isDeletingFarmId === farm.id}
                    className="inline-flex items-center rounded-full bg-[#1d6e31] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#155425] disabled:opacity-60"
                  >
                    <Trash2 size={14} className="mr-2" />
                    {isDeletingFarmId === farm.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FarmEditorCard({
  farmForm,
  farmError,
  isSavingFarm,
  isEditing,
  onFarmFormChange,
  onCancelFarmEditing,
  onSubmitFarm,
}: {
  farmForm: FarmFormValues;
  farmError: string | null;
  isSavingFarm: boolean;
  isEditing: boolean;
  onFarmFormChange: (patch: Partial<FarmFormValues>) => void;
  onCancelFarmEditing: () => void;
  onSubmitFarm: () => Promise<void>;
}) {
  return (
    <Card className="bg-[#fffef8]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7e60]">
            {isEditing ? 'Editar fazenda' : 'Nova fazenda'}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[#22311d]">
            {isEditing ? 'Atualize os dados da fazenda' : 'Cadastre uma nova fazenda'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#5e6d54]">
            {isEditing
              ? 'Depois de salvar ou cancelar, o formulario volta automaticamente para o modo de cadastro.'
              : 'Preencha os dados abaixo para cadastrar uma nova fazenda no painel.'}
          </p>
        </div>

        {isEditing ? (
          <button
            type="button"
            onClick={onCancelFarmEditing}
            className="rounded-full bg-[#eef2e3] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#66755d] transition hover:bg-[#e2e9d2]"
          >
            Cancelar edicao
          </button>
        ) : null}
      </div>

      <form
        className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_180px_180px_auto] lg:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmitFarm();
        }}
      >
        <div>
          <label
            htmlFor="farm-name"
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#748264]"
          >
            Nome
          </label>
          <Input
            id="farm-name"
            value={farmForm.name}
            onChange={(event) => onFarmFormChange({ name: event.target.value })}
            className="mt-2 h-12 rounded-[16px]"
            placeholder="Ex.: Fazenda Boa Terra"
          />
        </div>

        <div>
          <label
            htmlFor="farm-latitude"
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#748264]"
          >
            Latitude
          </label>
          <Input
            id="farm-latitude"
            inputMode="decimal"
            value={farmForm.latitude}
            onChange={(event) =>
              onFarmFormChange({ latitude: event.target.value })
            }
            className="mt-2 h-12 rounded-[16px]"
            placeholder="-19.9167"
          />
        </div>

        <div>
          <label
            htmlFor="farm-longitude"
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#748264]"
          >
            Longitude
          </label>
          <Input
            id="farm-longitude"
            inputMode="decimal"
            value={farmForm.longitude}
            onChange={(event) =>
              onFarmFormChange({ longitude: event.target.value })
            }
            className="mt-2 h-12 rounded-[16px]"
            placeholder="-43.9345"
          />
        </div>

        <Button
          type="submit"
          className="h-12 rounded-[16px] px-6"
          disabled={isSavingFarm}
        >
          {isSavingFarm
            ? isEditing
              ? 'Salvando...'
              : 'Criando...'
            : isEditing
              ? 'Atualizar fazenda'
              : 'Cadastrar fazenda'}
        </Button>
      </form>

      {farmError ? (
        <p className="mt-4 rounded-[18px] bg-[#fff1f1] px-4 py-3 text-sm text-[#b33c3c]">
          {farmError}
        </p>
      ) : null}
    </Card>
  );
}

function PivotCatalogView({
  selectedFarm,
  pivots,
  search,
  onSearchChange,
}: {
  selectedFarm: Farm | null;
  pivots: Pivot[];
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <section>
      {selectedFarm ? (
        <div className="mx-auto mt-1 flex max-w-[860px] flex-wrap items-center justify-between gap-3 rounded-[20px] bg-[#f1f4e8] px-4 py-3 text-sm text-[#5f6d54] shadow-[0_14px_24px_rgba(121,132,92,0.08)]">
          <p>
            Fazenda selecionada:{' '}
            <span className="font-semibold text-[#22311d]">{selectedFarm.name}</span>
          </p>
          <Link
            href={buildDashboardHref('fazendas')}
            className="rounded-full bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2a9348] shadow-[0_10px_20px_rgba(121,132,92,0.1)]"
          >
            Trocar fazenda
          </Link>
        </div>
      ) : null}

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
        <EmptyDashboardState
          message={
            selectedFarm
              ? `Nenhum pivo encontrado para o filtro atual na fazenda ${selectedFarm.name}.`
              : 'Nenhum pivo encontrado para o filtro atual.'
          }
        />
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
  mobileContextLabel,
  quickAction,
}: {
  currentTab: DashboardTab;
  onLogout: () => void;
  mobileContextLabel?: string;
  quickAction?: {
    href: string;
    icon: LucideIcon;
    label: string;
  } | null;
}) {
  const copy =
    currentTab === 'fazendas'
      ? {
          title: 'Fazendas',
          subtitle: 'selecione a fazenda desejada',
        }
      : currentTab === 'mapa'
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/72 text-[#3b3e38] shadow-[0_12px_28px_rgba(74,70,47,0.12)] backdrop-blur-[2px]"
          >
            <ArrowLeft size={17} />
          </Link>

          <div className="flex items-center gap-2">
            {quickAction ? (
              <Link
                href={quickAction.href}
                className="inline-flex items-center gap-2 rounded-full bg-white/74 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#556148] shadow-[0_12px_28px_rgba(74,70,47,0.12)] backdrop-blur-[2px]"
              >
                <quickAction.icon size={14} />
                {quickAction.label}
              </Link>
            ) : null}

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/74 text-[#556148] shadow-[0_12px_28px_rgba(74,70,47,0.12)] backdrop-blur-[2px]"
              aria-label="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
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

        <div className="mt-5 max-w-[560px] rounded-[28px] bg-[#f3ead1]/64 px-5 py-4 shadow-[0_18px_40px_rgba(82,75,42,0.08)] backdrop-blur-[2px] lg:mt-0 lg:rounded-[30px] lg:px-7 lg:py-4">
          <h1 className="text-[26px] font-semibold leading-none text-[#303434] sm:text-[34px] lg:text-[58px]">
            {copy.title}
          </h1>
          <p className="mt-1 text-[14px] font-medium text-[#4c4d47] sm:text-[16px] lg:hidden">
            {mobileContextLabel ?? copy.subtitle}
          </p>
          <p className="mt-1 hidden text-[22px] font-medium text-[#4c4d47] lg:block">
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
    <div className="mb-6 hidden gap-2 overflow-x-auto pb-1 sm:flex lg:hidden">
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

function MobileBottomDashboardNav({
  navItems,
}: {
  navItems: DashboardNavItem[];
}) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d0d8ae] bg-[#dbe2b7]/96 px-2 pt-2 shadow-[0_-10px_28px_rgba(87,101,53,0.12)] backdrop-blur-sm lg:hidden"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
      }}
    >
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const className = cn(
            'flex min-h-[60px] flex-col items-center justify-center rounded-[16px] px-1 text-[10px] font-medium tracking-[-0.01em] transition',
            item.active
              ? 'text-[#2a9348]'
              : 'text-[#555a50]',
            item.disabled && 'opacity-60',
          );

          if (item.disabled || !item.href) {
            return (
              <span key={item.label} className={className}>
                <item.icon size={20} strokeWidth={1.85} />
                <span className="mt-1 text-center">{item.label}</span>
              </span>
            );
          }

          return (
            <Link key={item.label} href={item.href} className={className}>
              <item.icon size={20} strokeWidth={1.85} />
              <span className="mt-1 text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function getDashboardNavItems(
  currentTab: DashboardTab,
  farmId?: string | null,
): DashboardNavItem[] {
  return [
    {
      href: buildDashboardHref('fazendas'),
      icon: House,
      label: 'Fazendas',
      active: currentTab === 'fazendas',
    },
    {
      href: buildDashboardHref('pivots', farmId),
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
      href: buildDashboardHref('historico', farmId),
      icon: History,
      label: 'Historico',
      active: currentTab === 'historico',
    },
    {
      href: buildDashboardHref('mapa', farmId),
      icon: MapPinned,
      label: 'Mapa',
      active: currentTab === 'mapa',
    },
  ];
}

function buildDashboardHref(tab: DashboardTab, farmId?: string | null) {
  const params = new URLSearchParams({ tab });

  if (farmId) {
    params.set('farmId', farmId);
  }

  return `/dashboard?${params.toString()}`;
}

function createEmptyHistoryFilters(): HistoryFiltersForm {
  return {
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    status: 'all',
    mode: 'all',
    periodPreset: 'custom',
  };
}

function historyFiltersAreActive(filters: HistoryFiltersForm) {
  return Boolean(
    filters.startDate ||
      filters.startTime ||
      filters.endDate ||
      filters.endTime ||
      filters.status !== 'all' ||
      filters.mode !== 'all',
  );
}

function validateHistoryFilters(filters: HistoryFiltersForm) {
  const startAt = combineDateTimeToIso(
    filters.startDate,
    filters.startTime,
    'start',
  );
  const endAt = combineDateTimeToIso(filters.endDate, filters.endTime, 'end');

  if (startAt && endAt && new Date(startAt) > new Date(endAt)) {
    return 'O periodo inicial precisa ser menor ou igual ao periodo final.';
  }

  return null;
}

function createHistoryPresetFilters(
  preset: Exclude<HistoryPeriodPreset, 'custom'>,
  current: HistoryFiltersForm,
): HistoryFiltersForm {
  const endAt = new Date();
  const startAt = new Date(endAt);

  if (preset === '24h') {
    startAt.setHours(startAt.getHours() - 24);
  }

  if (preset === '7d') {
    startAt.setDate(startAt.getDate() - 7);
  }

  if (preset === '30d') {
    startAt.setDate(startAt.getDate() - 30);
  }

  return {
    ...current,
    startDate: formatDateInputValue(startAt),
    startTime: formatTimeInputValue(startAt),
    endDate: formatDateInputValue(endAt),
    endTime: formatTimeInputValue(endAt),
    periodPreset: preset,
  };
}

function buildHistoryApiFilters(filters: HistoryFiltersForm) {
  const startAt = combineDateTimeToIso(
    filters.startDate,
    filters.startTime,
    'start',
  );
  const endAt = combineDateTimeToIso(filters.endDate, filters.endTime, 'end');

  let isOn: boolean | undefined;
  let isIrrigating: boolean | undefined;

  if (filters.status === 'on') {
    isOn = true;
  }

  if (filters.status === 'off') {
    isOn = false;
  }

  if (filters.mode === 'water') {
    isIrrigating = true;
  }

  if (filters.mode === 'movement') {
    isIrrigating = false;
    isOn ??= true;
  }

  return {
    ...(startAt ? { startAt } : {}),
    ...(endAt ? { endAt } : {}),
    ...(typeof isOn === 'boolean' ? { isOn } : {}),
    ...(typeof isIrrigating === 'boolean' ? { isIrrigating } : {}),
    limit: 80,
  };
}

function combineDateTimeToIso(
  date: string,
  time: string,
  boundary: 'start' | 'end',
) {
  if (!date) {
    return undefined;
  }

  const normalizedTime =
    time || (boundary === 'start' ? '00:00' : '23:59');
  const localDate = new Date(`${date}T${normalizedTime}:00`);

  if (Number.isNaN(localDate.getTime())) {
    return undefined;
  }

  if (boundary === 'end') {
    localDate.setSeconds(59, 999);
  }

  return localDate.toISOString();
}

function formatDateInputValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatTimeInputValue(date: Date) {
  return [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
  ].join(':');
}

function createEmptyFarmForm(): FarmFormValues {
  return {
    name: '',
    latitude: '',
    longitude: '',
  };
}

function parseFarmForm(form: FarmFormValues) {
  const name = form.name.trim();
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);

  if (!name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  return {
    name,
    latitude,
    longitude,
  };
}

function sortFarmRecords(farms: FarmRecord[]) {
  return [...farms].sort((firstFarm, secondFarm) =>
    firstFarm.name.localeCompare(secondFarm.name, 'pt-BR'),
  );
}

function getFarmLocationLabel(farm: Farm) {
  return `${formatNumber(farm.latitude, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })}, ${formatNumber(farm.longitude, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })}`;
}

function formatDirectionLabel(direction: PivotState['direction']) {
  if (direction === 'CLOCKWISE') {
    return 'Horario';
  }

  if (direction === 'COUNTER_CLOCKWISE') {
    return 'Anti-horario';
  }

  return 'Parado';
}

function getHistoryStateLabel(state: PivotState) {
  if (!state.isOn) {
    return 'Desligado';
  }

  return state.isIrrigating ? 'Ligado com agua' : 'Ligado sem agua';
}

function getHistoryStateDotClass(state: PivotState) {
  if (!state.isOn) {
    return 'bg-[#8b8b85]';
  }

  return state.isIrrigating ? 'bg-[#1fb6ea]' : 'bg-[#94ad4f]';
}

function formatCompactDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
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
  filters,
  hasActiveFilters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  onApplyPeriodPreset,
  sortOrder,
  onSortOrderChange,
  cycleCount,
  waterStateCount,
}: {
  pivots: Pivot[];
  selectedPivotId: string | null;
  onSelect: (id: string) => void;
  pivot: Pivot | null;
  error: string | null;
  filters: HistoryFiltersForm;
  hasActiveFilters: boolean;
  onFiltersChange: (patch: Partial<HistoryFiltersForm>) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onApplyPeriodPreset: (
    preset: Exclude<HistoryPeriodPreset, 'custom'>,
  ) => void;
  sortOrder: HistorySortOrder;
  onSortOrderChange: (value: HistorySortOrder) => void;
  cycleCount: number;
  waterStateCount: number;
}) {
  const sortedStates = useMemo(() => {
    const states = [...(pivot?.states ?? [])];

    if (sortOrder === 'oldest') {
      return states.reverse();
    }

    return states;
  }, [pivot?.states, sortOrder]);

  return (
    <div className="space-y-4">
      <HistoryFilterPanel
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        resultCount={pivot?.states.length ?? 0}
        onFiltersChange={onFiltersChange}
        onApplyFilters={onApplyFilters}
        onClearFilters={onClearFilters}
        onApplyPeriodPreset={onApplyPeriodPreset}
      />

      <div className="grid gap-3 lg:hidden">
        <Card className="bg-[#fffef8]">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
            <div>
              <label
                htmlFor="history-pivot-mobile"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#738264]"
              >
                Pivo
              </label>
              <select
                id="history-pivot-mobile"
                value={selectedPivotId ?? ''}
                onChange={(event) => onSelect(event.target.value)}
                className="mt-2 h-12 w-full rounded-[16px] border border-[#dbe3ca] bg-white px-4 text-sm text-[#22311d] outline-none focus:border-[#7eb85f] focus:ring-2 focus:ring-[#7eb85f]/20"
              >
                {pivots.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="history-sort-mobile"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#738264]"
              >
                Filtrar por
              </label>
              <select
                id="history-sort-mobile"
                value={sortOrder}
                onChange={(event) =>
                  onSortOrderChange(event.target.value as HistorySortOrder)
                }
                className="mt-2 h-12 w-full rounded-[16px] border border-[#dbe3ca] bg-white px-4 text-sm text-[#22311d] outline-none focus:border-[#7eb85f] focus:ring-2 focus:ring-[#7eb85f]/20"
              >
                <option value="recent">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-4 lg:space-y-0">
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="hidden gap-2 overflow-x-auto pb-1 lg:flex lg:flex-col lg:overflow-visible">
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
                label="Com agua"
                value={String(waterStateCount)}
              />
              <SummaryChip
                icon={CloudSun}
                label="Ciclos"
                value={String(cycleCount)}
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

              <HistoryOverviewPanel pivot={pivot} />

              <div className="hidden lg:block">
                <HistoryChart pivot={pivot} />
              </div>

              {sortedStates.length === 0 ? (
                <EmptyDashboardState message="Nenhum registro encontrado para os filtros selecionados." />
              ) : (
                <>
                  <div className="space-y-3 lg:hidden">
                    {sortedStates.map((state) => (
                      <details
                        key={state.id}
                        className="overflow-hidden rounded-[20px] bg-[#2f9446] text-white shadow-[0_18px_32px_rgba(35,120,56,0.22)]"
                      >
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 bg-[#58ad69] px-4 py-4 [&::-webkit-details-marker]:hidden">
                          <div>
                            <p className="text-[24px] font-semibold leading-none">
                              {pivot.name}
                            </p>
                            <p className="mt-2 text-sm text-white/92">
                              Inicio: {formatCompactDateTime(state.timestamp)}
                            </p>
                            <p className="mt-1 text-sm text-white/92">
                              Termino:{' '}
                              {state.endedAt
                                ? formatCompactDateTime(state.endedAt)
                                : 'Em curso'}
                            </p>
                          </div>

                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/92">
                            Mais detalhes
                            <ChevronDown size={14} />
                          </span>
                        </summary>

                        <div className="grid gap-3 px-4 py-4 sm:grid-cols-2">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
                              Estado
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <HistoryStateChip
                                active={state.isOn}
                                label={state.isOn ? 'Ligado' : 'Parado'}
                              />
                              <HistoryStateChip
                                active={state.isIrrigating}
                                label={
                                  state.isIrrigating ? 'Com agua' : 'Movimento'
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
                              Sentido
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
                              <HistoryDirectionIcon direction={state.direction} />
                              {formatDirectionLabel(state.direction)}
                            </div>
                          </div>

                          <MobileHistoryMetric
                            label="Percentimetro"
                            value={`${formatNumber(state.cycles[0]?.percentimeter ?? 0, {
                              maximumFractionDigits: 0,
                            })}%`}
                          />
                          <MobileHistoryMetric
                            label="Lamina"
                            value={`${formatNumber(state.cycles[0]?.appliedBlade ?? 0, {
                              maximumFractionDigits: 1,
                            })} mm`}
                          />
                        </div>
                      </details>
                    ))}
                  </div>

                  <div className="hidden gap-3 xl:grid xl:grid-cols-2">
                    {sortedStates.slice(0, 4).map((state) => {
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

                          <div className="mt-3 flex flex-wrap gap-2">
                            <HistoryStateChip
                              active={state.isOn}
                              label={state.isOn ? 'Ligado' : 'Parado'}
                            />
                            <HistoryStateChip
                              active={state.isIrrigating}
                              label={state.isIrrigating ? 'Com agua' : 'Movimento'}
                            />
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
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function HistoryOverviewPanel({ pivot }: { pivot: Pivot }) {
  const latestState = pivot.states[0] ?? null;
  const latestCycle = latestState?.cycles[0] ?? null;
  const timelineStates = pivot.states.slice(0, 3);
  const visualPercentimeter =
    latestCycle?.percentimeter ?? pivot.live.percentimeter;
  const visualAngle = latestCycle?.angle ?? pivot.live.angle;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
      <Card className="bg-[#fffef8]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7f63]">
              Resumo operacional
            </p>
            <h3 className="mt-2 text-[28px] font-semibold leading-none text-[#22311d]">
              {latestState
                ? latestState.isOn
                  ? 'Ligado'
                  : 'Desligado'
                : 'Sem leitura'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#5e6d54]">
              {latestState
                ? formatDate(latestState.timestamp)
                : 'Aguardando historico do pivot'}
            </p>
          </div>

          {latestState ? (
            <Badge tone={latestState.endedAt ? 'neutral' : 'success'}>
              {latestState.endedAt ? 'Registro fechado' : 'Em curso'}
            </Badge>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <HistorySummaryMetric
            label="Estado"
            value={latestState ? getHistoryStateLabel(latestState) : '--'}
          />
          <HistorySummaryMetric
            label="Percentimetro"
            value={`${formatNumber(visualPercentimeter, {
              maximumFractionDigits: 0,
            })}%`}
          />
          <HistorySummaryMetric
            label="Sentido"
            value={latestState ? formatDirectionLabel(latestState.direction) : '--'}
          />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <HistorySummaryMetric
            label="Angulo"
            value={`${formatNumber(visualAngle, {
              maximumFractionDigits: 1,
            })} deg`}
          />
          <HistorySummaryMetric
            label="Lamina"
            value={`${formatNumber(latestCycle?.appliedBlade ?? 0, {
              maximumFractionDigits: 1,
            })} mm`}
          />
          <HistorySummaryMetric
            label="Termino"
            value={
              latestState?.endedAt
                ? formatCompactDateTime(latestState.endedAt)
                : 'Em curso'
            }
          />
        </div>

        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7f63]">
            Linha do tempo recente
          </p>
          <div className="mt-4 space-y-4">
            {timelineStates.map((state, index) => (
              <HistoryTimelineRow
                key={state.id}
                state={state}
                showConnector={index < timelineStates.length - 1}
              />
            ))}
          </div>
        </div>
      </Card>

      <Card className="bg-[#fffef8]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f7f63]">
              Leitura visual
            </p>
            <h3 className="mt-2 text-[24px] font-semibold leading-none text-[#22311d]">
              Roda e legenda
            </h3>
          </div>

          <span className="rounded-full bg-[#eef4db] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#597546]">
            {pivot.name}
          </span>
        </div>

        <div className="mt-5 flex justify-center">
          <PivotWheel
            angle={visualAngle}
            percentimeter={visualPercentimeter}
            size={158}
            tileClassName="rounded-[30px] bg-[#7d6240]/92 p-3.5 shadow-[0_20px_34px_rgba(63,48,29,0.2)]"
          />
        </div>

        <div className="mt-5 space-y-3">
          <HistoryLegendRow
            colorClass="bg-[#1fb6ea]"
            label="Ligado com agua"
            value={latestState?.isOn && latestState.isIrrigating ? 'Atual' : '--'}
          />
          <HistoryLegendRow
            colorClass="bg-[#94ad4f]"
            label="Ligado sem agua"
            value={
              latestState?.isOn && !latestState.isIrrigating ? 'Atual' : '--'
            }
          />
          <HistoryLegendRow
            colorClass="bg-[#8b8b85]"
            label="Desligado"
            value={!latestState?.isOn ? 'Atual' : '--'}
          />
          <HistoryLegendRow
            colorClass="bg-[#1f1f1f]"
            label="Sentido"
            value={latestState ? formatDirectionLabel(latestState.direction) : '--'}
          />
          <HistoryLegendRow
            colorClass="bg-[#e14848]"
            label="Fim do ciclo"
            value={latestState?.endedAt ? formatCompactDateTime(latestState.endedAt) : 'Em curso'}
          />
        </div>
      </Card>
    </div>
  );
}

function MobileHistoryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-white/10 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function HistorySummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-[#f1f5df] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#708062]">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-[#22311d]">{value}</p>
    </div>
  );
}

function HistoryTimelineRow({
  state,
  showConnector,
}: {
  state: PivotState;
  showConnector: boolean;
}) {
  return (
    <div className="grid grid-cols-[74px_22px_minmax(0,1fr)] gap-4">
      <div className="pt-0.5 text-right text-sm font-semibold text-[#299247]">
        {formatTimeInputValue(new Date(state.timestamp))}
      </div>

      <div className="relative flex justify-center">
        <span
          className={cn(
            'relative z-10 mt-1 h-4 w-4 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(255,255,255,0.4)]',
            getHistoryStateDotClass(state),
          )}
        />
        {showConnector ? (
          <span className="absolute top-5 h-[calc(100%+0.75rem)] w-[3px] rounded-full bg-[#3bb6e4]" />
        ) : null}
      </div>

      <div>
        <p className="text-base font-semibold text-[#299247]">
          {getHistoryStateLabel(state)}
        </p>
        <p className="mt-1 text-sm leading-6 text-[#5e6d54]">
          {state.isOn ? 'Avanco' : 'Parado'}
        </p>
      </div>
    </div>
  );
}

function HistoryLegendRow({
  colorClass,
  label,
  value,
}: {
  colorClass: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-[#5f6d54]">
        <span className={cn('h-3.5 w-3.5 rounded-full', colorClass)} />
        <span>{label}</span>
      </div>
      <span className="font-semibold text-[#22311d]">{value}</span>
    </div>
  );
}

function HistoryDirectionIcon({
  direction,
}: {
  direction: PivotState['direction'];
}) {
  if (direction === 'CLOCKWISE') {
    return <RotateCw size={18} />;
  }

  if (direction === 'COUNTER_CLOCKWISE') {
    return <RotateCcw size={18} />;
  }

  return <Clock3 size={18} />;
}

function HistoryFilterPanel({
  filters,
  hasActiveFilters,
  resultCount,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  onApplyPeriodPreset,
}: {
  filters: HistoryFiltersForm;
  hasActiveFilters: boolean;
  resultCount: number;
  onFiltersChange: (patch: Partial<HistoryFiltersForm>) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onApplyPeriodPreset: (
    preset: Exclude<HistoryPeriodPreset, 'custom'>,
  ) => void;
}) {
  return (
    <Card className="bg-[#f6f6f1]">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-[#2a9348]">Inicio:</p>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_120px] gap-3">
              <div className="relative">
                <CalendarDays
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#4b4f4a]"
                  size={22}
                />
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(event) =>
                    onFiltersChange({
                      startDate: event.target.value,
                      periodPreset: 'custom',
                    })
                  }
                  className="h-11 rounded-[14px] border-[#d7ddc3] bg-white pl-12"
                />
              </div>
              <div className="relative">
                <Clock3
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#4b4f4a]"
                  size={20}
                />
                <Input
                  type="time"
                  value={filters.startTime}
                  onChange={(event) =>
                    onFiltersChange({
                      startTime: event.target.value,
                      periodPreset: 'custom',
                    })
                  }
                  className="h-11 rounded-[14px] border-[#d7ddc3] bg-white pl-12"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#2a9348]">Termino:</p>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_120px] gap-3">
              <div className="relative">
                <CalendarDays
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#4b4f4a]"
                  size={22}
                />
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(event) =>
                    onFiltersChange({
                      endDate: event.target.value,
                      periodPreset: 'custom',
                    })
                  }
                  className="h-11 rounded-[14px] border-[#d7ddc3] bg-white pl-12"
                />
              </div>
              <div className="relative">
                <Clock3
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#4b4f4a]"
                  size={20}
                />
                <Input
                  type="time"
                  value={filters.endTime}
                  onChange={(event) =>
                    onFiltersChange({
                      endTime: event.target.value,
                      periodPreset: 'custom',
                    })
                  }
                  className="h-11 rounded-[14px] border-[#d7ddc3] bg-white pl-12"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-start gap-3 xl:justify-end">
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex min-w-[124px] items-center justify-center rounded-full bg-[#e3514d] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(227,81,77,0.18)] transition hover:bg-[#cf4743]"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={onApplyFilters}
            className="inline-flex min-w-[124px] items-center justify-center rounded-full bg-[#2f9446] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(47,148,70,0.18)] transition hover:bg-[#25773a]"
          >
            Pesquisar
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-[#dde4ca] pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#718061]">
            Periodo rapido
          </p>
          {(['24h', '7d', '30d'] as const).map((preset) => (
            <HistoryFilterChip
              key={preset}
              active={filters.periodPreset === preset}
              label={preset === '24h' ? '24 horas' : preset === '7d' ? '7 dias' : '30 dias'}
              onClick={() => onApplyPeriodPreset(preset)}
            />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#718061]">
              Estado
            </p>
            <HistoryFilterChip
              active={filters.status === 'all'}
              label="Todos"
              onClick={() => onFiltersChange({ status: 'all' })}
            />
            <HistoryFilterChip
              active={filters.status === 'on'}
              label="Ligado"
              onClick={() => onFiltersChange({ status: 'on' })}
            />
            <HistoryFilterChip
              active={filters.status === 'off'}
              label="Parado"
              onClick={() => onFiltersChange({ status: 'off' })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#718061]">
              Modo
            </p>
            <HistoryFilterChip
              active={filters.mode === 'all'}
              label="Todos"
              onClick={() => onFiltersChange({ mode: 'all' })}
            />
            <HistoryFilterChip
              active={filters.mode === 'water'}
              label="Com agua"
              onClick={() => onFiltersChange({ mode: 'water' })}
            />
            <HistoryFilterChip
              active={filters.mode === 'movement'}
              label="Movimento"
              onClick={() => onFiltersChange({ mode: 'movement' })}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-[#5f6d54]">
            {resultCount}{' '}
            {resultCount === 1 ? 'registro encontrado' : 'registros encontrados'}
          </p>
          {hasActiveFilters ? (
            <span className="rounded-full bg-[#eef5dd] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f7b44]">
              filtros ativos
            </span>
          ) : (
            <span className="text-[#909b87]">Sem filtros adicionais</span>
          )}
        </div>
      </div>
    </Card>
  );
}

function HistoryFilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition',
        active
          ? 'bg-[#2f9446] text-white shadow-[0_10px_20px_rgba(47,148,70,0.18)]'
          : 'bg-white text-[#6d7c61] shadow-[0_10px_20px_rgba(150,159,132,0.08)] hover:bg-[#f1f5e6]',
      )}
    >
      {label}
    </button>
  );
}

function HistoryStateChip({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) {
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
        active
          ? 'bg-[#ebf7ee] text-[#2f9446]'
          : 'bg-[#f1f3ec] text-[#717b6d]',
      )}
    >
      {label}
    </span>
  );
}
