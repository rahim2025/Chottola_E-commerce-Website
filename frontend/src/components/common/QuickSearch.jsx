import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useDebounce } from '../../hooks/useDebounce';
import { productService } from '../../services/productService';

const QuickSearch = ({ className = "" }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], brands: [], categories: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery && debouncedQuery.length >= 2) {
        setIsLoading(true);
        try {
          const response = await productService.getSearchSuggestions(debouncedQuery);
          if (response.success) {
            setSuggestions(response.data);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions({ products: [], brands: [], categories: [] });
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchTerm = query) => {
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setQuery('');
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setQuery('');
    }
  };

  const handleSuggestionClick = (type, item) => {
    if (type === 'product') {
      navigate(`/products/${item.id}`);
    } else if (type === 'brand') {
      navigate(`/products?brand=${encodeURIComponent(item)}`);
    } else if (type === 'category') {
      navigate(`/products?category=${item.id}`);
    }
    setQuery('');
    setShowSuggestions(false);
  };

  const hasSuggestions = suggestions.products.length > 0 || 
                        suggestions.brands.length > 0 || 
                        suggestions.categories.length > 0;

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => hasSuggestions && setShowSuggestions(true)}
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setShowSuggestions(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="text-xs" />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full"></div>
              <span className="ml-2">Searching...</span>
            </div>
          ) : hasSuggestions ? (
            <div>
              {/* Products */}
              {suggestions.products.length > 0 && (
                <div className="p-3 border-b border-gray-100">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Products</h4>
                  {suggestions.products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSuggestionClick('product', product)}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        {product.brand && (
                          <p className="text-xs text-gray-500">{product.brand}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Brands */}
              {suggestions.brands.length > 0 && (
                <div className="p-3 border-b border-gray-100">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Brands</h4>
                  {suggestions.brands.map((brand) => (
                    <div
                      key={brand}
                      onClick={() => handleSuggestionClick('brand', brand)}
                      className="p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <p className="text-sm text-gray-900">{brand}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Categories */}
              {suggestions.categories.length > 0 && (
                <div className="p-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Categories</h4>
                  {suggestions.categories.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => handleSuggestionClick('category', category)}
                      className="p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <p className="text-sm text-gray-900">{category.name}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Search All Results */}
              {query.trim() && (
                <div className="p-3 border-t border-gray-100">
                  <button
                    onClick={() => handleSearch()}
                    className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Search for "{query}" in all products
                  </button>
                </div>
              )}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No suggestions found</p>
              {query.trim() && (
                <button
                  onClick={() => handleSearch()}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Search for "{query}" anyway
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default QuickSearch;