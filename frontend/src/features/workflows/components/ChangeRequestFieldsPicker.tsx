import type { ChangeRequestField } from '../../change-requests/types';
import { CHANGE_REQUEST_FIELD_LABELS } from '../../change-requests/utils';

const ALL_FIELDS = Object.keys(CHANGE_REQUEST_FIELD_LABELS) as ChangeRequestField[];

export function ChangeRequestFieldsPicker({
  fields,
  onChange,
}: {
  fields: ChangeRequestField[];
  onChange: (fields: ChangeRequestField[]) => void;
}) {
  function toggle(field: ChangeRequestField) {
    onChange(
      fields.includes(field) ? fields.filter((f) => f !== field) : [...fields, field],
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {ALL_FIELDS.map((field) => (
          <label key={field} className="flex items-center gap-1.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={fields.includes(field)}
              onChange={() => toggle(field)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            {CHANGE_REQUEST_FIELD_LABELS[field]}
          </label>
        ))}
      </div>
      <p className="text-xs text-slate-400">
        Leave all unchecked to allow this template on every change-request field.
      </p>
    </div>
  );
}
