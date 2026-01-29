import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProductCard from '../components/product/ProductCard';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import Loader from '../components/common/Loader';
import { FaShoppingCart, FaLeaf, FaTruck, FaPercent, FaShieldAlt, FaClock } from 'react-icons/fa';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [regularProducts, setRegularProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const { addToCart } = useCart();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const [featuredResponse, regularResponse] = await Promise.all([
        productService.getFeaturedProducts(),
        productService.getProducts({ limit: 12, featured: false })
      ]);
      
      setFeaturedProducts(featuredResponse.data);
      setRegularProducts(regularResponse.data);
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
      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-r from-primary-500 to-primary-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Hero Content */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <FaLeaf className="text-3xl text-primary-100" />
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="text-sm font-medium">Fresh & Organic</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold font-heading leading-tight">
                  Fresh Groceries
                  <span className="block text-accent-400">Delivered Daily</span>
                </h1>
                <p className="text-xl text-primary-100 leading-relaxed max-w-lg">
                  Get farm-fresh produce, premium quality goods, and daily essentials delivered to your doorstep.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/products" 
                  className="inline-flex items-center justify-center bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
                >
                  <FaShoppingCart className="mr-2" />
                  Shop Now
                </Link>
                {isAdmin ? (
                  <Link
                    to="/admin/dashboard"
                    className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Admin Dashboard
                  </Link>
                ) : (
                  <button className="px-8 py-4 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-all">
                    Browse Categories
                  </button>
                )}
              </div>
            </div>

            {/* Right Side - Product Images */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {featuredProducts.slice(0, 4).map((product, index) => (
                  <div key={product._id} className="relative group">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300">
                      <img 
                        src={product.images[0]?.url} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-xl mb-3"
                      />
                      <h3 className="font-semibold text-text-primary text-sm mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="text-xl font-bold text-primary-600">
                        ৳{product.discountPrice || product.price}
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 bg-danger-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        Fresh!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Features */}
      <section className="py-8 bg-background-secondary border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center space-y-3 p-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <FaTruck className="text-primary-600 text-xl" />
              </div>
              <span className="font-semibold text-text-primary text-sm">Free Delivery</span>
              <span className="text-xs text-text-muted">On orders over ৳500</span>
            </div>
            <div className="flex flex-col items-center space-y-3 p-4">
              <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                <FaLeaf className="text-accent-600 text-xl" />
              </div>
              <span className="font-semibold text-text-primary text-sm">Fresh & Organic</span>
              <span className="text-xs text-text-muted">Farm to table quality</span>
            </div>
            <div className="flex flex-col items-center space-y-3 p-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <FaClock className="text-primary-600 text-xl" />
              </div>
              <span className="font-semibold text-text-primary text-sm">Quick Delivery</span>
              <span className="text-xs text-text-muted">30 min to 2 hours</span>
            </div>
            <div className="flex flex-col items-center space-y-3 p-4">
              <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                <FaShieldAlt className="text-accent-600 text-xl" />
              </div>
              <span className="font-semibold text-text-primary text-sm">Quality Guarantee</span>
              <span className="text-xs text-text-muted">100% satisfaction</span>
            </div>
          </div>
        </div>
      </section>

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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-background-secondary rounded-2xl p-6 text-center shadow-sm border border-gray-100 animate-pulse">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-xl"></div>
                  <div className="h-4 bg-gray-200 rounded mx-auto w-24"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
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
                    className="group bg-background-secondary rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary-200 transition-all duration-300"
                  >
                    <div className={`w-16 h-16 mx-auto mb-4 bg-${colorClass}-100 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
                      {category.image?.url ? (
                        <img 
                          src={category.image.url} 
                          alt={category.image.alt || category.name}
                          className="w-full h-full object-cover rounded-xl"
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
                    <h3 className="font-semibold text-text-primary group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h3>
                    {category.stats?.productCount > 0 && (
                      <p className="text-sm text-text-muted mt-1">
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
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
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
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
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
            {regularProducts.slice(2, 8).map((product) => (
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

      {/* Newsletter */}
      <section className="py-12 bg-primary-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold font-heading text-text-primary mb-4">
              📧 Stay Fresh with Our Newsletter
            </h2>
            <p className="text-text-muted text-lg mb-8">
              Get exclusive deals, fresh product updates, and healthy recipes delivered to your inbox
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-6 py-4 rounded-xl border border-gray-200 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-xl font-bold transition-colors">
                Subscribe
              </button>
            </div>
            
            <p className="text-xs text-text-muted mt-4">
              No spam, unsubscribe anytime. We respect your privacy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
