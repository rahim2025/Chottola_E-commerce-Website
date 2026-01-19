import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaFilter, FaTimes, FaChevronDown, FaSlidersH } from 'react-icons/fa';
import { useDebounce } from '../../hooks/useDebounce';

const ProductFilters = ({ 
  onFiltersChange, 
  initialFilters = {}, 
  filterOptions = {},
  totalProducts = 0 
}) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [suggestions, setSuggestions] = useState({ products: [], brands: [], categories: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: initialFilters.category || [],
    brand: initialFilters.brand || [],
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    sort: initialFilters.sort || 'newest',
    inStock: initialFilters.inStock || false,
    minRating: initialFilters.minRating || '',
    featured: initialFilters.featured || false
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Handle search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
        try {
          const response = await fetch(`/api/products/search/suggestions?q=${encodeURIComponent(debouncedSearchTerm)}`);
          const data = await response.json();
          if (data.success) {
            setSuggestions(data.data);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions({ products: [], brands: [], categories: [] });
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchTerm]);

  // Update filters when search changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearchTerm }));
  }, [debouncedSearchTerm]);

  // Emit filter changes
  useEffect(() => {
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== false && !(Array.isArray(value) && value.length === 0)) {
        acc[key] = value;
      }
      return acc;
    }, {});

    onFiltersChange(cleanFilters);
  }, [filters]); // Removed onFiltersChange from dependencies to prevent infinite loops

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleCategoryChange = (categoryId) => {
    const newCategories = filters.category.includes(categoryId)
      ? filters.category.filter(id => id !== categoryId)
      : [...filters.category, categoryId];
    
    handleFilterChange('category', newCategories);
  };

  const handleBrandChange = (brandName) => {
    const newBrands = filters.brand.includes(brandName)
      ? filters.brand.filter(name => name !== brandName)
      : [...filters.brand, brandName];
    
    handleFilterChange('brand', newBrands);
  };

  const handleSuggestionClick = (type, item) => {
    if (type === 'product') {
      setSearchTerm(item.name);
    } else if (type === 'brand') {
      setSearchTerm(item);
      handleFilterChange('brand', [item]);
    } else if (type === 'category') {
      handleFilterChange('category', [item.id]);
    }
    setShowSuggestions(false);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      search: '',
      category: [],
      brand: [],
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      inStock: false,
      minRating: '',
      featured: false
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category.length > 0) count++;
    if (filters.brand.length > 0) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.inStock) count++;
    if (filters.minRating) count++;
    if (filters.featured) count++;
    return count;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search products, brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => suggestions.products.length > 0 && setShowSuggestions(true)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (suggestions.products.length > 0 || suggestions.brands.length > 0 || suggestions.categories.length > 0) && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {/* Product Suggestions */}
            {suggestions.products.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Products</h4>
                <div className="space-y-2">
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
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.brand}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Suggestions */}
            {suggestions.brands.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Brands</h4>
                <div className="space-y-1">
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
              </div>
            )}

            {/* Category Suggestions */}
            {suggestions.categories.length > 0 && (
              <div className="p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Categories</h4>
                <div className="space-y-1">
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Toggle & Results Count */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FaSlidersH className="text-sm" />
            <span>Filters</span>
            {getActiveFilterCount() > 0 && (
              <span className="bg-indigo-500 text-white text-xs rounded-full px-2 py-0.5">
                {getActiveFilterCount()}
              </span>
            )}
            <FaChevronDown className={`text-sm transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          {getActiveFilterCount() > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {totalProducts} products found
          </span>

          {/* Sort Dropdown */}
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {filterOptions.sortOptions?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expanded Filters */}
      {isFilterOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-200">
          {/* Categories */}
          {filterOptions.categories && filterOptions.categories.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filterOptions.categories.map((category) => (
                  <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.category.includes(category.id)}
                      onChange={() => handleCategoryChange(category.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      {category.name} ({category.productCount})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Brands */}
          {filterOptions.brands && filterOptions.brands.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Brands</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filterOptions.brands.map((brand) => (
                  <label key={brand.name} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.brand.includes(brand.name)}
                      onChange={() => handleBrandChange(brand.name)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      {brand.name} ({brand.productCount})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="0"
                />
              </div>
              {filterOptions.priceRange && (
                <div className="text-xs text-gray-500">
                  Range: ৳{filterOptions.priceRange.minPrice} - ৳{filterOptions.priceRange.maxPrice}
                </div>
              )}
            </div>
          </div>

          {/* Additional Filters */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Options</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">In Stock Only</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Featured Products</span>
              </label>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Min Rating</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};

export default ProductFilters;