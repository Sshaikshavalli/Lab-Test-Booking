import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Stepper from '../../components/common/Stepper';
import Button from '../../components/common/Button';
import { useCart } from '../../app/providers/CartProvider';
import { useBookingDraft } from '../../hooks/useBookingDraft';
import { patientSchema, cleanPatient, GENDERS } from './patientSchema';
import { formatPrice } from '../../utils/priceUtils';

function Field({ id, label, optional, error, children, hint }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}{optional && <span className="ml-1 font-normal normal-case tracking-normal text-ink-300">(optional)</span>}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-medium text-coral-500">{error}</p>}
    </div>
  );
}

export default function PatientDetails() {
  const { selectedTests, indicativeTotal } = useCart();
  const { draft, update } = useBookingDraft();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(patientSchema),
    mode: 'onTouched',
    defaultValues: { fullName: '', dob: '', gender: '', mobile: '', email: '', ...draft.patient },
  });

  if (selectedTests.length === 0) return <Navigate to="/cart" replace />;

  const onSubmit = (values) => {
    update({ patient: cleanPatient(values) });
    navigate('/schedule');
  };
  const a11y = (name) => ({ 'aria-invalid': errors[name] ? true : undefined, 'aria-describedby': errors[name] ? `${name}-err` : undefined });
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Booking cart', to: '/cart' }, { label: 'Patient details' }]} />
      <Stepper current={2} />
      <h1 className="text-3xl font-semibold">Who is the test for?</h1>
      <p className="mt-1 text-sm text-ink-500">Enter the patient’s details. Patients don’t sign in — you book, reschedule and cancel for them. Only what the lab needs to identify the patient is asked.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-5 p-6" aria-label="Patient details">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field id="fullName" label="Full name" error={errors.fullName?.message}>
                <input id="fullName" className="input" autoComplete="name" placeholder="As on a government ID" {...a11y('fullName')} {...register('fullName')} />
              </Field>
            </div>
            <Field id="dob" label="Date of birth" error={errors.dob?.message}>
              <input id="dob" type="date" max={today} min="1900-01-01" className="input" autoComplete="bday" {...a11y('dob')} {...register('dob')} />
            </Field>
            <Field id="gender" label="Gender" optional error={errors.gender?.message}>
              <select id="gender" className="input" {...register('gender')}>
                <option value="">Select</option>
                {GENDERS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field id="mobile" label="Mobile number" error={errors.mobile?.message} hint="10 digits. +91 is optional.">
              <input id="mobile" type="tel" inputMode="numeric" className="input" autoComplete="tel" placeholder="98765 43210" {...a11y('mobile')} {...register('mobile')} />
            </Field>
            <Field id="email" label="Email" optional error={errors.email?.message} hint="For a copy of the booking pass.">
              <input id="email" type="email" className="input" autoComplete="email" placeholder="name@example.com" {...a11y('email')} {...register('email')} />
            </Field>
          </div>
          <p className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />No medical history or ID numbers are requested. Details stay in this browser.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button to="/cart" variant="ghost"><ArrowLeft className="h-4 w-4" />Back to cart</Button>
            <Button type="submit" disabled={isSubmitting}>Continue to date & slot<ArrowRight className="h-4 w-4" /></Button>
          </div>
        </form>

        <aside className="card h-fit p-6">
          <h2 className="font-sans text-base font-semibold">Tests in the cart</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {selectedTests.map((t) => <li key={t.id} className="flex justify-between gap-3"><span>{t.name}</span><span className="shrink-0 text-ink-500">{formatPrice(t.price)}</span></li>)}
          </ul>
          <p className="mt-4 flex justify-between border-t border-ink-100 pt-3 font-semibold"><span>Total</span><span className="font-display text-xl">{formatPrice(indicativeTotal)}</span></p>
        </aside>
      </div>
    </div>
  );
}
