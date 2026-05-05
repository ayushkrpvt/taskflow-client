import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createProject } from '../../api/projects';
import { getTemplates } from '../../api/templates';

export default function CreateProject() {
  const navigate = useNavigate();
  const { data: templates = [] } = useQuery({ queryKey: ['templates'], queryFn: getTemplates });

  const [form, setForm] = useState({ name: '', description: '', template_id: '', start_date: '', expected_end_date: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await createProject({
        ...form,
        template_id: form.template_id || null,
      });
      navigate(`/projects/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">New Project</h2>

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
          <input value={form.name} onChange={set('name')} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={set('description')} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template (optional)</label>
          <select value={form.template_id} onChange={set('template_id')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">No template</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.task_count} tasks)</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={form.start_date} onChange={set('start_date')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected End</label>
            <input type="date" value={form.expected_end_date} onChange={set('expected_end_date')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-primary text-brand-dark px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-green disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Project'}
          </button>
          <button type="button" onClick={() => navigate('/projects')}
            className="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
