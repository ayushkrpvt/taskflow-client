import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getTasks } from '../../api/tasks';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLOR = {
  pending:        'bg-gray-100 text-gray-600',
  assigned:       'bg-blue-100 text-blue-700',
  in_progress:    'bg-yellow-100 text-yellow-700',
  submitted:      'bg-purple-100 text-purple-700',
  needs_revision: 'bg-orange-100 text-orange-700',
  completed:      'bg-green-100 text-green-700',
  cancelled:      'bg-red-100 text-red-600',
};

const PRIORITY_COLOR = { low: 'text-gray-400', medium: 'text-blue-500', high: 'text-orange-500', critical: 'text-red-600' };

export default function TaskList() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', { status: statusFilter }],
    queryFn: () => getTasks({ status: statusFilter || undefined }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
        {['super_admin','admin','hod'].includes(user?.role) && (
          <Link to="/tasks/new" className="bg-primary text-brand-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-green">
            New Task
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'pending', 'assigned', 'in_progress', 'submitted', 'needs_revision', 'completed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary text-brand-dark' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? <p className="text-gray-400 text-sm">Loading…</p> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {tasks.map(task => (
              <Link key={task.id} to={`/tasks/${task.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 block">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{task.project_name} · {task.department_name}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className={`text-xs font-semibold uppercase ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>
                  {task.due_date && (
                    <span className={`text-xs ${new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-red-500' : 'text-gray-400'}`}>
                      {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[task.status] || 'bg-gray-100 text-gray-600'}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </Link>
            ))}
            {tasks.length === 0 && <p className="text-center py-12 text-sm text-gray-400">No tasks</p>}
          </div>
        </div>
      )}
    </div>
  );
}
