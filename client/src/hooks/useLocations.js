import { useEffect, useMemo, useState } from 'react';
import { locationApi } from '../services';
import { INDIA_STATES } from '../utils/constants';

let cache = null;
let pending = null;

async function loadLocations() {
  if (cache) return cache;
  if (!pending) {
    pending = locationApi
      .getAll()
      .then((response) => {
        cache = response.data;
        return cache;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function useLocations() {
  const [data, setData] = useState(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (cache) {
      setData(cache);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    loadLocations()
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setError('Unable to load the India location list.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const locations = data?.locations || [];
  const states = data?.states?.length ? data.states : INDIA_STATES;

  const stateOptions = useMemo(() => states, [states]);

  function districtsFor(stateName) {
    const state = locations.find((item) => item.name === stateName);
    return state ? state.districts.map((district) => district.name) : [];
  }

  function citiesFor(stateName, districtName) {
    const state = locations.find((item) => item.name === stateName);
    if (!state) return [];
    if (!districtName) return state.districts.flatMap((district) => district.cities);
    const district = state.districts.find((item) => item.name === districtName);
    return district ? district.cities : [];
  }

  return { locations, states: stateOptions, loading, error, districtsFor, citiesFor };
}

export default useLocations;
