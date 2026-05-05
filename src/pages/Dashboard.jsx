import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../api/projects';
import { getTasks } from '../api/tasks';

const STATUS_COLORS = {
  pending:        'bg-gray-100 text-gray-600',
  assigned:       'bg-blue-100 text-blue-700',
  in_progress:    'bg-yellow-100 text-yellow-700',
  submitted:      'bg-purple-100 text-purple-700',
  needs_revision: 'bg-orange-100 text-orange-700',
  completed:      'bg-green-100 text-green-700',
  cancelled:      'bg-red-100 text-red-600',
};

function StatCard({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => getTasks({}) });

  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && !['completed','cancelled'].includes(t.status));
  const pending = tasks.filter(t => t.status === 'submitted');
  const myActive = tasks.filter(t => ['assigned','in_progress'].includes(t.status));

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Welcome back, {user?.name.split(' ')[0]}
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Projects" value={projects.length} />
        <StatCard label="Active Tasks" value={myActive.length} color="text-blue-600" />
        <StatCard label="Awaiting Review" value={pending.length} color="text-purple-600" />
        <StatCard label="Overdue" value={overdue.length} color="text-red-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Recent Tasks</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {tasks.slice(0, 10).map(task => (
            <div key={task.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{task.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{task.project_name} · {task.department_name}</p>
              </div>
              <div className="flex items-center gap-3">
                {task.due_date && (
                  <span className={`text-xs ${new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-red-600' : 'text-gray-400'}`}>
                    Due {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-600'}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No tasks yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
