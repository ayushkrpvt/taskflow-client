import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createTask } from '../../api/tasks';
import { getProjects } from '../../api/projects';
import { getDepartments } from '../../api/departments';
import { useAuth } from '../../context/AuthContext';

export default function CreateTask() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: getDepartments });

  const visibleDepts = user?.role === 'hod'
    ? departments.filter(d => d.id === user.department_id)
    : departments;

  const [form, setForm] = useState({
    project_id: params.get('project_id') || '',
    title: '', description: '',
    department_id: user?.role === 'hod' ? String(user.department_id) : '',
    tat_type: 'days', tat_days: '', due_date: '',
    priority: 'medium',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        project_id: parseInt(form.project_id),
        department_id: parseInt(form.department_id),
        tat_days: form.tat_days ? parseInt(form.tat_days) : null,
        due_date: form.tat_type === 'fixed_date' ? form.due_date : null,
      };
      const data = await createTask(payload);
      navigate(`/tasks/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">New Task</h2>
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
          <select value={form.project_id} onChange={set('project_id')} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select project</option>
            {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input value={form.title} onChange={set('title')} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
          <select value={form.department_id} onChange={set('department_id')} required
            disabled={user?.role === 'hod'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50">
            <option value="">Select department</option>
            {visibleDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">TAT Type</label>
            <select value={form.tat_type} onChange={set('tat_type')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="days">Days from assignment</option>
              <option value="fixed_date">Fixed date</option>
            </select>
          </div>
          {form.tat_type === 'days' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TAT Days</label>
              <input type="number" min="1" value={form.tat_days} onChange={set('tat_days')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={set('due_date')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select value={form.priority} onChange={set('priority')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-primary text-brand-dark px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-green disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Task'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
