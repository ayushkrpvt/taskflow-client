import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTemplates, getTemplate, createTemplate, updateTemplate } from '../../api/templates';
import { getDepartments } from '../../api/departments';

// Reusable task editor rows used in both create and edit forms
function TaskRows({ tasks, departments, onChange, onAdd, onRemove }) {
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
      <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 font-medium px-1">
        <span className="col-span-1">#</span>
        <span className="col-span-5">Task Title</span>
        <span className="col-span-4">Department</span>
        <span className="col-span-1">TAT</span>
        <span className="col-span-1"></span>
      </div>
      {tasks.map((task, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <span className="col-span-1 text-xs text-gray-400 text-center">{i + 1}</span>
          <input
            value={task.title}
            onChange={e => onChange(i, 'title', e.target.value)}
            placeholder="Task title"
            className="col-span-5 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={task.department_id || ''}
            onChange={e => onChange(i, 'department_id', e.target.value)}
            className="col-span-4 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">No dept</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input
            type="number" min="1"
            value={task.tat_days}
            onChange={e => onChange(i, 'tat_days', e.target.value)}
            className="col-span-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            disabled={tasks.length === 1}
            className="col-span-1 text-gray-300 hover:text-red-500 disabled:opacity-20 text-center text-lg leading-none"
          >×</button>
        </div>
      ))}
      <button type="button" onClick={onAdd} className="text-xs text-brand-green hover:underline mt-1">
        + Add task
      </button>
    </div>
  );
}

function TemplateCard({ t, departments }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTasks, setEditTasks] = useState([]);
  const [error, setError] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['template', t.id],
    queryFn: () => getTemplate(t.id),
    enabled: open,
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateTemplate(t.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      qc.invalidateQueries({ queryKey: ['template', t.id] });
      setEditing(false);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to update template'),
  });

  function startEdit() {
    const tasks = data?.tasks || [];
    setEditName(data?.name || t.name);
    setEditDesc(data?.description || t.description || '');
    setEditTasks(tasks.map(tt => ({
      title: tt.title,
      department_id: tt.department_id || '',
      tat_days: tt.tat_days || 1,
      step_order: tt.step_order,
    })));
    setEditing(true);
  }

  function addTask() {
    setEditTasks(prev => [...prev, { title: '', department_id: '', tat_days: 1, step_order: prev.length + 1 }]);
  }

  function removeTask(i) {
    setEditTasks(prev => prev.filter((_, idx) => idx !== i).map((t, idx) => ({ ...t, step_order: idx + 1 })));
  }

  function changeTask(i, field, value) {
    setEditTasks(prev => prev.map((task, idx) => idx === i ? { ...task, [field]: value } : task));
  }

  function handleSave(e) {
    e.preventDefault();
    setError('');
    if (!editName.trim()) return setError('Template name is required');
    if (editTasks.some(t => !t.title.trim())) return setError('All tasks must have a title');
    updateMutation.mutate({
      name: editName,
      description: editDesc,
      tasks: editTasks.map(t => ({
        ...t,
        department_id: t.department_id ? parseInt(t.department_id) : null,
        tat_days: parseInt(t.tat_days) || 1,
      })),
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5">
        <button onClick={() => { setOpen(o => !o); setEditing(false); }} className="flex-1 text-left">
          <h3 className="font-semibold text-gray-900">{t.name}</h3>
          {t.description && <p className="text-sm text-gray-500 mt-0.5">{t.description}</p>}
          <p className="text-xs text-gray-400 mt-1">Created by {t.created_by_name}</p>
        </button>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <span className="text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">
            {t.task_count} tasks
          </span>
          <button
            onClick={() => { if (!open) setOpen(true); startEdit(); }}
            className="text-xs text-gray-400 hover:text-brand-green px-2 py-1 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200"
          >
            Edit
          </button>
          <button onClick={() => { setOpen(o => !o); setEditing(false); }}
            className={`text-gray-400 text-lg transition-transform px-1 ${open ? 'rotate-180' : ''}`}>
            ▾
          </button>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="border-t border-gray-100">
          {isFetching ? (
            <p className="text-xs text-gray-400 px-5 py-4">Loading tasks…</p>
          ) : editing ? (
            /* ── Edit form ── */
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Template Name *</label>
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Tasks</label>
                <TaskRows
                  tasks={editTasks}
                  departments={departments}
                  onChange={changeTask}
                  onAdd={addTask}
                  onRemove={removeTask}
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button type="submit" disabled={updateMutation.isPending}
                  className="bg-primary text-brand-dark px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-green disabled:opacity-50">
                  {updateMutation.isPending ? 'Saving…' : `Save (${editTasks.length} tasks)`}
                </button>
                <button type="button" onClick={() => setEditing(false)}
                  className="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* ── Read-only task list ── */
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-gray-50 text-xs font-medium text-gray-400 uppercase tracking-wide">
                <span className="col-span-1">#</span>
                <span className="col-span-6">Task</span>
                <span className="col-span-3">Department</span>
                <span className="col-span-2 text-right">TAT</span>
              </div>
              {(data?.tasks || []).map(task => (
                <div key={task.id} className="grid grid-cols-12 gap-2 px-5 py-2.5 items-center text-sm hover:bg-gray-50">
                  <span className="col-span-1 text-xs text-gray-400">{task.step_order}</span>
                  <span className="col-span-6 text-gray-800">{task.title}</span>
                  <span className="col-span-3 text-xs text-gray-500">{task.department_name || '—'}</span>
                  <span className="col-span-2 text-xs text-gray-400 text-right">{task.tat_days}d</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TemplateList() {
  const qc = useQueryClient();
  const { data: templates = [], isLoading } = useQuery({ queryKey: ['templates'], queryFn: getTemplates });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: getDepartments });

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState([{ title: '', department_id: '', tat_days: 1, step_order: 1 }]);
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      setShowForm(false);
      setName('');
      setDescription('');
      setTasks([{ title: '', department_id: '', tat_days: 1, step_order: 1 }]);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to create template'),
  });

  function addTask() {
    setTasks(prev => [...prev, { title: '', department_id: '', tat_days: 1, step_order: prev.length + 1 }]);
  }

  function removeTask(i) {
    setTasks(prev => prev.filter((_, idx) => idx !== i).map((t, idx) => ({ ...t, step_order: idx + 1 })));
  }

  function changeTask(i, field, value) {
    setTasks(prev => prev.map((task, idx) => idx === i ? { ...task, [field]: value } : task));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Template name is required');
    if (tasks.some(t => !t.title.trim())) return setError('All tasks must have a title');
    createMutation.mutate({
      name, description,
      tasks: tasks.map(t => ({
        ...t,
        department_id: t.department_id ? parseInt(t.department_id) : null,
        tat_days: parseInt(t.tat_days) || 1,
      })),
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Templates</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-brand-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-green transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Template'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Template</h3>
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New Store Launch"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tasks</label>
              <TaskRows tasks={tasks} departments={departments} onChange={changeTask} onAdd={addTask} onRemove={removeTask} />
            </div>
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button type="submit" disabled={createMutation.isPending}
                className="bg-primary text-brand-dark px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-green disabled:opacity-50">
                {createMutation.isPending ? 'Creating…' : `Create Template (${tasks.length} tasks)`}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Template list */}
      {isLoading ? <p className="text-gray-400 text-sm">Loading…</p> : (
        <div className="grid gap-4">
          {templates.map(t => <TemplateCard key={t.id} t={t} departments={departments} />)}
          {templates.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-12">No templates yet — create one above</p>
          )}
        </div>
      )}
    </div>
  );
}
