import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTask, updateTaskStatus, assignTask, addComment, presignUpload, confirmUpload, createTask } from '../../api/tasks';
import { getUsers } from '../../api/users';
import { getDepartments } from '../../api/departments';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const STATUS_COLOR = {
  pending:        'bg-gray-100 text-gray-700',
  assigned:       'bg-blue-100 text-blue-700',
  in_progress:    'bg-yellow-100 text-yellow-700',
  submitted:      'bg-purple-100 text-purple-700',
  needs_revision: 'bg-orange-100 text-orange-700',
  completed:      'bg-green-100 text-green-700',
  cancelled:      'bg-red-100 text-red-600',
};

const ALLOWED_NEXT = {
  super_admin: { pending: [], assigned: ['in_progress'], in_progress: ['submitted'], submitted: ['completed', 'needs_revision'], needs_revision: ['in_progress'], completed: [], cancelled: [] },
  admin:       { pending: [], assigned: ['in_progress'], in_progress: ['submitted'], submitted: ['completed', 'needs_revision'], needs_revision: ['in_progress'], completed: [], cancelled: [] },
  hod:         { pending: [], assigned: ['in_progress'], in_progress: ['submitted'], submitted: ['completed', 'needs_revision'], needs_revision: ['in_progress'], completed: [], cancelled: [] },
  employee:    { pending: [], assigned: ['in_progress'], in_progress: ['submitted'], submitted: [], needs_revision: ['in_progress'], completed: [], cancelled: [] },
};

const EMPTY_SUBTASK = { title: '', description: '', department_id: '', tat_type: 'days', tat_days: '', priority: 'medium' };

