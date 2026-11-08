import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, MapPin, Search } from 'lucide-react';
import useLocations from '../hooks/useLocations';
import { GOVERNMENT_CATEGORIES, PRIVATE_CATEGORIES } from '../utils/constants';

const categories = [...new Set([...PRIVATE_CATEGORIES, ...GOVERNMENT_CATEGORIES])];

export default function SearchBar({ className = '' }) {
  const [keyword, setKeyword] = useState('');
  const [state, setState] = useState('');
  const [category, setCategory] = useState('');
  const { states } = useLocations();
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (state) params.set('state', state);
    if (category) params.set('category', category);
    navigate(`/jobs${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border border-white/40 bg-white p-3 shadow-cardHover sm:p-4 ${className}`}
      aria-label="Job search"
    >
      <div className="grid gap-2.5 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <label htmlFor="search-keyword" className="sr-only">
            Job title or keyword
          </label>
          <input
            id="search-keyword"
            className="input h-12 pl-10"
            placeholder="Job title, keyword or skill"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>

        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <label htmlFor="search-state" className="sr-only">
            Location
          </label>
          <select id="search-state" className="input h-12 pl-10" value={state} onChange={(event) => setState(event.target.value)}>
            <option value="">All India</option>
            {states.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <LayoutGrid className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <label htmlFor="search-category" className="sr-only">
            Category
          </label>
          <select
            id="search-category"
            className="input h-12 pl-10"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-primary h-12 px-6">
          <Search className="h-4 w-4" />
          Search Jobs
        </button>
      </div>
    </form>
  );
}
