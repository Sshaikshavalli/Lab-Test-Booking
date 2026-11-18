import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Info, Loader2, Lock, LogIn, Mail } from 'lucide-react';
import { Field, PasswordInput, describe, inputClass } from './components/AuthField';
import { loginSchema } from './authSchema';
import { AuthError, hasAdmin } from '../../services/authService';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../components/common/Toast';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [error, setError] = useState('');
  const [shake, setShake] = useState(0);
  const needsLogin = Boolean(location.state?.from) && location.state.from !== '/';
  const { register, handleSubmit, setFocus, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema), mode: 'onTouched', defaultValues: { email: '', password: '', remember: true },
  });

  const onSubmit = async (values) => {
    setError('');
    try {
      const user = await login(values); // the layout redirects as soon as the session exists
      toast(`Welcome back, ${user.name.split(' ')[0]}`);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Something went wrong while signing in. Please try again.');
      setShake((n) => n + 1);
      setFocus('password');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Lab admin login</h1>
      <p className="mt-1 text-sm text-ink-500">Sign in to book tests, arrange slots, reschedule and cancel.</p>

      {needsLogin && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50 px-3.5 py-3 text-sm text-brand-900"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />Please sign in as a lab admin to continue.</p>
      )}

      <motion.form key={shake} animate={shake ? { x: [0, -9, 9, -6, 6, 0] } : undefined} transition={{ duration: .4 }} onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5" aria-label="Sign in">
        <Field id="email" label="Email" icon={Mail} error={errors.email?.message}>
          <input id="email" type="email" inputMode="email" autoComplete="email" autoFocus placeholder="admin@yourlab.in" className={inputClass()}
            aria-invalid={errors.email ? true : undefined} aria-describedby={describe('email', errors.email)} {...register('email')} />
        </Field>

        <Field id="password" label="Password" icon={Lock} error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="current-password" placeholder="Your password" invalid={Boolean(errors.password)} describedBy={describe('password', errors.password)} {...register('password')} />
        </Field>

        <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm text-ink-700">
          <input type="checkbox" className="h-4 w-4 rounded border-ink-300 accent-brand-600" {...register('remember')} />
          Keep me signed in on this device
        </label>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl bg-coral-100 px-3.5 py-3 text-sm text-ink-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" aria-hidden />{error}</div>
        )}

        <button type="submit" disabled={isSubmitting} className="group relative inline-flex min-h-[50px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-600 px-5 font-semibold text-white shadow-lift transition hover:bg-brand-700 active:scale-[.99] disabled:opacity-70">
          <span aria-hidden className="absolute inset-y-0 left-0 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden />Signing in…</> : <><LogIn className="h-5 w-5" aria-hidden />Sign in as admin<ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden /></>}
        </button>
      </motion.form>

      {hasAdmin() ? (
        <p className="mt-6 flex items-start gap-2 rounded-xl bg-ink-100/60 px-3.5 py-3 text-xs text-ink-700"><Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />Only laboratory administrators can sign in. Need access? Ask an existing lab admin to add you.</p>
      ) : (
        <p className="mt-6 text-center text-sm text-ink-500">First time here? <Link to="/setup" className="font-semibold text-brand-700 hover:underline">Set up the first admin account</Link></p>
      )}
    </div>
  );
}
