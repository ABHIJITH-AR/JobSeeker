import useLocations from '../hooks/useLocations';

export default function LocationSelect({
  state = '',
  district = '',
  city = '',
  onChange,
  allowAll = false,
  required = false,
  disabled = false,
  errors = {},
  showDistrict = true,
  showCity = true,
  layout = 'grid',
}) {
  const { states, districtsFor, citiesFor, loading } = useLocations();

  const stateValue = state || (allowAll ? 'All India' : '');
  const districts = stateValue && stateValue !== 'All India' ? districtsFor(stateValue) : [];
  const cities = stateValue && stateValue !== 'All India' ? citiesFor(stateValue, district) : [];

  const handleState = (event) => {
    const value = event.target.value;
    onChange({ state: value === 'All India' ? '' : value, district: '', city: '' });
  };

  const handleDistrict = (event) => {
    onChange({ state, district: event.target.value, city: '' });
  };

  const handleCity = (event) => {
    onChange({ state, district, city: event.target.value });
  };

  const gridClass = layout === 'stack' ? 'space-y-4' : 'grid gap-4 sm:grid-cols-3';

  return (
    <div className={gridClass}>
      <div>
        <label className="label" htmlFor="location-state">
          State / UT {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id="location-state"
          className={`input ${errors.state ? 'input-error' : ''}`}
          value={stateValue}
          onChange={handleState}
          disabled={disabled || loading}
        >
          <option value={allowAll ? 'All India' : ''}>{allowAll ? 'All India' : 'Select State / UT'}</option>
          {states.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {errors.state && <p className="error-text">{errors.state}</p>}
      </div>

      {showDistrict && (
        <div>
          <label className="label" htmlFor="location-district">
            District {required && <span className="text-red-500">*</span>}
          </label>
          <select
            id="location-district"
            className={`input ${errors.district ? 'input-error' : ''}`}
            value={district}
            onChange={handleDistrict}
            disabled={disabled || loading || !stateValue || stateValue === 'All India'}
          >
            <option value="">{allowAll ? 'All Districts' : 'Select District'}</option>
            {districts.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {errors.district && <p className="error-text">{errors.district}</p>}
        </div>
      )}

      {showCity && (
        <div>
          <label className="label" htmlFor="location-city">
            City {required && <span className="text-red-500">*</span>}
          </label>
          <select
            id="location-city"
            className={`input ${errors.city ? 'input-error' : ''}`}
            value={city}
            onChange={handleCity}
            disabled={disabled || loading || !stateValue || stateValue === 'All India'}
          >
            <option value="">{allowAll ? 'All Cities' : 'Select City'}</option>
            {cities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {errors.city && <p className="error-text">{errors.city}</p>}
        </div>
      )}
    </div>
  );
}
