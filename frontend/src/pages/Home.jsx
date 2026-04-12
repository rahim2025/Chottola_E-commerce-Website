import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProductCard from '../components/product/ProductCard';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { useCart } from '../hooks/useCart';
import Loader from '../components/common/Loader';
import { FaTruck, FaPercent, FaShieldAlt, FaClock } from 'react-icons/fa';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [regularProducts, setRegularProducts] = useState([]);
  const [specialOffers, setSpecialOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const { addToCart } = useCart();


  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const [featuredResponse, regularResponse, specialOffersResponse] = await Promise.all([
        productService.getFeaturedProducts(),
        productService.getProducts({ limit: 12, featured: false }),
        // Fetch products with discounts for special offers
        productService.getProducts({ limit: 8, hasDiscount: true })
      ]);
      
      setFeaturedProducts(featuredResponse.data);
      setRegularProducts(regularResponse.data);
      setSpecialOffers(specialOffersResponse.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoryService.getMainCategories();
      if (response.success) {
        // Filter to show only first 6 categories for the homepage
        setCategories(response.data.slice(0, 6));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to default categories if API fails
      setCategories([
        { 
          _id: '1', 
          name: 'Fresh Produce', 
          slug: 'fresh-produce', 
          icon: '🥬', 
          color: '#22c55e',
          image: { url: '' }
        },
        { 
          _id: '2', 
          name: 'Dairy & Eggs', 
          slug: 'dairy-eggs', 
          icon: '🥛', 
          color: '#f59e0b',
          image: { url: '' }
        },
        { 
          _id: '3', 
          name: 'Bakery', 
          slug: 'bakery', 
          icon: '🍞', 
          color: '#22c55e',
          image: { url: '' }
        },
        { 
          _id: '4', 
          name: 'Meat & Seafood', 
          slug: 'meat-seafood', 
          icon: '🥩', 
          color: '#f59e0b',
          image: { url: '' }
        },
        { 
          _id: '5', 
          name: 'Snacks & Beverages', 
          slug: 'snacks-beverages', 
          icon: '🥤', 
          color: '#22c55e',
          image: { url: '' }
        },
        { 
          _id: '6', 
          name: 'Personal Care', 
          slug: 'personal-care', 
          icon: '🧴', 
          color: '#f59e0b',
          image: { url: '' }
        }
      ]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-background-primary">

      {/* Categories Section */}
      <section className="py-12 bg-background-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold font-heading text-text-primary mb-2">
              Shop by Category
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              Browse our wide selection of fresh groceries and daily essentials
            </p>
          </div>
          
          {categoriesLoading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-background-secondary rounded-xl p-3 text-center shadow-sm border border-gray-100 animate-pulse">
                  <div className="w-10 h-10 mx-auto mb-2 bg-gray-200 rounded-lg"></div>
                  <div className="h-3 bg-gray-200 rounded mx-auto w-16"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.map((category, index) => {
                // Helper function to get color class
                const getColorClass = (color, index) => {
                  if (color && color.startsWith('#')) {
                    return index % 2 === 0 ? 'primary' : 'accent';
                  }
                  return index % 2 === 0 ? 'primary' : 'accent';
                };

                const colorClass = getColorClass(category.color, index);

                return (
                  <Link
                    key={category._id}
                    to={`/products?category=${category.slug || category._id}`}
                    className="group bg-background-secondary rounded-xl p-3 text-center shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all duration-300"
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 bg-${colorClass}-100 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
                      {category.image?.url ? (
                        <img
                          src={category.image.url}
                          alt={category.image.alt || category.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span
                        className={`${category.image?.url ? 'hidden' : 'block'}`}
                        style={{ display: category.image?.url ? 'none' : 'block' }}
                      >
                        {category.icon || '📦'}
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-text-primary group-hover:text-primary-600 transition-colors leading-tight">
                      {category.name}
                    </h3>
                    {category.stats?.productCount > 0 && (
                      <p className="text-xs text-text-muted mt-0.5">
                        {category.stats.productCount} items
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
          
          {!categoriesLoading && categories.length > 0 && (
            <div className="text-center mt-8">
              <Link 
                to="/products" 
                className="btn-secondary inline-flex items-center space-x-2"
              >
                <span>View All Categories</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-background-primary">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold font-heading text-text-primary mb-2">
                🌟 Featured Products
              </h2>
              <p className="text-text-muted">Handpicked favorites from our fresh selection</p>
            </div>
            <Link to="/products?featured=true" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              View All →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
            {featuredProducts.map(product => (
              <div key={product._id} className="relative group">
                <ProductCard 
                  product={product} 
                  onAddToCart={handleAddToCart}
                />
                {product.discountPrice && (
                  <div className="absolute top-3 left-3 bg-danger-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg">
                    {Math.round((1 - product.discountPrice / product.price) * 100)}% OFF
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Products */}
      <section className="py-12 bg-background-secondary">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold font-heading text-text-primary mb-2">
                🔥 Popular This Week
              </h2>
              <p className="text-text-muted">Customer favorites and best sellers</p>
            </div>
            <Link to="/products" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
              View All →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
            {regularProducts.slice(0, 6).map(product => (
              <ProductCard 
                key={product._id}
                product={product} 
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers */}
      <section className="py-12 bg-gradient-to-r from-accent-500 to-accent-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold font-heading mb-4">
              💰 Weekly Special Offers
            </h2>
            <p className="text-xl text-accent-100">
              Save big on your grocery shopping - Limited time deals!
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(specialOffers.length > 0 ? specialOffers : regularProducts.slice(2, 8)).map((product) => (
              <div key={product._id} className="bg-background-secondary rounded-xl p-4 text-center relative shadow-lg">
                <div className="absolute -top-3 -right-3 bg-danger-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  DEAL
                </div>
                <img 
                  src={product.images[0]?.url} 
                  alt={product.name}
                  className="w-full h-20 object-cover rounded-lg mb-3"
                />
                <h3 className="text-sm font-semibold text-text-primary mb-2 line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-primary-600">
                      ৳{product.discountPrice || product.price}
                    </div>
                    {product.discountPrice && (
                      <div className="text-xs text-text-muted line-through">
                        ৳{product.price}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                  >
                    ADD
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
    </div>
  );
};

export default Home;
