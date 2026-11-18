import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Copy, KeyRound, Loader2, Mail, Phone, ShieldCheck, Sparkles, Trash2, User, UserPlus } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { Field, describe, inputClass } from '../auth/components/AuthField';
import StrengthMeter from '../auth/components/StrengthMeter';
import { createAccountSchema } from '../auth/authSchema';
import { AuthError, createAccount, generatePassword, listAccounts, removeAccount, resetPassword } from '../../services/authService';
import { subscribe, STORAGE_KEYS } from '../../services/storageService';
import { useAuth } from '../../app/providers/AuthProvider';
import { formatDateTime } from '../../utils/dateUtils';

/** Live list of accounts (updates when another tab changes them). */
function useAccounts() {
  const [list, setList] = useState(() => { try { return listAccounts(); } catch { return []; } });
  const refresh = useCallback(() => { try { setList(listAccounts()); } catch { setList([]); } }, []);
  useEffect(() => subscribe((k) => { if (k === STORAGE_KEYS.users) refresh(); }), [refresh]);
  return list;
}

const copy = async (text, toast) => {
  try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); } catch { toast('Couldn’t copy — select and copy it manually', 'info'); }
};

/** Lab admin team: add, reset and remove administrators. Lives on the Profile page. */
export default function AdminTeam() {
  const { user: me } = useAuth();
  const toast = useToast();
  const accounts = useAccounts();
  const [issued, setIssued] = useState(null);   // { name, email, password } shown once after create / reset
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(null);
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(createAccountSchema), mode: 'onTouched', defaultValues: { fullName: '', mobile: '', email: '', password: generatePassword() },
  });
  const pw = watch('password');

  const onSubmit = async (v) => {
    setError('');
    try {
      const u = await createAccount({ name: v.fullName, email: v.email, mobile: v.mobile, password: v.password });
      setIssued({ name: u.name, email: u.email, password: v.password });
      toast(`Admin account created for ${u.name.split(' ')[0]}`);
      reset({ fullName: '', mobile: '', email: '', password: generatePassword() });
    } catch (e) { setError(e instanceof AuthError ? e.message : 'The account could not be created. Please try again.'); }
  };

  const doReset = async (a) => {
    const password = generatePassword();
    try { await resetPassword(a.id, password); setIssued({ name: a.name, email: a.email, password, reset: true }); toast(`Password reset for ${a.name.split(' ')[0]}`); }
    catch (e) { toast(e instanceof AuthError ? e.message : 'Reset failed', 'info'); }
  };
  const doRemove = () => {
    try { removeAccount(removing.id); toast(`${removing.name} removed`); } catch (e) { toast(e instanceof AuthError ? e.message : 'Could not remove', 'info'); }
    setRemoving(null);
  };
  const a11y = (n) => ({ 'aria-invalid': errors[n] ? true : undefined, 'aria-describedby': describe(n, errors[n]) });

  return (
    <section aria-labelledby="team" className="space-y-6">
      <div>
        <h2 id="team" className="text-2xl font-semibold">Lab admin team</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-500">Only laboratory administrators have accounts — patients never sign in. Create, reset and remove admin accounts here; a new admin signs in with a temporary password and chooses their own.</p>
      </div>

      <AnimatePresence>
        {issued && (
          <motion.section initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="flex items-center gap-2 font-semibold text-emerald-800"><ShieldCheck className="h-5 w-5" aria-hidden />{issued.reset ? 'Password reset' : 'Account created'} — share these sign-in details with {issued.name}</p>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Email</dt><dd className="font-mono">{issued.email}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Temporary password</dt><dd className="font-mono text-base font-semibold">{issued.password}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-emerald-800">This password is shown only now. {issued.name.split(' ')[0]} will be asked to choose a new one at first sign-in.</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => copy(`Email: ${issued.email}\nTemporary password: ${issued.password}`, toast)}><Copy className="h-4 w-4" />Copy details</Button>
              <Button size="sm" variant="ghost" onClick={() => setIssued(null)}>Dismiss</Button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="card h-fit space-y-5 p-6" aria-label="Add lab admin">
          <h2 className="flex items-center gap-2 font-sans text-base font-semibold"><UserPlus className="h-5 w-5 text-brand-600" aria-hidden />Add a lab admin</h2>
          <p className="rounded-xl bg-brand-50 px-3.5 py-3 text-xs text-brand-900">Admins can book, reschedule and cancel slots and manage other admins.</p>
          <Field id="fullName" label="Full name" icon={User} error={errors.fullName?.message}><input id="fullName" autoComplete="off" className={inputClass()} {...a11y('fullName')} {...register('fullName')} /></Field>
          <Field id="mobile" label="Mobile" icon={Phone} error={errors.mobile?.message}><input id="mobile" type="tel" inputMode="numeric" autoComplete="off" placeholder="98450 12345" className={inputClass()} {...a11y('mobile')} {...register('mobile')} /></Field>
          <Field id="email" label="Email" icon={Mail} error={errors.email?.message}><input id="email" type="email" autoComplete="off" className={inputClass()} {...a11y('email')} {...register('email')} /></Field>
          <div>
            <Field id="password" label="Temporary password" icon={KeyRound} error={errors.password?.message}
              right={<button type="button" onClick={() => setValue('password', generatePassword(), { shouldValidate: true })} className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"><Sparkles className="h-3.5 w-3.5" aria-hidden />Generate</button>}>
              <input id="password" autoComplete="off" spellCheck={false} className={`${inputClass()} font-mono`} {...a11y('password')} {...register('password')} />
            </Field>
            <StrengthMeter password={pw} />
          </div>
          {error && <div role="alert" className="flex items-start gap-2 rounded-xl bg-coral-100 px-3.5 py-3 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" aria-hidden />{error}</div>}
          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" />Creating…</> : <><UserPlus className="h-5 w-5" />Create admin account</>}</Button>
        </form>

        <section className="card overflow-hidden" aria-labelledby="acc-list">
          <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4"><h2 id="acc-list" className="font-sans text-base font-semibold">All lab admins</h2><span className="chip bg-brand-50 text-brand-700">{accounts.length}</span></div>
          <ul className="divide-y divide-ink-100">
            <AnimatePresence initial={false}>
              {accounts.map((a) => (
                <motion.li layout key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-4 px-6 py-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white">{a.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">{a.name}
                      <span className="chip bg-brand-50 text-brand-700">Lab admin</span>
                      {a.mustChangePassword && <span className="chip bg-amber-50 text-amber-700">Temporary password</span>}
                      {a.id === me.id && <span className="chip bg-ink-100 text-ink-700">You</span>}
                    </p>
                    <p className="truncate text-sm text-ink-500">{a.email} · +91 {a.mobile}</p>
                    <p className="text-xs text-ink-300">Created {formatDateTime(a.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => doReset(a)}><KeyRound className="h-4 w-4" />Reset password</Button>
                    <Button size="sm" variant="danger" disabled={a.id === me.id || accounts.length <= 1} onClick={() => setRemoving(a)} aria-label={`Remove ${a.name}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      </div>

      <Modal open={Boolean(removing)} onClose={() => setRemoving(null)} title="Remove this account?">
        <p className="text-sm text-ink-700">{removing?.name} ({removing?.email}) will no longer be able to sign in. Bookings they made are kept.</p>
        <div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => setRemoving(null)}>Keep account</Button><Button variant="accent" onClick={doRemove}>Remove account</Button></div>
      </Modal>
    </section>
  );
}
