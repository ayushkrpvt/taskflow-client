import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getProjects } from '../../api/projects';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLOR = {
  active: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function ProjectList() {
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useQuery({ queryKey: ['projects'], queryFn: getProjects });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        {user?.role === 'super_admin' && (
          <Link to="/projects/new" className="bg-primary text-brand-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-green transition-colors">
            New Project
          </Link>
        )}
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="grid gap-4">
          {projects.map(p => (
            <Link key={p.project_id} to={`/projects/${p.project_id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary transition-colors block">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{p.project_name}</h3>
                  {p.template_name && <p className="text-xs text-gray-500 mt-0.5">Template: {p.template_name}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.project_status] || 'bg-gray-100 text-gray-600'}`}>
                  {p.project_status}
                </span>
              </div>
              <div className="mt-3 flex gap-6 text-xs text-gray-500">
                <span>{p.total_tasks} tasks</span>
                <span className="text-green-600">{p.completed_tasks} done</span>
                <span className="text-red-500">{p.overdue_tasks} overdue</span>
                {p.start_date && <span>Started {new Date(p.start_date).toLocaleDateString()}</span>}
              </div>
              {p.total_tasks > 0 && (
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.round((p.completed_tasks / p.total_tasks) * 100)}%` }}
                  />
                </div>
              )}
            </Link>
          ))}
          {projects.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-12">No projects yet</p>
          )}
        </div>
      )}
    </div>
  );
}
