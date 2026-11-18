import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2, Lock, Mail, Phone, ShieldPlus, User } from 'lucide-react';
import { Field, PasswordInput, describe, inputClass } from './components/AuthField';
import StrengthMeter from './components/StrengthMeter';
import { setupSchema } from './authSchema';
import { AuthError, hasAdmin } from '../../services/authService';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../components/common/Toast';

/** One-time administrator setup. Unavailable (redirects to sign-in) as soon as an administrator exists. */
export default function SetupPage() {
  const { setup } = useAuth();
  const toast = useToast();
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(setupSchema), mode: 'onTouched', defaultValues: { fullName: '', mobile: '', email: '', password: '', confirm: '' },
  });
  const pw = watch('password');
  if (hasAdmin() && !isSubmitting) return <Navigate to="/login" replace />;

  const onSubmit = async (v) => {
    setError('');
    try {
      const u = await setup({ name: v.fullName, email: v.email, mobile: v.mobile, password: v.password });
      toast(`Administrator account ready. Welcome, ${u.name.split(' ')[0]}!`);
    } catch (e) { setError(e instanceof AuthError ? e.message : 'Something went wrong. Please try again.'); }
  };
  const a11y = (n) => ({ 'aria-invalid': errors[n] ? true : undefined, 'aria-describedby': describe(n, errors[n]) });

  return (
    <div>
      <h1 className="text-3xl font-semibold">Administrator setup</h1>
      <p className="mt-1 text-sm text-ink-500">This screen is available once. Afterwards only admins can add other admins and book, reschedule or cancel slots.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5" aria-label="Administrator setup">
        <Field id="fullName" label="Full name" icon={User} error={errors.fullName?.message}><input id="fullName" autoComplete="name" autoFocus className={inputClass()} {...a11y('fullName')} {...register('fullName')} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="mobile" label="Mobile" icon={Phone} error={errors.mobile?.message}><input id="mobile" type="tel" inputMode="numeric" autoComplete="tel" placeholder="98450 12345" className={inputClass()} {...a11y('mobile')} {...register('mobile')} /></Field>
          <Field id="email" label="Email" icon={Mail} error={errors.email?.message}><input id="email" type="email" autoComplete="email" placeholder="admin@yourlab.in" className={inputClass()} {...a11y('email')} {...register('email')} /></Field>
        </div>
        <div>
          <Field id="password" label="Password" icon={Lock} error={errors.password?.message}>
            <PasswordInput id="password" autoComplete="new-password" invalid={Boolean(errors.password)} describedBy={describe('password', errors.password)} {...register('password')} />
          </Field>
          <StrengthMeter password={pw} />
        </div>
        <Field id="confirm" label="Confirm password" icon={Lock} error={errors.confirm?.message}>
          <PasswordInput id="confirm" autoComplete="new-password" invalid={Boolean(errors.confirm)} describedBy={describe('confirm', errors.confirm)} {...register('confirm')} />
        </Field>
        {error && <div role="alert" className="flex items-start gap-2 rounded-xl bg-coral-100 px-3.5 py-3 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" aria-hidden />{error}</div>}
        <button type="submit" disabled={isSubmitting} className="group relative inline-flex min-h-[50px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-600 px-5 font-semibold text-white shadow-lift transition hover:bg-brand-700 active:scale-[.99] disabled:opacity-70">
          <span aria-hidden className="absolute inset-y-0 left-0 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden />Creating…</> : <><ShieldPlus className="h-5 w-5" aria-hidden />Create administrator account</>}
        </button>
      </form>
    </div>
  );
}
