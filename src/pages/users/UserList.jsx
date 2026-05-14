import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, changePassword } from '../../api/users';
import { getDepartments } from '../../api/departments';
import { getTerritories, getUserTerritories, setUserTerritories } from '../../api/territories';
import TerritorySelector from '../../components/TerritorySelector';

const ROLE_BADGE = {
  super_admin: 'bg-red-100 text-red-700',
  admin:       'bg-orange-100 text-orange-700',
  hod:         'bg-blue-100 text-blue-700',
  employee:    'bg-gray-100 text-gray-600',
};

const EMPTY_FORM = { name: '', email: '', password: '', role: 'employee', department_id: '' };

// Reusable territory picker used in both create and edit flows
function TerritoryPicker({ assigned, onChange }) {
  const [adding, setAdding] = useState(false);
  const [pendingId, setPendingId] = useState('');
  const { data: all = [] } = useQuery({ queryKey: ['territories-all-flat'], queryFn: () => getTerritories({}) });

  function addTerritory() {
    if (!pendingId) return;
    if (assigned.find(t => t.id === pendingId)) { setAdding(false); setPendingId(''); return; }
    const found = all.find(t => t.id === pendingId);
    onChange([...assigned, { id: pendingId, name: found?.name || `Territory ${pendingId}` }]);
    setAdding(false);
    setPendingId('');
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {assigned.map(t => (
          <span key={t.id} className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            {t.name}
            <button onClick={() => onChange(assigned.filter(x => x.id !== t.id))} className="hover:text-red-500 leading-none">×</button>
          </span>
        ))}
        {assigned.length === 0 && !adding && <span className="text-xs text-gray-400">None assigned</span>}
      </div>
      {adding ? (
        <div className="space-y-2">
          <TerritorySelector value={pendingId} onChange={id => setPendingId(id)} />
          <div className="flex gap-2">
            <button onClick={addTerritory} disabled={!pendingId}
              className="text-xs bg-primary text-brand-dark px-3 py-1 rounded-lg hover:bg-brand-green disabled:opacity-50">
              Add
            </button>
            <button onClick={() => { setAdding(false); setPendingId(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="text-xs text-primary hover:text-brand-green px-2 py-1 rounded hover:bg-gray-50">
          + Add Territory
        </button>
      )}
    </div>
  );
}

function UserRow({ u, onEdit, onToggleActive }) {
  return (
    <div className={`flex items-center justify-between px-5 py-3.5 ${!u.is_active ? 'opacity-50' : ''}`}>
      <div>
        <p className="text-sm font-medium text-gray-900">{u.name}</p>
        <p className="text-xs text-gray-400">{u.email} · {u.department_name || '—'}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-600'}`}>
          {u.role.replace('_', ' ')}
        </span>
        {!u.is_active && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Inactive</span>}
        <button onClick={() => onEdit(u)}
          className="text-xs text-gray-400 hover:text-primary px-2 py-1 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200">
          Edit
        </button>
        <button onClick={() => onToggleActive(u)}
          className={`text-xs px-2 py-1 rounded border ${
            u.is_active
              ? 'text-red-400 hover:text-red-600 hover:bg-red-50 border-transparent hover:border-red-200'
              : 'text-green-500 hover:text-green-700 hover:bg-green-50 border-transparent hover:border-green-200'
          }`}>
          {u.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
}

export default function UserList() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: () => getUsers({}) });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: getDepartments });

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createTerritories, setCreateTerritories] = useState([]);
  const [createError, setCreateError] = useState('');

  // Edit modal
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');
  const [editTerritories, setEditTerritories] = useState([]);
  const [terrSaveSuccess, setTerrSaveSuccess] = useState(false);
  const [terrSaveError, setTerrSaveError] = useState('');

  // Password reset
  const [newPassword, setNewPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  const { data: userTerritories = [] } = useQuery({
    queryKey: ['user-territories', editUser?.id],
    queryFn: () => getUserTerritories(editUser.id),
    enabled: !!editUser && editUser.role === 'employee',
  });

  useEffect(() => {
    setEditTerritories(userTerritories.map(t => ({ id: t.id, name: t.name })));
  }, [userTerritories]);

  const setC = (k) => (e) => setCreateForm(f => ({ ...f, [k]: e.target.value }));
  const setE = (k) => (e) => setEditForm(f => ({ ...f, [k]: e.target.value }));

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const user = await createUser(payload);
      if (createTerritories.length > 0) {
        await setUserTerritories(user.id, createTerritories.map(t => t.id));
      }
      return user;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      setCreateTerritories([]);
      setCreateError('');
    },
    onError: (err) => setCreateError(err.response?.data?.message || 'Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditUser(null); setEditError(''); },
    onError: (err) => setEditError(err.response?.data?.message || 'Failed to update user'),
  });

  const territoriesMutation = useMutation({
    mutationFn: ({ userId, ids }) => setUserTerritories(userId, ids),
    onSuccess: () => { setTerrSaveSuccess(true); setTerrSaveError(''); setTimeout(() => setTerrSaveSuccess(false), 3000); },
    onError: (err) => { setTerrSaveError(err.response?.data?.message || 'Failed to save territories'); },
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, password }) => changePassword(id, password),
    onSuccess: () => { setNewPassword(''); setPwSuccess(true); setPwError(''); setTimeout(() => setPwSuccess(false), 3000); },
    onError: (err) => { setPwError(err.response?.data?.message || 'Failed to reset password'); setPwSuccess(false); },
  });

  function openEdit(u) {
    setEditUser(u);
    setEditForm({ name: u.name, email: u.email, role: u.role, department_id: u.department_id || '', is_active: u.is_active });
    setEditError('');
    setNewPassword(''); setPwSuccess(false); setPwError('');
    setEditTerritories([]);
    setTerrSaveSuccess(false); setTerrSaveError('');
  }

  function handleToggleActive(u) {
    updateMutation.mutate({ id: u.id, data: { name: u.name, email: u.email, role: u.role, department_id: u.department_id, is_active: !u.is_active } });
  }

  function handleEditSave() {
    if (!editForm.name?.trim()) return setEditError('Name is required');
    if (!editForm.email?.trim()) return setEditError('Email is required');
    updateMutation.mutate({ id: editUser.id, data: { name: editForm.name, email: editForm.email, role: editForm.role, department_id: editForm.department_id || null, is_active: editForm.is_active } });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <button onClick={() => { setShowCreate(!showCreate); setCreateError(''); }}
          className="bg-primary text-brand-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-green">
          {showCreate ? 'Cancel' : 'New User'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Create User</h3>
          {createError && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-3">{createError}</div>}
          <div className="grid grid-cols-2 gap-4">
            {[['name','Name','text'],['email','Email','email'],['password','Password','password']].map(([k,l,t]) => (
              <div key={k}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{l} *</label>
                <input type={t} value={createForm[k]} onChange={setC(k)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select value={createForm.role} onChange={setC('role')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {['super_admin','admin','hod','employee'].map(r => (
                  <option key={r} value={r}>{r.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select value={createForm.department_id} onChange={setC('department_id')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">None</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          {createForm.role === 'employee' && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Territories</label>
              <TerritoryPicker assigned={createTerritories} onChange={setCreateTerritories} />
            </div>
          )}

          <button
            onClick={() => createMutation.mutate({ ...createForm, department_id: createForm.department_id || null })}
            disabled={createMutation.isPending}
            className="mt-4 bg-primary text-brand-dark px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-green disabled:opacity-50">
            {createMutation.isPending ? 'Creating…' : 'Create User'}
          </button>
        </div>
      )}

      {/* User list */}
      {isLoading ? <p className="text-gray-400 text-sm">Loading…</p> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {users.map(u => (
              <UserRow key={u.id} u={u} onEdit={openEdit} onToggleActive={handleToggleActive} />
            ))}
            {users.length === 0 && <p className="text-center py-12 text-sm text-gray-400">No users</p>}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-900">Edit User</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {editError && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3">{editError}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={editForm.name} onChange={setE('name')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={editForm.email} onChange={setE('email')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select value={editForm.role} onChange={setE('role')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {['super_admin','admin','hod','employee'].map(r => (
                      <option key={r} value={r}>{r.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select value={editForm.department_id || ''} onChange={setE('department_id')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">None</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={editForm.is_active}
                    onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                </label>
                <span className="text-sm text-gray-700">{editForm.is_active ? 'Active' : 'Inactive'}</span>
              </div>

              {/* Territories — employees only */}
              {editForm.role === 'employee' && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-2">Territories</p>
                  {terrSaveError && <div className="bg-red-50 text-red-700 text-xs rounded-lg p-2 mb-2">{terrSaveError}</div>}
                  {terrSaveSuccess && <div className="bg-green-50 text-green-700 text-xs rounded-lg p-2 mb-2">Territories saved</div>}
                  <TerritoryPicker assigned={editTerritories} onChange={setEditTerritories} />
                  <button
                    onClick={() => territoriesMutation.mutate({ userId: editUser.id, ids: editTerritories.map(t => t.id) })}
                    disabled={territoriesMutation.isPending}
                    className="mt-3 text-xs bg-gray-800 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
                    {territoriesMutation.isPending ? 'Saving…' : 'Save Territories'}
                  </button>
                </div>
              )}

              {/* Reset password */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Reset Password</p>
                {pwError   && <div className="bg-red-50 text-red-700 text-xs rounded-lg p-2 mb-2">{pwError}</div>}
                {pwSuccess && <div className="bg-green-50 text-green-700 text-xs rounded-lg p-2 mb-2">Password updated successfully</div>}
                <div className="flex gap-2">
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  <button type="button"
                    onClick={() => {
                      if (newPassword.length < 8) return setPwError('Password must be at least 8 characters');
                      passwordMutation.mutate({ id: editUser.id, password: newPassword });
                    }}
                    disabled={!newPassword || passwordMutation.isPending}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 shrink-0">
                    {passwordMutation.isPending ? 'Saving…' : 'Reset'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              <button onClick={handleEditSave} disabled={updateMutation.isPending}
                className="bg-primary text-brand-dark px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-green disabled:opacity-50">
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setEditUser(null)}
                className="px-5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
