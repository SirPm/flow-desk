import { useState, type FormEvent } from 'react';
import { useOrganizationUsers } from '../../users/hooks/useOrganizationUsers';
import { useCreateChangeRequest } from '../hooks/useCreateChangeRequest';
import { getErrorMessage } from '../../../lib/apiClient';

const COMMON_FIELDS = ['Position', 'Department', 'Salary', 'Employment Type'];

export function EditEmployeeInfoForm() {
  const { data: users } = useOrganizationUsers();
  const [employeeId, setEmployeeId] = useState('');
  const [fieldChanged, setFieldChanged] = useState('');
  const [oldValue, setOldValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const createChangeRequest = useCreateChangeRequest();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createChangeRequest.mutate(
      { employeeId, fieldChanged, oldValue, newValue, effectiveDate },
      {
        onSuccess: () => {
          setEmployeeId('');
          setFieldChanged('');
          setOldValue('');
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
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        <input
          id="cr-field"
          type="text"
          required
          list="cr-field-options"
          value={fieldChanged}
          onChange={(e) => setFieldChanged(e.target.value)}
          placeholder="e.g. Position"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <datalist id="cr-field-options">
          {COMMON_FIELDS.map((field) => (
            <option key={field} value={field} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="cr-old" className="text-sm font-medium text-slate-700">
            Current value
          </label>
          <input
            id="cr-old"
            type="text"
            required
            value={oldValue}
            onChange={(e) => setOldValue(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="cr-new" className="text-sm font-medium text-slate-700">
            New value
          </label>
          <input
            id="cr-new"
            type="text"
            required
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
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
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {createChangeRequest.isError && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(createChangeRequest.error)}
        </p>
      )}

      <button
        type="submit"
        disabled={createChangeRequest.isPending || !employeeId || !fieldChanged || !effectiveDate}
        className="self-start rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {createChangeRequest.isPending ? 'Submitting...' : 'Submit change request'}
      </button>
    </form>
  );
}
