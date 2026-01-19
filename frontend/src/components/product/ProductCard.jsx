import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaHeart } from 'react-icons/fa';

const ProductCard = ({ product, onAddToCart }) => {
  const price = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <div className="bg-background-secondary rounded-2xl shadow-sm border border-gray-100 group hover:shadow-lg hover:border-primary-200 transition-all duration-300 overflow-hidden">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {hasDiscount && (
          <span className="bg-danger-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
            -{Math.round((1 - product.discountPrice / product.price) * 100)}%
          </span>
        )}
        {product.stock < 10 && product.stock > 0 && (
          <span className="bg-accent-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
            Low Stock
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-text-muted hover:text-danger-500 hover:bg-white transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">
        <FaHeart className="text-xs" />
      </button>

      {/* Product Image */}
      <Link to={`/products/${product._id}`} className="block relative overflow-hidden">
        <div className="aspect-square bg-primary-50 overflow-hidden">
          <img
            src={product.images[0]?.url || '/placeholder.jpg'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </Link>
      
      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        <div className="text-xs text-primary-600 font-medium uppercase tracking-wide mb-1">
          {product.category?.name || 'Grocery'}
        </div>

        <Link to={`/products/${product._id}`}>
          <h3 className="font-semibold text-text-primary hover:text-primary-600 transition-colors duration-300 mb-2 line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex items-center text-yellow-400 mr-2">
            {[...Array(5)].map((_, i) => (
              <FaStar 
                key={i} 
                className={`text-xs ${i < Math.floor(product.ratings?.average || 0) ? 'text-yellow-400' : 'text-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-xs text-text-muted">
            {product.ratings?.average?.toFixed(1) || '0.0'} ({product.ratings?.count || 0})
          </span>
        </div>

        {/* Weight */}
        <div className="text-xs text-text-muted mb-3">
          {typeof product.weight === 'object' 
            ? `${product.weight.value}${product.weight.unit}` 
            : product.weight || 'N/A'}
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-primary-600">
            ৳{price}
          </span>
          {hasDiscount && (
            <span className="text-sm text-text-muted line-through">
              ৳{product.price}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="mb-3">
          <span className={`text-xs font-medium ${
            product.stock > 10 
              ? 'text-primary-600' 
              : product.stock > 0 
                ? 'text-accent-600' 
                : 'text-danger-600'
          }`}>
            {product.stock > 10 
              ? 'In Stock' 
              : product.stock > 0 
                ? `Only ${product.stock} left` 
                : 'Out of Stock'}
          </span>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
          className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-medium transition-all duration-300 ${
            product.stock === 0
              ? 'bg-gray-100 text-text-muted cursor-not-allowed'
              : 'bg-accent-500 hover:bg-accent-600 text-white shadow-sm hover:shadow-md transform hover:-translate-y-0.5'
          }`}
        >
          <FaShoppingCart className="text-sm" />
          <span className="text-sm">{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
