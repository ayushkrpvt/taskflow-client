import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTerritories } from '../api/territories';

const SELECT_CLS = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

export default function TerritorySelector({ value, onChange, required = false }) {
  const [countryId, setCountryId] = useState('');
  const [stateId, setStateId] = useState('');
  const [zoneId, setZoneId] = useState('');

  const { data: countries = [] } = useQuery({
    queryKey: ['territories', 'country'],
    queryFn: () => getTerritories({ type: 'country' }),
  });

  const { data: stateList = [] } = useQuery({
    queryKey: ['territories', 'children', countryId],
    queryFn: () => getTerritories({ parent_id: countryId }),
    enabled: !!countryId,
  });

  // Children of selected state — could be zones OR cities
  const { data: stateChildren = [] } = useQuery({
    queryKey: ['territories', 'children', stateId],
    queryFn: () => getTerritories({ parent_id: stateId }),
    enabled: !!stateId,
  });

  // Children of selected zone — always cities
  const { data: zoneChildren = [] } = useQuery({
    queryKey: ['territories', 'children', zoneId],
    queryFn: () => getTerritories({ parent_id: zoneId }),
    enabled: !!zoneId,
  });

  const stateChildType = stateChildren[0]?.type;
  const zones = stateChildType === 'zone' ? stateChildren : [];
  const citiesUnderState = stateChildType === 'city' ? stateChildren : [];
  const citiesUnderZone = zoneChildren;

  function handleCountry(e) {
    const id = e.target.value;
    setCountryId(id);
    setStateId('');
    setZoneId('');
    onChange(id ? parseInt(id) : '');
  }

  function handleState(e) {
    const id = e.target.value;
    setStateId(id);
    setZoneId('');
    onChange(id ? parseInt(id) : (countryId ? parseInt(countryId) : ''));
  }

  function handleZone(e) {
    const id = e.target.value;
    setZoneId(id);
    onChange(id ? parseInt(id) : (stateId ? parseInt(stateId) : ''));
  }

  function handleCity(e) {
    const id = e.target.value;
    const fallback = zoneId ? parseInt(zoneId) : stateId ? parseInt(stateId) : '';
    onChange(id ? parseInt(id) : fallback);
  }

  return (
    <div className="space-y-2">
      <select value={countryId} onChange={handleCountry} required={required && !value} className={SELECT_CLS}>
        <option value="">Select Country…</option>
        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {countryId && stateList.length > 0 && (
        <select value={stateId} onChange={handleState} className={SELECT_CLS}>
          <option value="">Select State / UT…</option>
          {stateList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}

      {/* Zones under state */}
      {stateId && zones.length > 0 && (
        <select value={zoneId} onChange={handleZone} className={SELECT_CLS}>
          <option value="">Select Zone…</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
      )}

      {/* Cities directly under state (no zones) */}
      {stateId && citiesUnderState.length > 0 && (
        <select onChange={handleCity} className={SELECT_CLS}>
          <option value="">Select City…</option>
          {citiesUnderState.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      {/* Cities under zone */}
      {zoneId && citiesUnderZone.length > 0 && (
        <select onChange={handleCity} className={SELECT_CLS}>
          <option value="">Select City…</option>
          {citiesUnderZone.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
    </div>
  );
}
