import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTerritories } from '../api/territories';

const SELECT_CLS = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

export default function TerritorySelector({ value, onChange, required = false }) {
  const [countryId, setCountryId] = useState('');
  const [stateId, setStateId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [cityId, setCityId] = useState('');

  const { data: countries = [] } = useQuery({
    queryKey: ['territories', 'country'],
    queryFn: () => getTerritories({ type: 'country' }),
  });

  const { data: states = [] } = useQuery({
    queryKey: ['territories', 'state', countryId],
    queryFn: () => getTerritories({ parent_id: countryId }),
    enabled: !!countryId,
  });

  const { data: zones = [] } = useQuery({
    queryKey: ['territories', 'zone', stateId],
    queryFn: () => getTerritories({ parent_id: stateId }),
    enabled: !!stateId,
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['territories', 'city', zoneId],
    queryFn: () => getTerritories({ parent_id: zoneId }),
    enabled: !!zoneId,
  });

  function handleCountry(e) {
    const id = e.target.value;
    setCountryId(id);
    setStateId('');
    setZoneId('');
    setCityId('');
    onChange(id ? parseInt(id) : '');
  }

  function handleState(e) {
    const id = e.target.value;
    setStateId(id);
    setZoneId('');
    setCityId('');
    onChange(id ? parseInt(id) : (countryId ? parseInt(countryId) : ''));
  }

  function handleZone(e) {
    const id = e.target.value;
    setZoneId(id);
    setCityId('');
    onChange(id ? parseInt(id) : (stateId ? parseInt(stateId) : ''));
  }

  function handleCity(e) {
    const id = e.target.value;
    setCityId(id);
    onChange(id ? parseInt(id) : (zoneId ? parseInt(zoneId) : ''));
  }

  return (
    <div className="space-y-2">
      <select value={countryId} onChange={handleCountry} required={required && !value} className={SELECT_CLS}>
        <option value="">Select Country…</option>
        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {countryId && (
        <select value={stateId} onChange={handleState} className={SELECT_CLS}>
          <option value="">{states.length ? 'Select State…' : '(no states)'}</option>
          {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}

      {stateId && (
        <select value={zoneId} onChange={handleZone} className={SELECT_CLS}>
          <option value="">{zones.length ? 'Select Zone…' : '(no zones)'}</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
      )}

      {zoneId && (
        <select value={cityId} onChange={handleCity} className={SELECT_CLS}>
          <option value="">{cities.length ? 'Select City…' : '(no cities)'}</option>
          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
    </div>
  );
}
