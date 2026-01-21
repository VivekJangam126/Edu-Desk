import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X, Loader } from 'lucide-react';

const MultiSelect = ({
  options = [],
  value = [],
  onChange,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  loading = false,
  disabled = false,
  error = null,
  required = false,
  onSearch = null,
  maxDisplay = 3,
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

  const selectedOptions = options.filter(option => value.includes(option.id));

  const handleSelect = (option) => {
    const newValue = value.includes(option.id)
      ? value.filter(id => id !== option.id)
      : [...value, option.id];
    onChange(newValue);
  };

  const handleRemove = (optionId, e) => {
    e.stopPropagation();
    const newValue = value.filter(id => id !== optionId);
    onChange(newValue);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange([]);
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

  const displayText = () => {
    if (selectedOptions.length === 0) {
      return (
        <span className="text-gray-500">
          {placeholder}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      );
    }

    if (selectedOptions.length <= maxDisplay) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map(option => (
            <span
              key={option.id}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
            >
              {option.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemove(option.id, e)}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <div className="flex flex-wrap gap-1 mr-2">
          {selectedOptions.slice(0, maxDisplay).map(option => (
            <span
              key={option.id}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
            >
              {option.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemove(option.id, e)}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
        <span className="text-sm text-gray-500">
          +{selectedOptions.length - maxDisplay} more
        </span>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`input min-h-[42px] flex items-center justify-between cursor-pointer ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'
        } ${error ? 'border-red-500' : ''} ${isOpen ? 'border-primary-500' : ''}`}
        onClick={handleToggle}
      >
        <div className="flex-1 min-w-0">
          {displayText()}
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          {loading && <Loader className="h-4 w-4 text-gray-400 animate-spin" />}
          {selectedOptions.length > 0 && !disabled && (
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
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center justify-between ${
                    value.includes(option.id) ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  <span>{option.name}</span>
                  {value.includes(option.id) && (
                    <div className="w-4 h-4 bg-primary-600 rounded-sm flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
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

export default MultiSelect;