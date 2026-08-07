import { useMemo, useState, type FormEvent } from 'react';
import { useOrganizationUsers } from '../../users/hooks/useOrganizationUsers';
import { useDepartments } from '../../organization/hooks/useDepartments';
import { usePositions } from '../../organization/hooks/usePositions';
import { useCreateChangeRequest } from '../hooks/useCreateChangeRequest';
import { getErrorMessage } from '../../../lib/apiClient';
import { EMPLOYMENT_TYPE_LABELS, EMPLOYMENT_TYPE_OPTIONS } from '../../users/constants';
import type { ChangeRequestField } from '../types';

const FIELD_OPTIONS: { value: ChangeRequestField; label: string }[] = [
  { value: 'POSITION', label: 'Position' },
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'SALARY', label: 'Salary' },
  { value: 'EMPLOYMENT_TYPE', label: 'Employment Type' },
];

const selectClassName =
  'rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export function EditEmployeeInfoForm() {
  const { data: users } = useOrganizationUsers();
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();
  const [employeeId, setEmployeeId] = useState('');
  const [fieldChanged, setFieldChanged] = useState<ChangeRequestField | ''>('');
  const [newValue, setNewValue] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const createChangeRequest = useCreateChangeRequest();

  const selectedEmployee = useMemo(
    () => users?.find((user) => user.id === employeeId),
    [users, employeeId],
  );

  const currentValue = useMemo(() => {
    if (!selectedEmployee || !fieldChanged) return '';
    switch (fieldChanged) {
      case 'POSITION':
        return selectedEmployee.position?.id ?? '';
      case 'DEPARTMENT':
        return selectedEmployee.department?.id ?? '';
      case 'SALARY':
        return selectedEmployee.salary != null ? String(selectedEmployee.salary) : '';
      case 'EMPLOYMENT_TYPE':
        return selectedEmployee.employmentType ?? '';
      default:
        return '';
    }
  }, [selectedEmployee, fieldChanged]);

  const currentValueLabel = useMemo(() => {
    if (!selectedEmployee || !fieldChanged) return '—';
    switch (fieldChanged) {
      case 'POSITION':
        return selectedEmployee.position?.title ?? 'Not set';
      case 'DEPARTMENT':
        return selectedEmployee.department?.name ?? 'Not set';
      case 'SALARY':
        return selectedEmployee.salary != null ? String(selectedEmployee.salary) : 'Not set';
      case 'EMPLOYMENT_TYPE':
        return selectedEmployee.employmentType
          ? EMPLOYMENT_TYPE_LABELS[selectedEmployee.employmentType]
          : 'Not set';
      default:
        return '—';
    }
  }, [selectedEmployee, fieldChanged]);

  function handleFieldChange(value: string) {
    setFieldChanged(value as ChangeRequestField);
    setNewValue('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fieldChanged) return;
    createChangeRequest.mutate(
      { employeeId, fieldChanged, oldValue: currentValue, newValue, effectiveDate },
      {
        onSuccess: () => {
          setEmployeeId('');
          setFieldChanged('');
          setNewValue('');
          setEffectiveDate('');
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5"
    >
      <h2 className="text-sm font-semibold text-slate-900">Edit employee info</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="cr-employee" className="text-sm font-medium text-slate-700">
          Employee
        </label>
        <select
          id="cr-employee"
          required
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className={selectClassName}
        >
          <option value="" disabled>
            Select an employee
          </option>
          {users?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cr-field" className="text-sm font-medium text-slate-700">
          Field
        </label>
        <select
          id="cr-field"
          required
          value={fieldChanged}
          onChange={(e) => handleFieldChange(e.target.value)}
          className={selectClassName}
        >
          <option value="" disabled>
            Select a field
          </option>
          {FIELD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Current value</label>
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            {employeeId && fieldChanged ? currentValueLabel : '—'}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="cr-new" className="text-sm font-medium text-slate-700">
            New value
          </label>
          {fieldChanged === 'POSITION' && (
            <select
              id="cr-new"
              required
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className={selectClassName}
            >
              <option value="" disabled>
                Select a position
              </option>
              {positions?.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.title}
                </option>
              ))}
            </select>
          )}
          {fieldChanged === 'DEPARTMENT' && (
            <select
              id="cr-new"
              required
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className={selectClassName}
            >
              <option value="" disabled>
                Select a department
              </option>
              {departments?.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          )}
          {fieldChanged === 'EMPLOYMENT_TYPE' && (
            <select
              id="cr-new"
              required
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className={selectClassName}
            >
              <option value="" disabled>
                Select employment type
              </option>
              {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          )}
          {fieldChanged === 'SALARY' && (
            <input
              id="cr-new"
              type="number"
              min={0}
              required
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className={selectClassName}
            />
          )}
          {!fieldChanged && (
            <input
              id="cr-new"
              type="text"
              disabled
              placeholder="Select a field first"
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cr-date" className="text-sm font-medium text-slate-700">
          Effective date
        </label>
        <input
          id="cr-date"
          type="date"
          required
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
          className={selectClassName}
        />
      </div>

      {createChangeRequest.isError && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(createChangeRequest.error)}
        </p>
      )}

      <button
        type="submit"
        disabled={
          createChangeRequest.isPending ||
          !employeeId ||
          !fieldChanged ||
          !newValue ||
          !effectiveDate
        }
        className="self-start rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {createChangeRequest.isPending ? 'Submitting...' : 'Submit change request'}
      </button>
    </form>
  );
}
