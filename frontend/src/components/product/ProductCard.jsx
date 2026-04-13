import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaShoppingCart, FaHeart } from 'react-icons/fa';

const ProductCard = memo(({ product, onAddToCart }) => {
  const price = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const ratingAverage = Number(product.ratings?.average ?? product.averageRating ?? 0);
  const ratingCount = Number(product.ratings?.count ?? product.totalReviews ?? 0);

  return (
    <div className="bg-background-secondary rounded-xl shadow-sm border border-gray-100 group hover:shadow-md hover:border-primary-200 transition-all duration-300 overflow-hidden">
      {/* Badges */}
      <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
        {hasDiscount && (
            <span className="bg-danger-500 text-white text-[9px] font-bold px-1 py-0.5 rounded shadow-sm">
            -{Math.round((1 - product.discountPrice / product.price) * 100)}%
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button className="absolute top-1.5 right-1.5 z-10 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-text-muted hover:text-danger-500 hover:bg-white transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">
        <FaHeart className="text-xs" />
      </button>

      {/* Product Image */}
      <Link to={`/products/${product._id}`} className="block relative overflow-hidden">
        <div className="aspect-[5/4] sm:aspect-[4/3] bg-primary-50 overflow-hidden">
          <img
            src={product.images[0]?.url || '/placeholder.jpg'}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </Link>
      
      {/* Product Info */}
      <div className="p-2.5 sm:p-3">
        {/* Category */}
        <div className="hidden md:block text-[10px] text-primary-600 font-medium uppercase tracking-wide mb-0.5">
          {product.category?.name || 'Grocery'}
        </div>

        <Link to={`/products/${product._id}`}>
          <h3 className="font-semibold text-xs sm:text-sm text-text-primary hover:text-primary-600 transition-colors duration-300 mb-1 line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center mb-1.5">
          <div className="flex items-center text-yellow-400 mr-1.5">
            {[...Array(5)].map((_, i) => (
              <FaStar 
                key={i} 
                className={`text-[10px] ${i < Math.floor(ratingAverage) ? 'text-yellow-400' : 'text-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-text-muted">
            {ratingAverage > 0 ? `${ratingAverage.toFixed(1)} (${ratingCount})` : 'No rating'}
          </span>
        </div>

        {/* Weight */}
        <div className="hidden md:block text-[10px] text-text-muted mb-1.5">
          {typeof product.weight === 'object' 
            ? `${product.weight.value}${product.weight.unit}` 
            : product.weight || 'N/A'}
        </div>

        {/* Price */}
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-sm sm:text-base font-bold text-primary-600">
            ৳{price}
          </span>
          {hasDiscount && (
            <span className="text-[10px] sm:text-xs text-text-muted line-through">
              ৳{product.price}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(product)}
          className="w-full flex items-center justify-center space-x-1 py-1.5 px-2 rounded-md font-medium transition-all duration-300 bg-accent-500 hover:bg-accent-600 text-white shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
        >
          <FaShoppingCart className="text-[10px] sm:text-xs" />
          <span className="text-[10px] sm:text-xs">Add</span>
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render), false otherwise
  return prevProps.product._id === nextProps.product._id &&
         prevProps.product.price === nextProps.product.price &&
         prevProps.product.discountPrice === nextProps.product.discountPrice;
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
