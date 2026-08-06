import { useState, type FormEvent } from 'react';
import type { Role } from '../../auth/types';
import { useCreateWorkflowTemplate } from '../hooks/useCreateWorkflowTemplate';
import { StepBuilder } from './StepBuilder';
import { getErrorMessage } from '../../../lib/apiClient';

export function CreateTemplateForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<Role[]>([]);
  const createTemplate = useCreateWorkflowTemplate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createTemplate.mutate(
      { name, steps },
      {
        onSuccess: () => {
          setName('');
          setSteps([]);
          onCreated?.();
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5"
    >
      <h2 className="text-sm font-semibold text-slate-900">New workflow template</h2>
      <div className="flex flex-col gap-1">
        <label htmlFor="template-name" className="text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          id="template-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Expense Approval"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Approval steps, in order</span>
        <StepBuilder steps={steps} onChange={setSteps} />
      </div>
      {createTemplate.isError && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(createTemplate.error)}
        </p>
      )}
      <button
        type="submit"
        disabled={createTemplate.isPending || steps.length === 0 || !name}
        className="self-start rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {createTemplate.isPending ? 'Creating...' : 'Create template'}
      </button>
    </form>
  );
}