function SubtaskRow({ subtask, users, canManage, taskId, onRefresh }) {
  const [assigning, setAssigning] = useState(false);
  const [assignTo, setAssignTo] = useState('');
  const qc = useQueryClient();

  const deptUsers = users.filter(u => u.department_id === subtask.department_id && u.role === 'employee' && u.is_active);

  const assignMutation = useMutation({
    mutationFn: (data) => assignTask(subtask.id, data),
    onSuccess: () => { setAssigning(false); onRefresh(); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ status }) => updateTaskStatus(subtask.id, { status }),
    onSuccess: onRefresh,
  });

  const nextStatuses = canManage
    ? { pending: [], assigned: ['in_progress'], in_progress: ['submitted'], submitted: ['completed', 'needs_revision'], needs_revision: ['in_progress'], completed: [], cancelled: [] }[subtask.status] || []
    : { assigned: ['in_progress'], in_progress: ['submitted'], needs_revision: ['in_progress'] }[subtask.status] || [];

  return (
    <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">{subtask.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[subtask.status] || 'bg-gray-100 text-gray-600'}`}>
              {subtask.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {subtask.department_name || '—'} · {subtask.assigned_to_name || 'Unassigned'}
            {subtask.due_date && (
              <span className={`ml-2 ${new Date(subtask.due_date) < new Date() && subtask.status !== 'completed' ? 'text-red-500' : ''}`}>
                · Due {new Date(subtask.due_date).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {canManage && subtask.status === 'pending' && !assigning && (
            <button onClick={() => setAssigning(true)}
              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 border border-transparent hover:border-blue-200">
              Assign
            </button>
          )}
          {nextStatuses.filter(s => s !== 'needs_revision').map(s => (
            <button key={s} onClick={() => statusMutation.mutate({ status: s })}
              disabled={statusMutation.isPending}
              className="text-xs bg-primary text-brand-dark px-2 py-1 rounded hover:bg-brand-green disabled:opacity-50 capitalize">
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {assigning && (
        <div className="mt-2 flex gap-2">
          <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Select employee…</option>
            {deptUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button onClick={() => assignMutation.mutate({ assigned_to: parseInt(assignTo) })}
            disabled={!assignTo || assignMutation.isPending}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
            Assign
          </button>
          <button onClick={() => setAssigning(false)}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: task, isLoading } = useQuery({ queryKey: ['task', id], queryFn: () => getTask(id) });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => getUsers({}), enabled: ['super_admin','admin','hod'].includes(user?.role) });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: () => getDepartments(), enabled: ['super_admin','admin','hod'].includes(user?.role) });

  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [uploading, setUploading] = useState(false);

  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [subtaskForm, setSubtaskForm] = useState(EMPTY_SUBTASK);
  const [subtaskError, setSubtaskError] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['task', id] });

  const statusMutation = useMutation({
    mutationFn: ({ status, note }) => updateTaskStatus(id, { status, note }),
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: (data) => assignTask(id, data),
    onSuccess: invalidate,
  });

  const commentMutation = useMutation({
    mutationFn: (data) => addComment(data),
    onSuccess: () => { setComment(''); invalidate(); },
  });

  const createSubtaskMutation = useMutation({
    mutationFn: (data) => createTask(data),
    onSuccess: () => {
      setShowSubtaskForm(false);
      setSubtaskForm(EMPTY_SUBTASK);
      setSubtaskError('');
      invalidate();
    },
    onError: (err) => setSubtaskError(err.response?.data?.message || 'Failed to create subtask'),
  });

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { upload_url, storage_key, file_url } = await presignUpload({
        task_id: parseInt(id),
        file_name: file.name,
        file_type: file.type,
      });
      await axios.put(upload_url, file, { headers: { 'Content-Type': file.type } });
      await confirmUpload({
        task_id: parseInt(id),
        original_name: file.name,
        storage_key,
        file_url,
        file_type: file.type,
        file_size_bytes: file.size,
      });
      invalidate();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  }

  function handleAddSubtask() {
    if (!subtaskForm.title.trim()) return setSubtaskError('Title is required');
    setSubtaskError('');
    createSubtaskMutation.mutate({
      project_id: task.project_id,
      parent_task_id: parseInt(id),
      title: subtaskForm.title,
      description: subtaskForm.description || undefined,
      department_id: subtaskForm.department_id ? parseInt(subtaskForm.department_id) : undefined,
      tat_type: subtaskForm.tat_type,
      tat_days: subtaskForm.tat_days ? parseInt(subtaskForm.tat_days) : undefined,
      priority: subtaskForm.priority,
    });
  }

  if (isLoading || !task) return <p className="text-gray-400 text-sm">Loading…</p>;

  const nextStatuses = (ALLOWED_NEXT[user?.role] || {})[task.status] || [];
  const canAssign = ['super_admin','admin','hod'].includes(user?.role) && task.status === 'pending';
  const canManage = ['super_admin','admin','hod'].includes(user?.role);
  const deptUsers = users.filter(u => u.department_id === task.department_id && u.role === 'employee');

  const subtasks = task.subtasks || [];
  const incompleteSubtasks = subtasks.filter(s => s.status !== 'completed' && s.status !== 'cancelled');
  const blockedBySubtasks = incompleteSubtasks.length > 0 && ['submitted', 'completed'].some(s => nextStatuses.includes(s));

  return (
    <div className="max-w-3xl">
      <Link to="/tasks" className="text-xs text-gray-400 hover:text-gray-600">← Tasks</Link>

      <div className="flex items-start justify-between mt-2 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{task.project_name} · {task.department_name}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLOR[task.status] || 'bg-gray-100 text-gray-600'}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-400">Assigned to</p>
          <p className="font-medium mt-0.5">{task.assigned_to_name || '—'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-400">Due date</p>
          <p className={`font-medium mt-0.5 ${task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-red-600' : ''}`}>
            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-400">Priority</p>
          <p className="font-medium mt-0.5 capitalize">{task.priority}</p>
        </div>
      </div>

      {task.description && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 text-sm text-gray-700">{task.description}</div>
      )}

      {/* Actions */}
      {(nextStatuses.length > 0 || canAssign) && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Actions</p>
          {blockedBySubtasks && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs text-amber-700">
              {incompleteSubtasks.length} subtask{incompleteSubtasks.length > 1 ? 's' : ''} must be completed before this task can be submitted or completed.
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {canAssign && (
              <div className="flex gap-2 w-full">
                <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                  <option value="">Select employee…</option>
                  {deptUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <button onClick={() => assignMutation.mutate({ assigned_to: parseInt(assignTo) })}
                  disabled={!assignTo}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-50">
                  Assign
                </button>
              </div>
            )}
            {nextStatuses.includes('needs_revision') && (
              <div className="flex gap-2 w-full">
                <input value={revisionNote} onChange={e => setRevisionNote(e.target.value)}
                  placeholder="Revision note…"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
                <button onClick={() => statusMutation.mutate({ status: 'needs_revision', note: revisionNote })}
                  className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-sm">
                  Send Back
                </button>
              </div>
            )}
            {nextStatuses.filter(s => s !== 'needs_revision').map(s => (
              <button key={s} onClick={() => statusMutation.mutate({ status: s })}
                disabled={blockedBySubtasks && ['submitted','completed'].includes(s)}
                className="bg-primary text-brand-dark px-4 py-1.5 rounded-lg text-sm capitalize hover:bg-brand-green disabled:opacity-40 disabled:cursor-not-allowed">
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subtasks */}
      {!task.parent_task_id && (
        <div className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-700">Subtasks</p>
              {subtasks.length > 0 && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {subtasks.filter(s => s.status === 'completed').length}/{subtasks.length} done
                </span>
              )}
            </div>
            {canManage && (
              <button
                onClick={() => { setShowSubtaskForm(v => !v); setSubtaskError(''); setSubtaskForm(EMPTY_SUBTASK); }}
                className="text-xs text-primary hover:text-brand-green font-medium">
                {showSubtaskForm ? 'Cancel' : '+ Add Subtask'}
              </button>
            )}
          </div>

          {showSubtaskForm && (
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              {subtaskError && <div className="bg-red-50 text-red-700 text-xs rounded-lg p-2 mb-2">{subtaskError}</div>}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="col-span-2">
                  <input
                    value={subtaskForm.title}
                    onChange={e => setSubtaskForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Subtask title *"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <select
                  value={subtaskForm.department_id}
                  onChange={e => setSubtaskForm(f => ({ ...f, department_id: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">No department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select
                  value={subtaskForm.priority}
                  onChange={e => setSubtaskForm(f => ({ ...f, priority: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                  value={subtaskForm.tat_type}
                  onChange={e => setSubtaskForm(f => ({ ...f, tat_type: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="days">Days TAT</option>
                  <option value="fixed">Fixed date</option>
                </select>
                <input
                  type="number" min="1"
                  value={subtaskForm.tat_days}
                  onChange={e => setSubtaskForm(f => ({ ...f, tat_days: e.target.value }))}
                  placeholder="TAT days"
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddSubtask}
                  disabled={createSubtaskMutation.isPending}
                  className="bg-primary text-brand-dark px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-green disabled:opacity-50">
                  {createSubtaskMutation.isPending ? 'Adding…' : 'Add Subtask'}
                </button>
              </div>
            </div>
          )}

          {subtasks.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {subtasks.map(s => (
                <SubtaskRow
                  key={s.id}
                  subtask={s}
                  users={users}
                  canManage={canManage}
                  taskId={id}
                  onRefresh={invalidate}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-6">No subtasks yet</p>
          )}
        </div>
      )}

      {/* Attachments */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Attachments</p>
          <label className="cursor-pointer text-xs text-primary hover:underline">
            {uploading ? 'Uploading…' : '+ Upload'}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
        {task.attachments?.length > 0 ? (
          <div className="space-y-2">
            {task.attachments.map(a => (
              <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <span>📎</span>{a.original_name}
              </a>
            ))}
          </div>
        ) : <p className="text-xs text-gray-400">No attachments</p>}
      </div>

      {/* Comments */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Comments</p>
        <div className="space-y-3 mb-4">
          {task.comments?.map(c => (
            <div key={c.id} className={`text-sm rounded-lg p-3 ${c.is_internal ? 'bg-yellow-50 border border-yellow-100' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-700">{c.user_name}</span>
                {c.is_internal && <span className="text-xs text-yellow-600">Internal</span>}
              </div>
              <p className="text-gray-600">{c.comment}</p>
            </div>
          ))}
          {!task.comments?.length && <p className="text-xs text-gray-400">No comments yet</p>}
        </div>
        <div className="flex gap-2">
          <input value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          {['super_admin','admin','hod'].includes(user?.role) && (
            <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
              <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
              Internal
            </label>
          )}
          <button onClick={() => commentMutation.mutate({ task_id: parseInt(id), comment, is_internal: isInternal })}
            disabled={!comment.trim()}
            className="bg-primary text-brand-dark px-4 py-1.5 rounded-lg text-sm disabled:opacity-50">
            Post
          </button>
        </div>
      </div>

      {/* Status History */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">History</p>
        <div className="space-y-2">
          {task.history?.map(h => (
            <div key={h.id} className="flex items-start gap-3 text-xs text-gray-500">
              <span className="shrink-0">{new Date(h.created_at).toLocaleString()}</span>
              <span><strong>{h.changed_by_name}</strong> → <span className="capitalize">{h.new_status.replace('_', ' ')}</span></span>
              {h.note && <span className="text-gray-400 italic">"{h.note}"</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
