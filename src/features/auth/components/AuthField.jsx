import { forwardRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

/** Label + icon + control + error, wired for screen readers (aria-invalid / aria-describedby). */
export function Field({ id, label, icon: Icon, error, hint, right, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="field-label !mb-0">{label}</label>
        {right}
      </div>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" aria-hidden />}
        {children}
      </div>
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-500">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-coral-500"><AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />{error}</p>}
    </div>
  );
}

export const inputClass = (icon = true) => `input !py-3 ${icon ? '!pl-10' : ''}`;
export const describe = (id, error, hint) => (error ? `${id}-err` : hint ? `${id}-hint` : undefined);

/** Password field with a show/hide toggle and a Caps Lock warning. Works with react-hook-form's register(). */
export const PasswordInput = forwardRef(function PasswordInput({ id, invalid, describedBy, onKeyUp, onKeyDown, onBlur, ...rest }, ref) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const sense = (e) => setCaps(e.getModifierState?.('CapsLock') ?? false);
  return (
    <>
      <input ref={ref} id={id} type={show ? 'text' : 'password'} className={`${inputClass()} !pr-12`} aria-invalid={invalid || undefined} aria-describedby={describedBy}
        autoCapitalize="none" spellCheck={false}
        onKeyUp={(e) => { sense(e); onKeyUp?.(e); }} onKeyDown={(e) => { sense(e); onKeyDown?.(e); }} onBlur={(e) => { setCaps(false); onBlur?.(e); }} {...rest} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100/70 hover:text-ink-900">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      {caps && <span role="status" className="absolute -bottom-5 left-0 text-xs font-medium text-amber-700">Caps Lock is on</span>}
    </>
  );
});
