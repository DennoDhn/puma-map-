import type { ReactNode } from 'react';
import { CarFront } from 'lucide-react';
export function Empty({
  icon: Icon = CarFront,
  title,
  children,
  action,
}: {
  icon?: typeof CarFront;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function ModerateForm({
  id,
  action,
  busy,
  submit,
}: {
  id: string;
  action: 'HIDE' | 'PUBLISH';
  busy: boolean;
  submit: (data: { contentId: string; action: string; reason: string }) => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit({
          contentId: id,
          action,
          reason: String(new FormData(e.currentTarget).get('reason')),
        });
      }}
    >
      <Field
        label={action === 'HIDE' ? 'Begründung der Moderation' : 'Prüfvermerk / Quellenprüfung'}
      >
        <textarea name="reason" required minLength={10} maxLength={500} rows={2} />
      </Field>
      <button className="button secondary" disabled={busy}>
        {action === 'HIDE' ? 'Inhalt ausblenden' : 'Artikel freigeben'}
      </button>
    </form>
  );
}
