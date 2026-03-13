'use client';

import { useEffect, useState } from 'react';
import { Circle, Droplets, Power, RotateCcw, RotateCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { controlPivot } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Pivot } from '@/types/domain';

const PERCENTIMETER_MIN = 0;
const PERCENTIMETER_MAX = 100;

type ControlDirection = 'clockwise' | 'counter-clockwise';
type ControlSide = 'left' | 'right';
type FeedbackTone = 'success' | 'error';

export function ControlPanel({
  pivot,
  token,
  onSuccess,
}: {
  pivot: Pivot;
  token: string;
  onSuccess: () => void | Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOn, setIsOn] = useState(pivot.live.isOn);
  const [direction, setDirection] = useState<ControlDirection>(
    getDirectionFromLive(pivot.live.direction),
  );
  const [irrigationMode, setIrrigationMode] = useState<'water' | 'movement'>(
    pivot.live.isIrrigating ? 'water' : 'movement',
  );
  const [percentimeter, setPercentimeter] = useState(
    String(clampPercentimeter(pivot.live.percentimeter)),
  );
  const [feedback, setFeedback] = useState<{
    tone: FeedbackTone;
    message: string;
  } | null>(null);

  useEffect(() => {
    setIsOn(pivot.live.isOn);
    setDirection(getDirectionFromLive(pivot.live.direction));
    setIrrigationMode(pivot.live.isIrrigating ? 'water' : 'movement');
    setPercentimeter(String(clampPercentimeter(pivot.live.percentimeter)));
  }, [pivot]);

  function syncWithPivot() {
    setIsOn(pivot.live.isOn);
    setDirection(getDirectionFromLive(pivot.live.direction));
    setIrrigationMode(pivot.live.isIrrigating ? 'water' : 'movement');
    setPercentimeter(String(clampPercentimeter(pivot.live.percentimeter)));
  }

  function handleReset() {
    syncWithPivot();
    setFeedback(null);
  }

  function adjustPercentimeter(step: number) {
    const nextValue = clampPercentimeter(Number(percentimeter || 0) + step);
    setPercentimeter(String(nextValue));
  }

  function handlePercentimeterChange(value: string) {
    if (!value.trim()) {
      setPercentimeter('');
      return;
    }

    if (!/^\d+$/.test(value)) {
      return;
    }

    setPercentimeter(String(clampPercentimeter(Number(value))));
  }

  async function handleSubmit() {
    const safePercentimeter = clampPercentimeter(Number(percentimeter || 0));

    try {
      setIsSubmitting(true);
      setFeedback(null);
      await controlPivot(pivot.id, token, {
        isOn,
        direction: isOn ? direction : 'stopped',
        irrigationMode,
        percentimeter:
          isOn && irrigationMode === 'water' ? safePercentimeter : undefined,
      });
      setPercentimeter(String(safePercentimeter));
      setFeedback({
        tone: 'success',
        message: 'Comando aceito e enviado ao fluxo de telemetria.',
      });
      await onSuccess();
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-[34px] bg-[rgba(255,255,255,0.14)] px-5 py-5 shadow-[inset_0_0_0_1px_rgba(121,132,102,0.18)] sm:px-7 sm:py-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[30px] font-semibold leading-none text-[#299247] sm:text-[36px]">
            Modificar o pivo
          </h2>
          <p className="mt-2 max-w-[420px] text-sm leading-6 text-[#5e6558]">
            Ajuste os comandos com o mesmo encaixe visual da referencia, mas
            mantendo o envio real para a API.
          </p>
        </div>

        <span className="rounded-full bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f6857]">
          {isSubmitting ? 'Enviando' : isOn ? 'Ligado' : 'Parado'}
        </span>
      </div>

      <div className="mt-7 space-y-6">
        <ControlField label="Operacao">
          <BinarySelector
            leftLabel="Desligado"
            rightLabel="Ligado"
            leftIcon={Power}
            rightIcon={Power}
            selectedSide={isOn ? 'right' : 'left'}
            onSelectLeft={() => setIsOn(false)}
            onSelectRight={() => setIsOn(true)}
            leftTone="red"
            rightTone="green"
          />
        </ControlField>

        <ControlField label="Estado">
          <BinarySelector
            leftLabel="Sem agua"
            rightLabel="Com agua"
            leftIcon={Circle}
            rightIcon={Droplets}
            selectedSide={irrigationMode === 'water' ? 'right' : 'left'}
            onSelectLeft={() => setIrrigationMode('movement')}
            onSelectRight={() => setIrrigationMode('water')}
            leftTone="neutral"
            rightTone="blue"
          />
        </ControlField>

        <ControlField label="Sentido">
          <BinarySelector
            leftLabel="Reverso"
            rightLabel="Avanco"
            leftIcon={RotateCcw}
            rightIcon={RotateCw}
            selectedSide={direction === 'counter-clockwise' ? 'left' : 'right'}
            onSelectLeft={() => setDirection('counter-clockwise')}
            onSelectRight={() => setDirection('clockwise')}
            leftTone="neutral"
            rightTone="neutral"
          />
        </ControlField>

        <div>
          <label className="text-[13px] font-semibold text-[#2a9449]">
            Percentimetro:
          </label>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StepButton label="-5" onClick={() => adjustPercentimeter(-5)} />
            <Input
              type="number"
              min={PERCENTIMETER_MIN}
              max={PERCENTIMETER_MAX}
              step={1}
              value={percentimeter}
              onChange={(event) => handlePercentimeterChange(event.target.value)}
              className="h-11 w-[110px] rounded-[6px] border-[#9d9d96] bg-white px-3 py-2 text-center text-lg font-semibold shadow-none"
            />
            <StepButton label="+5" onClick={() => adjustPercentimeter(5)} />
          </div>

          <p className="mt-2 text-xs text-[#6a7264]">
            Valor usado quando o pivo estiver ligado com agua.
          </p>
        </div>

        {feedback ? (
          <p
            className={cn(
              'rounded-[18px] px-4 py-3 text-sm',
              feedback.tone === 'success'
                ? 'bg-[#e7f4df] text-[#416338]'
                : 'bg-[#fff3f3] text-[#aa4c4c]',
            )}
          >
            {feedback.message}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#e25550] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_28px_rgba(226,85,80,0.22)] transition hover:bg-[#c94843]"
          >
            Limpar
          </button>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#299247] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_28px_rgba(41,146,71,0.22)] transition hover:bg-[#247d3d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Enviando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </section>
  );
}

function ControlField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-[#2a9449]">{label}:</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function BinarySelector({
  leftLabel,
  rightLabel,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  selectedSide,
  onSelectLeft,
  onSelectRight,
  leftTone,
  rightTone,
}: {
  leftLabel: string;
  rightLabel: string;
  leftIcon: LucideIcon;
  rightIcon: LucideIcon;
  selectedSide: ControlSide;
  onSelectLeft: () => void;
  onSelectRight: () => void;
  leftTone: 'red' | 'green' | 'blue' | 'neutral';
  rightTone: 'red' | 'green' | 'blue' | 'neutral';
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onSelectLeft}
        className={cn(
          'inline-flex items-center gap-2 text-[15px] font-semibold transition',
          selectedSide === 'left' ? 'text-[#2a9449]' : 'text-[#566055]',
        )}
      >
        <span>{leftLabel}</span>
        <ToneIconBubble icon={LeftIcon} tone={leftTone} active={selectedSide === 'left'} />
      </button>

      <button
        type="button"
        onClick={selectedSide === 'left' ? onSelectRight : onSelectLeft}
        className="relative h-5 w-12 rounded-full bg-[#c8c8c4]"
        aria-label={`Alternar entre ${leftLabel} e ${rightLabel}`}
      >
        <span
          className={cn(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#299247] transition-all',
            selectedSide === 'right' ? 'left-[26px]' : 'left-[4px]',
          )}
        />
      </button>

      <button
        type="button"
        onClick={onSelectRight}
        className={cn(
          'inline-flex items-center gap-2 text-[15px] font-semibold transition',
          selectedSide === 'right' ? 'text-[#2a9449]' : 'text-[#566055]',
        )}
      >
        <ToneIconBubble
          icon={RightIcon}
          tone={rightTone}
          active={selectedSide === 'right'}
        />
        <span>{rightLabel}</span>
      </button>
    </div>
  );
}

function ToneIconBubble({
  icon: Icon,
  tone,
  active,
}: {
  icon: LucideIcon;
  tone: 'red' | 'green' | 'blue' | 'neutral';
  active: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border transition',
        active && tone === 'red' && 'border-[#d95a52] bg-[#d95a52] text-white',
        active && tone === 'green' && 'border-[#299247] bg-[#299247] text-white',
        active && tone === 'blue' && 'border-[#8fd5f2] bg-[#9fdbf4] text-[#1197c5]',
        active && tone === 'neutral' && 'border-[#d8d8d2] bg-white text-[#222723]',
        !active && 'border-[#d7d7d2] bg-white text-[#222723]',
      )}
    >
      <Icon size={19} />
    </span>
  );
}

function StepButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 min-w-[24px] items-center justify-center rounded-[4px] bg-[#2a9449] px-2 text-lg font-semibold leading-none text-white transition hover:bg-[#247d3d]"
    >
      {label}
    </button>
  );
}

function getDirectionFromLive(direction: string): ControlDirection {
  return direction === 'counter-clockwise' ? 'counter-clockwise' : 'clockwise';
}

function clampPercentimeter(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(
    PERCENTIMETER_MIN,
    Math.min(PERCENTIMETER_MAX, Math.round(value)),
  );
}
