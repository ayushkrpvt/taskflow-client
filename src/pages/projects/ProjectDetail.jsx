import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { getProject } from '../../api/projects';
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

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: project } = useQuery({ queryKey: ['project', id], queryFn: () => getProject(id) });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks', { project_id: id }], queryFn: () => getTasks({ project_id: id }) });

  if (!project) return <p className="text-gray-400 text-sm">Loading…</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/projects" className="text-xs text-gray-400 hover:text-gray-600">← Projects</Link>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">{project.project_name}</h2>
          {project.template_name && <p className="text-sm text-gray-500 mt-0.5">Template: {project.template_name}</p>}
        </div>
        {['super_admin','admin','hod'].includes(user?.role) && (
          <Link to={`/tasks/new?project_id=${id}`}
            className="bg-primary text-brand-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-green">
            Add Task
          </Link>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: project.total_tasks },
          { label: 'Completed', value: project.completed_tasks, color: 'text-green-600' },
          { label: 'In Progress', value: project.in_progress_tasks, color: 'text-yellow-600' },
          { label: 'Overdue', value: project.overdue_tasks, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color || 'text-gray-900'}`}>{s.value || 0}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-900 text-sm">Tasks</div>
        <div className="divide-y divide-gray-50">
          {tasks.map(task => (
            <Link key={task.id} to={`/tasks/${task.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 block">
              <div>
                <p className="text-sm font-medium text-gray-900">{task.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{task.department_name} · {task.assigned_to_name || 'Unassigned'}</p>
              </div>
              <div className="flex items-center gap-3">
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
          {tasks.length === 0 && <p className="text-center py-10 text-sm text-gray-400">No tasks in this project</p>}
        </div>
      </div>
    </div>
  );
}
