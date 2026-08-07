import { useState, type FormEvent } from 'react';
import { useDepartments } from '../hooks/useDepartments';
import { useCreateDepartment } from '../hooks/useCreateDepartment';
import { useDeleteDepartment } from '../hooks/useDeleteDepartment';
import { getErrorMessage } from '../../../lib/apiClient';

export function DepartmentList() {
  const { data: departments, isLoading, isError } = useDepartments();
  const createDepartment = useCreateDepartment();
  const deleteDepartment = useDeleteDepartment();
  const [name, setName] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createDepartment.mutate(name, { onSuccess: () => setName('') });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Departments</h2>

      {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
      {isError && <p className="text-sm text-red-600">Could not load departments.</p>}

      {departments && departments.length === 0 && (
        <p className="text-sm text-slate-500">No departments yet.</p>
      )}

      {departments && departments.length > 0 && (
        <ul className="flex flex-col gap-1">
          {departments.map((department) => (
            <li
              key={department.id}
              className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm text-slate-700"
            >
              {department.name}
              <button
                type="button"
                disabled={deleteDepartment.isPending}
                onClick={() => deleteDepartment.mutate(department.id)}
                className="text-xs font-medium text-red-600 hover:text-red-500 disabled:opacity-60"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Engineering"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={createDepartment.isPending || !name}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {(createDepartment.isError || deleteDepartment.isError) && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(createDepartment.error ?? deleteDepartment.error)}
        </p>
      )}
    </div>
  );
}
