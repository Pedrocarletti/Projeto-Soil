import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Radio, Sprout, Waves } from 'lucide-react';
import { SoilMark } from '@/components/layout/mobile-app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-8 xl:px-8">
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="relative overflow-hidden rounded-[34px] border border-[#d4deb1] bg-[#f6f7eb] shadow-[0_28px_90px_rgba(42,61,26,0.22)] lg:rounded-[42px]">
          <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,#edf1c6_0%,#e6eabb_54%,rgba(246,247,235,0)_100%)] lg:h-72" />
          <div className="absolute inset-x-0 top-0 h-48 bg-[repeating-linear-gradient(140deg,rgba(147,166,80,0.18)_0_10px,rgba(255,255,255,0)_10px_24px)] opacity-60 lg:h-72" />
          <div className="absolute right-[-40px] top-[-40px] h-36 w-36 rounded-full bg-[#bdd685]/40 blur-3xl lg:h-56 lg:w-56" />

          <div className="relative flex min-h-[calc(100dvh-2rem)] flex-col px-6 py-8 lg:min-h-[760px] lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-10 lg:py-10 xl:grid">
            <div className="flex flex-col">
              <div className="flex items-center justify-between lg:justify-start lg:gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#61744c]">
                  Processo Seletivo
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#f9fbf1]/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#50653c] lg:px-4 lg:py-2">
                  <SoilMark className="h-5 w-5 border-[2.5px]" />
                  SOIL
                </div>
              </div>

              <div className="mt-10 flex flex-1 flex-col justify-center lg:mt-16">
                <div className="flex justify-center lg:justify-start">
                  <SoilMark className="h-16 w-16 border-[7px] lg:h-20 lg:w-20 lg:border-[8px]" />
                </div>

                <p className="mt-8 text-center text-[11px] font-semibold uppercase tracking-[0.34em] text-[#5a6d48] lg:text-left">
                  Soil Pivot System
                </p>
                <h1 className="mt-3 max-w-[240px] text-center text-[32px] font-semibold leading-[1.05] text-[#1f2d1b] lg:max-w-[560px] lg:text-left lg:text-[64px]">
                  Controle de pivots em tempo real.
                </h1>
                <p className="mt-5 max-w-[280px] text-center text-sm leading-6 text-[#5e6d54] lg:max-w-[520px] lg:text-left lg:text-lg">
                  Painel operacional para telemetria, historico, mapa de campo e
                  comando remoto dos pivots.
                </p>

                <div className="mt-8 grid gap-3 lg:max-w-[420px] lg:grid-cols-2">
                  <Link href="/login" className="block">
                    <Button className="w-full">
                      Entrar no sistema
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </Link>

                  <Link href="/dashboard?tab=pivots" className="block">
                    <Button className="w-full" variant="secondary">
                      Abrir demonstracao
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:mt-0 lg:content-center">
              <Card className="bg-[#fffef9]/90 lg:p-6">
                <div className="grid grid-cols-3 gap-2 text-center lg:gap-3">
                  <FeatureTile
                    icon={<Radio className="mx-auto text-[#2e7f3f]" size={18} />}
                    label="Live"
                  />
                  <FeatureTile
                    icon={<Sprout className="mx-auto text-[#2e7f3f]" size={18} />}
                    label="Pivos"
                  />
                  <FeatureTile
                    icon={<Waves className="mx-auto text-[#2e7f3f]" size={18} />}
                    label="Clima"
                  />
                </div>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="bg-[#319747] p-5 text-white shadow-[0_20px_38px_rgba(49,151,71,0.22)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                    Dashboard
                  </p>
                  <p className="mt-3 text-2xl font-semibold leading-tight">
                    Visao operacional com cards e leitura instantanea.
                  </p>
                </Card>

                <Card className="bg-[#fffef8] p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6f8063]">
                    Fluxo
                  </p>
                  <ul className="mt-3 space-y-3 text-sm text-[#5e6d54]">
                    <li>Login seeded para demonstracao.</li>
                    <li>Mapa com pivots distribuidos em campo.</li>
                    <li>Historico e grafico do pivot selecionado.</li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureTile({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-[18px] bg-[#f1f5df] px-3 py-4">
      {icon}
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#617052]">
        {label}
      </p>
    </div>
  );
}
