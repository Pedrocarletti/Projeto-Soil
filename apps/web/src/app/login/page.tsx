'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, UserRound } from 'lucide-react';
import { SoilMark } from '@/components/layout/mobile-app-shell';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? '';
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? '';
  const hasDemoCredentials = Boolean(demoEmail && demoPassword);
  const { login } = useAuth();
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState(demoPassword);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = Boolean(email.trim() && password.trim());

  useEffect(() => {
    function syncAutofilledValues() {
      const nextEmail = emailInputRef.current?.value ?? '';
      const nextPassword = passwordInputRef.current?.value ?? '';

      setEmail((currentEmail) =>
        currentEmail !== nextEmail ? nextEmail : currentEmail,
      );
      setPassword((currentPassword) =>
        currentPassword !== nextPassword ? nextPassword : currentPassword,
      );
    }

    syncAutofilledValues();

    const animationFrameId = window.requestAnimationFrame(syncAutofilledValues);
    const firstTimeoutId = window.setTimeout(syncAutofilledValues, 120);
    const secondTimeoutId = window.setTimeout(syncAutofilledValues, 450);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(firstTimeoutId);
      window.clearTimeout(secondTimeoutId);
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setNotice(null);
      await login(email, password);
      router.replace('/dashboard?tab=fazendas');
    } catch (loginError) {
      setError((loginError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleForgotPassword() {
    setError(null);
    setNotice(
      hasDemoCredentials
        ? 'Se precisar redefinir o acesso, use a credencial demo configurada ou solicite uma nova ao administrador.'
        : 'Solicite a redefinicao de senha ao administrador do ambiente.',
    );
  }

  function handleSettingsInfo() {
    setError(null);
    setNotice(
      'As configuracoes deste ambiente sao definidas no deploy do frontend e da API.',
    );
  }

  return (
    <main className="min-h-screen bg-[#ecece6] sm:px-4 sm:py-4">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col overflow-hidden bg-[#f5f5f1] shadow-[0_26px_70px_rgba(54,61,41,0.16)] sm:min-h-[calc(100vh-2rem)] sm:rounded-[28px]">
        <section className="relative min-h-[174px] overflow-hidden md:min-h-[236px]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#9bb47f_0%,#d4d88f_38%,#d7cb67_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,44,27,0.42)_0%,rgba(38,57,30,0.15)_34%,rgba(255,224,118,0.25)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_83%_28%,rgba(255,242,168,0.94)_0%,rgba(255,242,168,0.42)_20%,rgba(255,242,168,0)_45%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(180deg,#88a24b_0%,#73903e_44%,#668138_100%)]" />
          <div className="absolute inset-x-0 bottom-[18%] h-[26%] bg-[linear-gradient(180deg,rgba(154,175,92,0.15)_0%,rgba(235,227,137,0.42)_100%)]" />
          <div className="absolute inset-x-0 bottom-[18%] h-[3px] bg-[rgba(255,237,175,0.24)]" />
          <div className="absolute inset-x-0 bottom-[10%] h-[16%] bg-[repeating-linear-gradient(-7deg,rgba(96,119,50,0.2)_0_15px,rgba(173,191,88,0.08)_15px_36px)] opacity-70" />
          <div className="absolute inset-x-[34%] top-[46%] h-[3px] rounded-full bg-[#4f5d32]/20 blur-sm" />
          <div className="absolute left-[52%] top-[42%] flex items-end gap-2 opacity-60">
            <span className="h-3 w-5 rounded-t-sm bg-[#f2efdd]/85" />
            <span className="h-4 w-6 rounded-t-sm bg-[#ece8d2]/90" />
            <span className="h-3 w-5 rounded-t-sm bg-[#f6f0d8]/80" />
            <span className="h-5 w-8 rounded-t-sm bg-[#ebe5c8]/90" />
          </div>

          <div className="relative z-10 flex h-full items-end px-8 pb-7 pt-10 md:px-16 md:pb-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
                Central de acesso
              </p>
              <h1 className="mt-2 text-[44px] font-semibold leading-none tracking-[-0.05em] text-white md:text-[58px]">
                Login
              </h1>
            </div>
          </div>
        </section>

        <section className="relative flex flex-1 flex-col items-center px-6 pb-10 pt-10 md:px-14 md:pb-12 md:pt-6">
          <div className="pointer-events-none absolute left-1/2 top-[42px] h-[420px] w-[min(88vw,620px)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.72)_26%,rgba(248,248,245,0.22)_55%,rgba(248,248,245,0)_80%)] blur-[10px]" />

          <form
            className="relative z-10 flex w-full max-w-[360px] flex-1 flex-col items-center"
            onSubmit={handleSubmit}
          >
            <div className="mt-2 w-full space-y-5 md:mt-6">
              <label className="sr-only" htmlFor="login-email">
                Usuario
              </label>
              <div className="relative">
                <UserRound
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b5bfce]"
                  size={19}
                  strokeWidth={2.1}
                />
                <Input
                  ref={emailInputRef}
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onInput={(event) =>
                    setEmail((event.target as HTMLInputElement).value)
                  }
                  className="h-14 rounded-full border-white/70 bg-white/92 pl-13 pr-5 text-[15px] text-[#4b5360] shadow-[0_16px_34px_rgba(204,210,219,0.42)] placeholder:text-[#b4bcc8] focus:border-[#c8d874] focus:ring-[#d9e694]/40"
                  placeholder="Usuario"
                />
              </div>

              <label className="sr-only" htmlFor="login-password">
                Senha
              </label>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b5bfce]"
                  size={18}
                  strokeWidth={2.1}
                />
                <Input
                  ref={passwordInputRef}
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onInput={(event) =>
                    setPassword((event.target as HTMLInputElement).value)
                  }
                  className="h-14 rounded-full border-white/70 bg-white/92 pl-13 pr-5 text-[15px] text-[#4b5360] shadow-[0_16px_34px_rgba(204,210,219,0.42)] placeholder:text-[#b4bcc8] focus:border-[#c8d874] focus:ring-[#d9e694]/40"
                  placeholder="Senha"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium text-[#169745] transition hover:text-[#0e7b36]"
                >
                  Esqueceu a senha?
                </button>
              </div>

              {hasDemoCredentials ? (
                <div className="rounded-[24px] border border-[#e4e8d9] bg-white/74 px-4 py-3 text-center text-[12px] text-[#71806f] shadow-[0_10px_26px_rgba(213,219,226,0.34)]">
                  <span className="font-semibold text-[#2c3a1d]">Acesso demo:</span>{' '}
                  {demoEmail} / {demoPassword}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-[24px] border border-[#f3d0d0] bg-[#fff5f5] px-4 py-3 text-center text-sm text-[#bf4343] shadow-[0_10px_24px_rgba(227,197,197,0.22)]">
                  {error}
                </div>
              ) : null}

              {notice ? (
                <div className="rounded-[24px] border border-[#dbe7cd] bg-[#f5faef] px-4 py-3 text-center text-sm text-[#547144] shadow-[0_10px_24px_rgba(213,225,201,0.22)]">
                  {notice}
                </div>
              ) : null}
            </div>

            <div className="mt-14 flex w-full flex-1 flex-col items-center justify-end gap-6 pb-8 md:mt-20 md:pb-4">
              <Button
                className={cn(
                  'h-12 w-full max-w-[286px] rounded-full border-none text-[24px] font-semibold shadow-[0_22px_44px_rgba(220,226,234,0.9)]',
                  canSubmit
                    ? 'bg-[#2f9446] text-white shadow-[0_22px_44px_rgba(47,148,70,0.28)] hover:bg-[#25773a] hover:text-white'
                    : 'bg-[#e8edf4] text-[#7e8ca4] hover:bg-[#dde5ee] hover:text-[#728198]',
                )}
                type="submit"
                disabled={isSubmitting || !canSubmit}
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>

              <button
                type="button"
                onClick={handleSettingsInfo}
                className="text-[18px] font-medium text-[#0ea340] transition hover:text-[#0a8834]"
              >
                Configuracoes
              </button>
            </div>
          </form>

          <div className="pointer-events-none relative z-10 mt-2 flex w-fit max-w-full items-end justify-start md:absolute md:bottom-10 md:left-12">
            <SoilWordmark />
          </div>
        </section>
      </div>
    </main>
  );
}

function SoilWordmark() {
  return (
    <div className="select-none">
      <div className="flex items-end gap-1.5 text-[#314020]">
        <span className="text-[76px] font-black leading-none tracking-[-0.12em] md:text-[88px]">
          S
        </span>
        <div className="mb-1 flex h-[58px] w-[58px] items-center justify-center md:h-[66px] md:w-[66px]">
          <SoilMark className={cn('h-full w-full border-[8px] md:border-[9px]')} />
        </div>
        <span className="text-[76px] font-black leading-none tracking-[-0.12em] md:text-[88px]">
          I
        </span>
        <span className="text-[76px] font-black leading-none tracking-[-0.12em] md:text-[88px]">
          L
        </span>
      </div>
      <p className="pl-1 text-[10px] font-medium uppercase tracking-[0.64em] text-[#8d9289] md:text-[11px]">
        Tecnologia
      </p>
    </div>
  );
}
