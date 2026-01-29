import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProductCard from '../components/product/ProductCard';
import ProductFilters from '../components/product/ProductFilters';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { useCart } from '../hooks/useCart';
import Loader from '../components/common/Loader';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1
  });
  
  const { addToCart } = useCart();

  // Initialize filters from URL params
  const initializeFilters = useCallback(() => {
    const filters = {};
    
    // Get all filter parameters from URL
    if (searchParams.get('search')) filters.search = searchParams.get('search');
    if (searchParams.get('category')) {
      filters.category = searchParams.get('category').split(',');
    }
    if (searchParams.get('brand')) {
      filters.brand = searchParams.get('brand').split(',');
    }
    if (searchParams.get('minPrice')) filters.minPrice = searchParams.get('minPrice');
    if (searchParams.get('maxPrice')) filters.maxPrice = searchParams.get('maxPrice');
    if (searchParams.get('sort')) filters.sort = searchParams.get('sort');
    if (searchParams.get('inStock')) filters.inStock = searchParams.get('inStock') === 'true';
    if (searchParams.get('featured')) filters.featured = searchParams.get('featured') === 'true';
    if (searchParams.get('minRating')) filters.minRating = searchParams.get('minRating');

    return filters;
  }, [searchParams]);

  const [currentFilters, setCurrentFilters] = useState(initializeFilters);

  // Fetch filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch categories from categoryService
        const categoriesResponse = await categoryService.getCategories({ isActive: true });
        
        // Transform categories for filter options
        const categories = categoriesResponse.success ? 
          categoriesResponse.data.map(cat => ({
            id: cat.slug || cat._id,
            name: cat.name,
            productCount: cat.stats?.productCount || 0
          })) : [];

        // Try to fetch other filter options from products API
        let brands = [];
        try {
          const response = await fetch('/api/products/filters');
          const data = await response.json();
          if (data.success) {
            brands = data.data.brands || [];
          }
        } catch (error) {
          console.log('Products filter endpoint not available, using categories only');
        }

        setFilterOptions({ 
          categories,
          brands 
        });
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
        // Set empty filter options as fallback
        setFilterOptions({ 
          categories: [],
          brands: []
        });
      }
    };

    fetchFilterOptions();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [currentFilters]);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: 12,
        ...currentFilters
      };

      // Convert array parameters to comma-separated strings
      if (params.category && Array.isArray(params.category)) {
        params.category = params.category.join(',');
      }
      if (params.brand && Array.isArray(params.brand)) {
        params.brand = params.brand.join(',');
      }

      const response = await productService.getProducts(params);
      
      if (response.success) {
        setProducts(response.data);
        setPagination(response.pagination);
      } else {
        throw new Error(response.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setProducts([]);
      setPagination({
        page: 1,
        limit: 12,
        total: 0,
        pages: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = useCallback((newFilters) => {
    setCurrentFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== '' && value !== false && !(Array.isArray(value) && value.length === 0)) {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, value.toString());
        }
      }
    });
    
    setSearchParams(params);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, [setSearchParams]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchProducts(newPage);
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add product to cart');
    }
  };

  const renderPagination = () => {
    if (pagination.pages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const currentPage = pagination.page;
    const totalPages = pagination.pages;

    // Calculate start and end page numbers
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          Previous
        </button>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
            i === currentPage
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          Next
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        {pages}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Products</h1>

          {/* Filters Component */}
          <ProductFilters
            onFiltersChange={handleFiltersChange}
            initialFilters={currentFilters}
            filterOptions={filterOptions}
            totalProducts={pagination.total}
          />

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader />
            </div>
          )}

          {/* Products Grid */}
          {!loading && products.length > 0 && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {renderPagination()}
            </div>
          )}

          {/* No Products Found */}
          {!loading && products.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filter criteria to find what you're looking for.
                </p>
                <button
                  onClick={() => handleFiltersChange({})}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
