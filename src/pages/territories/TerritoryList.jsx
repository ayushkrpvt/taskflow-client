import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTerritories, createTerritory, deleteTerritory } from '../../api/territories';

function buildTree(flat) {
  const map = {};
  flat.forEach(t => { map[t.id] = { ...t, children: [] }; });
  const roots = [];
  flat.forEach(t => {
    if (t.parent_id) map[t.parent_id]?.children.push(map[t.id]);
    else roots.push(map[t.id]);
  });
  return roots;
}

const NEXT_TYPE = { country: 'state', state: 'zone', zone: 'city' };
const EXTRA_TYPE = { state: 'city' }; // allow adding city directly under state
const TYPE_LABEL = { country: 'Country', state: 'State', zone: 'Zone', city: 'City' };
const TYPE_COLOR = {
  country: 'bg-blue-100 text-blue-700',
  state: 'bg-purple-100 text-purple-700',
  zone: 'bg-yellow-100 text-yellow-700',
  city: 'bg-green-100 text-green-700',
};

export default function TerritoryList() {
  const qc = useQueryClient();
  const { data: all = [], isLoading } = useQuery({ queryKey: ['territories-all'], queryFn: () => getTerritories({}) });
  const [addingUnder, setAddingUnder] = useState(null);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');

  const createMutation = useMutation({
    mutationFn: createTerritory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['territories-all'] });
      qc.invalidateQueries({ queryKey: ['territories'] });
      setAddingUnder(null);
      setNewName('');
      setAddError('');
    },
    onError: (err) => setAddError(err.response?.data?.message || 'Failed to create'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTerritory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['territories-all'] });
      qc.invalidateQueries({ queryKey: ['territories'] });
    },
  });

  function handleAdd() {
    if (!newName.trim()) return setAddError('Name is required');
    createMutation.mutate({ name: newName.trim(), type: addingUnder.type, parent_id: addingUnder.parent_id || null });
  }

  function handleDelete(node) {
    if (!window.confirm(`Delete "${node.name}"? All sub-territories will also be deleted.`)) return;
    deleteMutation.mutate(node.id);
  }

  const tree = buildTree(all);

  const AddForm = ({ depth = 0 }) => (
    <div className="flex items-center gap-2 py-2" style={{ paddingLeft: `${depth * 24 + 16}px` }}>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[addingUnder?.type]}`}>{TYPE_LABEL[addingUnder?.type]}</span>
      <input
        autoFocus
        value={newName}
        onChange={e => setNewName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        placeholder={`${TYPE_LABEL[addingUnder?.type]} name…`}
        className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {addError && <span className="text-xs text-red-500">{addError}</span>}
      <button
        onClick={handleAdd}
        disabled={createMutation.isPending}
        className="text-xs bg-primary text-brand-dark px-3 py-1 rounded-lg hover:bg-brand-green disabled:opacity-50"
      >
        {createMutation.isPending ? 'Adding…' : 'Add'}
      </button>
      <button
        onClick={() => { setAddingUnder(null); setNewName(''); setAddError(''); }}
        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
      >
        Cancel
      </button>
    </div>
  );

  function renderNodes(nodes, depth = 0) {
    return nodes.map(node => (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-2 hover:bg-gray-50 rounded-lg"
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TYPE_COLOR[node.type]}`}>{TYPE_LABEL[node.type]}</span>
          <span className="text-sm text-gray-900 flex-1">{node.name}</span>
          {NEXT_TYPE[node.type] && (
            <button
              onClick={() => { setAddingUnder({ parent_id: node.id, type: NEXT_TYPE[node.type] }); setNewName(''); setAddError(''); }}
              className="text-xs text-primary hover:text-brand-green px-2 py-0.5 rounded hover:bg-gray-100"
            >
              + Add {TYPE_LABEL[NEXT_TYPE[node.type]]}
            </button>
          )}
          {EXTRA_TYPE[node.type] && (
            <button
              onClick={() => { setAddingUnder({ parent_id: node.id, type: EXTRA_TYPE[node.type] }); setNewName(''); setAddError(''); }}
              className="text-xs text-gray-400 hover:text-green-600 px-2 py-0.5 rounded hover:bg-gray-100"
            >
              + Add {TYPE_LABEL[EXTRA_TYPE[node.type]]}
            </button>
          )}
          <button
            onClick={() => handleDelete(node)}
            className="text-xs text-red-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50"
          >
            Delete
          </button>
        </div>
        {node.children && node.children.length > 0 && renderNodes(node.children, depth + 1)}
        {addingUnder?.parent_id === node.id && <AddForm depth={depth + 1} />}
      </div>
    ));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Territories</h2>
        <button
          onClick={() => { setAddingUnder({ type: 'country', parent_id: null }); setNewName(''); setAddError(''); }}
          className="bg-primary text-brand-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-green"
        >
          + Add Country
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <p className="text-gray-400 text-sm text-center py-10">Loading…</p>
        ) : (
          <div className="py-2">
            {tree.length === 0 && !addingUnder && (
              <p className="text-center py-10 text-sm text-gray-400">No territories yet — add a country to start</p>
            )}
            {renderNodes(tree)}
            {addingUnder?.type === 'country' && <AddForm depth={0} />}
          </div>
        )}
      </div>
    </div>
  );
}
