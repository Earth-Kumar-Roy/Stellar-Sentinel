import React, { useState, useId } from 'react';
import { Search, X, ShieldCheck } from 'lucide-react';

interface OrgSearchBarProps {
  onSearchChange: (query: string) => void;
  verifiedOnly: boolean;
  onToggleVerified: (val: boolean) => void;
}

export const OrgSearchBar: React.FC<OrgSearchBarProps> = ({
  onSearchChange,
  verifiedOnly,
  onToggleVerified,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputId = useId();

  const handleInput = (val: string) => {
    setSearchTerm(val);
    onSearchChange(val);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearchChange('');
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 font-mono text-xs">
      <div className="relative flex-1">
        <label htmlFor={searchInputId} className="sr-only">
          Search Registered Entities
        </label>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stellar-muted">
          <Search className="w-4 h-4" />
        </div>
        <input
          id={searchInputId}
          type="text"
          value={searchTerm}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Search by legal entity name, GSTIN, or Stellar address (G...)"
          className="w-full pl-9 pr-8 py-2.5 bg-[#0B0D13] border border-[#232938] text-white focus:border-stellar-yellow outline-none card-polygon transition-colors"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-stellar-muted hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onToggleVerified(!verifiedOnly)}
        className={`px-4 py-2.5 flex items-center justify-center gap-2 btn-polygon border transition-all ${
          verifiedOnly
            ? 'bg-stellar-yellow text-black border-stellar-yellow font-bold'
            : 'bg-[#121620] text-stellar-muted border-[#232938] hover:text-white hover:border-stellar-muted'
        }`}
      >
        <ShieldCheck className="w-4 h-4" />
        <span>GST VERIFIED ONLY</span>
      </button>
    </div>
  );
};