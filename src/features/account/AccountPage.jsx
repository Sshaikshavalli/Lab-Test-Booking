import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, KeyRound, Loader2, Lock, Mail, Phone, ShieldAlert, UserCog } from 'lucide-react';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import PageHero from '../../components/common/PageHero';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { Field, PasswordInput, describe } from '../auth/components/AuthField';
import StrengthMeter from '../auth/components/StrengthMeter';
import AdminTeam from './AdminTeam';
import { changePasswordSchema } from '../auth/authSchema';
import { AuthError, changePassword } from '../../services/authService';
import { useAuth } from '../../app/providers/AuthProvider';
import { formatDateTime } from '../../utils/dateUtils';

export default function AccountPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const forced = user.mustChangePassword;
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(changePasswordSchema), mode: 'onTouched', defaultValues: { current: '', next: '', confirm: '' },
  });
  const next = watch('next');

  const onSubmit = async (v) => {
    setError('');
    try {
      await changePassword({ current: v.current, next: v.next });
      toast('Password updated');
      reset();
      if (forced) navigate('/', { replace: true });
    } catch (e) { setError(e instanceof AuthError ? e.message : 'Could not update the password. Please try again.'); }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Profile' }]} />
      <PageHero icon={UserCog} tone="teal" eyebrow="Lab administrator" title={user.name} subtitle={`Signed in as ${user.email}`} />

      {forced && (
        <p role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />You’re using a temporary password. Choose your own password to continue.</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <section className="card h-fit p-6" aria-labelledby="prof">
          <h2 id="prof" className="font-sans text-base font-semibold">Profile</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-brand-600" aria-hidden /><div><dt className="text-xs text-ink-500">Email</dt><dd className="font-medium">{user.email}</dd></div></div>
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-brand-600" aria-hidden /><div><dt className="text-xs text-ink-500">Mobile</dt><dd className="font-medium">+91 {user.mobile}</dd></div></div>
            <div className="flex items-center gap-3"><KeyRound className="h-4 w-4 text-brand-600" aria-hidden /><div><dt className="text-xs text-ink-500">Member since</dt><dd className="font-medium">{formatDateTime(user.createdAt)}</dd></div></div>
          </dl>
          <p className="mt-5 text-xs text-ink-500">To change your name, mobile number or email, ask another laboratory administrator.</p>
        </section>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-5 p-6" aria-label="Change password">
          <h2 className="font-sans text-base font-semibold">Change password</h2>
          <Field id="current" label={forced ? 'Temporary password' : 'Current password'} icon={Lock} error={errors.current?.message}>
            <PasswordInput id="current" autoComplete="current-password" invalid={Boolean(errors.current)} describedBy={describe('current', errors.current)} {...register('current')} />
          </Field>
          <div>
            <Field id="next" label="New password" icon={Lock} error={errors.next?.message}>
              <PasswordInput id="next" autoComplete="new-password" invalid={Boolean(errors.next)} describedBy={describe('next', errors.next)} {...register('next')} />
            </Field>
            <StrengthMeter password={next} />
          </div>
          <Field id="confirm" label="Confirm new password" icon={Lock} error={errors.confirm?.message}>
            <PasswordInput id="confirm" autoComplete="new-password" invalid={Boolean(errors.confirm)} describedBy={describe('confirm', errors.confirm)} {...register('confirm')} />
          </Field>
          {error && <div role="alert" className="flex items-start gap-2 rounded-xl bg-coral-100 px-3.5 py-3 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" aria-hidden />{error}</div>}
          <Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" />Saving…</> : 'Update password'}</Button>
        </form>
      </div>

      {!forced && <AdminTeam />}
    </div>
  );
}
