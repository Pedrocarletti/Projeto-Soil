'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LockKeyhole, Mail, Radio, Waves } from 'lucide-react';
import { SoilMark } from '@/components/layout/mobile-app-shell';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? '';
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? '';
  const hasDemoCredentials = Boolean(demoEmail && demoPassword);
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState(demoPassword);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      await login(email, password);
      router.replace('/dashboard?tab=pivots');
    } catch (loginError) {
      setError((loginError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-8 xl:px-8">
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="relative overflow-hidden rounded-[34px] border border-[#d4deb1] bg-[#f6f7eb] shadow-[0_28px_90px_rgba(42,61,26,0.22)] lg:rounded-[42px]">
          <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,#ecf0c4_0%,#e5e8b8_54%,rgba(246,247,235,0)_100%)] lg:h-52" />
          <div className="absolute inset-x-0 top-0 h-32 bg-[repeating-linear-gradient(140deg,rgba(147,166,80,0.18)_0_10px,rgba(255,255,255,0)_10px_24px)] opacity-60 lg:h-52" />

          <div className="relative flex min-h-[calc(100dvh-2rem)] flex-col px-5 py-5 lg:min-h-[720px] lg:grid-cols-[1fr_460px] lg:gap-10 lg:px-8 lg:py-8 xl:grid">
            <div className="hidden lg:flex lg:flex-col lg:justify-between lg:rounded-[34px] lg:bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.25)_100%)] lg:p-8">
              <div>
                <div className="flex items-center gap-3">
                  <SoilMark className="h-14 w-14 border-[6px]" />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#61744c]">
                      Processo Seletivo
                    </p>
                    <h1 className="mt-2 text-4xl font-semibold leading-tight text-[#21301c]">
                      Login do centro operacional.
                    </h1>
                  </div>
                </div>

                <p className="mt-6 max-w-[520px] text-base leading-7 text-[#5d6d53]">
                  {hasDemoCredentials
                    ? 'Entre com a credencial demo para abrir o dashboard, acompanhar a telemetria em tempo real e testar o fluxo de comando do pivot.'
                    : 'Entre com a credencial administrativa configurada para abrir o dashboard, acompanhar a telemetria em tempo real e testar o fluxo de comando do pivot.'}
                </p>
              </div>

              <div className="grid gap-4">
                {hasDemoCredentials ? (
                  <Card className="bg-[#319747] p-5 text-white shadow-[0_20px_38px_rgba(49,151,71,0.22)]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/72">
                      Credencial demo
                    </p>
                    <p className="mt-4 font-mono text-base">{demoEmail}</p>
                    <p className="mt-1 font-mono text-base">{demoPassword}</p>
                  </Card>
                ) : null}

                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-[#fffef8] p-5">
                    <Radio className="text-[#2e7f3f]" size={18} />
                    <p className="mt-3 text-lg font-semibold text-[#21301c]">
                      Dashboard live
                    </p>
                  </Card>
                  <Card className="bg-[#fffef8] p-5">
                    <Waves className="text-[#2e7f3f]" size={18} />
                    <p className="mt-3 text-lg font-semibold text-[#21301c]">
                      Clima e historico
                    </p>
                  </Card>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:justify-center">
              <div className="relative flex items-center justify-between lg:hidden">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#62744d]">
                  Login
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#f9fbf1]/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#50653c]">
                  <SoilMark className="h-5 w-5 border-[2.5px]" />
                  SOIL
                </div>
              </div>

              <div className="mt-8 rounded-[28px] bg-white px-5 py-6 shadow-[0_18px_40px_rgba(45,63,29,0.08)] lg:mt-0 lg:px-8 lg:py-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#708064]">
                  Autenticacao
                </p>
                <h2 className="mt-2 text-[31px] font-semibold leading-[1.04] text-[#21301c]">
                  Entrar
                </h2>
                <p className="mt-2 text-sm leading-5 text-[#64725a]">
                  {hasDemoCredentials
                    ? 'Use a credencial demo para acessar o painel operacional.'
                    : 'Use a credencial administrativa configurada para acessar o painel operacional.'}
                </p>

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7c8b72]"
                      size={16}
                    />
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="pl-11"
                      placeholder="Seu e-mail"
                    />
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7c8b72]"
                      size={16}
                    />
                    <Input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-11"
                      placeholder="Sua senha"
                    />
                  </div>

                  {hasDemoCredentials ? (
                    <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em]">
                      <span className="text-[#9aa38e]">Demo</span>
                      <span className="text-right text-[#319747]">
                        {demoEmail}
                        <br />
                        {demoPassword}
                      </span>
                    </div>
                  ) : null}

                  {error ? (
                    <p className="rounded-[16px] bg-[#fff1f1] px-4 py-3 text-sm text-[#b33c3c]">
                      {error}
                    </p>
                  ) : null}

                  <Button className="mt-2 w-full" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Autenticando...' : 'Entrar'}
                  </Button>
                </form>
              </div>

              <div className="mt-6 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7d8b73]">
                <Link href="/">Inicio</Link>
                <span>Versao demo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
