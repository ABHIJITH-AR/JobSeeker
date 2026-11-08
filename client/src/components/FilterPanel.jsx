import { SlidersHorizontal, X } from 'lucide-react';
import { Input, Select } from './FormField';
import LocationSelect from './LocationSelect';
import {
  EXPERIENCE_LEVELS,
  GOVERNMENT_CATEGORIES,
  JOB_TYPES,
  PRIVATE_CATEGORIES,
  QUALIFICATIONS,
  WORK_MODES,
} from '../utils/constants';

export default function FilterPanel({ filters, onChange, onApply, onClear, sector = 'all' }) {
  const patch = (values) => onChange(values);

  const categories = sector === 'private' ? PRIVATE_CATEGORIES : sector === 'government' ? GOVERNMENT_CATEGORIES : null;

  return (
    <form
      className="card p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink">
          <SlidersHorizontal className="h-4 w-4 text-brand" />
          Filters
        </h2>
        <button type="button" onClick={onClear} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brandDark">
          <X className="h-3.5 w-3.5" />
          Clear all
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <Input
          label="Keyword"
          placeholder="Job title, skill or company"
          value={filters.q || ''}
          onChange={(event) => patch({ q: event.target.value })}
        />

        {sector === 'all' && (
          <Select
            label="Sector"
            value={filters.sector || ''}
            onChange={(event) => patch({ sector: event.target.value, category: '' })}
          >
            <option value="">All sectors</option>
            <option value="private">Private Jobs</option>
            <option value="government">Government Jobs</option>
          </Select>
        )}

        <Select label="Category" value={filters.category || ''} onChange={(event) => patch({ category: event.target.value })}>
          <option value="">All categories</option>
          {categories
            ? categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))
            : (
              <>
                <optgroup label="Private Jobs">
                  {PRIVATE_CATEGORIES.map((item) => (
                    <option key={`p-${item}`} value={item}>
                      {item}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Government Jobs">
                  {GOVERNMENT_CATEGORIES.map((item) => (
                    <option key={`g-${item}`} value={item}>
                      {item}
                    </option>
                  ))}
                </optgroup>
              </>
            )}
        </Select>

        <div>
          <p className="label">Location</p>
          <LocationSelect
            state={filters.state || ''}
            district={filters.district || ''}
            city={filters.city || ''}
            allowAll
            layout="stack"
            onChange={(values) => patch(values)}
          />
        </div>

        <Select
          label="Qualification"
          value={filters.qualification || ''}
          onChange={(event) => patch({ qualification: event.target.value })}
        >
          <option value="">Any qualification</option>
          {QUALIFICATIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>

        <Select label="Experience" value={filters.experience || ''} onChange={(event) => patch({ experience: event.target.value })}>
          <option value="">Any experience</option>
          {EXPERIENCE_LEVELS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Job Type" value={filters.jobType || ''} onChange={(event) => patch({ jobType: event.target.value })}>
            <option value="">Any type</option>
            {JOB_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select label="Work Mode" value={filters.workMode || ''} onChange={(event) => patch({ workMode: event.target.value })}>
            <option value="">Any mode</option>
            {WORK_MODES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Minimum salary (₹ / month)"
          type="number"
          min="0"
          step="1000"
          placeholder="e.g. 30000"
          value={filters.minSalary || ''}
          onChange={(event) => patch({ minSalary: event.target.value })}
        />

        <Select
          label="Application deadline"
          value={filters.deadlineWithinDays || ''}
          onChange={(event) => patch({ deadlineWithinDays: event.target.value })}
        >
          <option value="">Any deadline</option>
          <option value="7">Within 7 days</option>
          <option value="15">Within 15 days</option>
          <option value="30">Within 30 days</option>
          <option value="60">Within 60 days</option>
        </Select>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-skysoft/40 px-3 py-2.5">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
            checked={Boolean(filters.remote)}
            onChange={(event) => patch({ remote: event.target.checked })}
          />
          <span className="text-sm font-medium text-ink">Remote / Work from home only</span>
        </label>

        <button type="submit" className="btn-primary w-full">
          Apply Filters
        </button>
      </div>
    </form>
  );
}
