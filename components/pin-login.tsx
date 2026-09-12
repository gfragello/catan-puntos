'use client';

import { useState, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export function PinLogin() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pin.length !== 8) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await response.json() as { authenticated?: boolean; error?: string };
      if (!response.ok || !data.authenticated) throw new Error(data.error || 'No se pudo iniciar la sesión.');
      window.location.reload();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No se pudo iniciar la sesión.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-7 shadow-2xl shadow-black/25 sm:p-9">
        <span className="mb-6 grid size-12 place-items-center rounded-2xl bg-[#d9a441] text-[#14232d]">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </span>
        <p className="mb-1 text-sm font-semibold text-[#d9a441]">Acceso protegido</p>
        <h1 className="text-3xl font-bold tracking-tight">Administración</h1>
        <p className="mt-2 text-[#94a7b5]">Ingresá el PIN de 8 dígitos para modificar la partida.</p>

        <form className="mt-8" onSubmit={submit}>
          <label htmlFor="admin-pin" className="mb-3 block text-sm font-medium text-[#a9bac5]">PIN numérico</label>
          <InputOTP
            id="admin-pin"
            maxLength={8}
            pattern={REGEXP_ONLY_DIGITS}
            value={pin}
            onChange={setPin}
            containerClassName="justify-center"
            aria-label="PIN numérico de 8 dígitos"
          >
            <InputOTPGroup>
              {Array.from({ length: 8 }, (_, index) => (
                <InputOTPSlot key={index} index={index} className="size-10 bg-[#101b24] text-lg sm:size-11" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {error && <p role="alert" className="mt-4 text-center text-sm text-red-300">{error}</p>}
          <Button className="mt-6 h-11 w-full font-bold" type="submit" disabled={loading || pin.length !== 8}>
            <KeyRound />{loading ? 'Verificando…' : 'Ingresar'}
          </Button>
        </form>
        <Link className="mt-5 block text-center text-sm text-[#94a7b5] hover:text-white" href="/">Volver al panel</Link>
      </section>
    </main>
  );
}
