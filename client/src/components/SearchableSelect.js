import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X, Loader } from 'lucide-react';

const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  loading = false,
  disabled = false,
  error = null,
  required = false,
  onSearch = null,
  allowClear = true,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  useEffect(() => {
    if (onSearch && searchTerm.length >= 2) {
      const debounceTimer = setTimeout(() => {
        onSearch(searchTerm);
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else if (!onSearch) {
      // Local filtering
      const filtered = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options, onSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.id === value);

  const handleSelect = (option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`input flex items-center justify-between cursor-pointer ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'
        } ${error ? 'border-red-500' : ''} ${isOpen ? 'border-primary-500' : ''}`}
        onClick={handleToggle}
      >
        <span className={`flex-1 truncate ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedOption ? selectedOption.name : placeholder}
          {required && !selectedOption && <span className="text-red-500 ml-1">*</span>}
        </span>
        
        <div className="flex items-center space-x-1">
          {loading && <Loader className="h-4 w-4 text-gray-400 animate-spin" />}
          {allowClear && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="h-5 w-5 text-gray-400 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Loading...</span>
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                    option.id === value ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  {option.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                {searchTerm ? 'No results found' : 'No options available'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;