const SITE_URL = 'https://www.chattala.store';
const SITE_NAME = 'The Chattala';
const DEFAULT_IMAGE = `${SITE_URL}/assets/images/chottola_logo.png`;

const upsertMeta = (selector, attrs) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }
  Object.entries(attrs).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
};

const upsertLink = (selector, attrs) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('link');
    document.head.appendChild(tag);
  }
  Object.entries(attrs).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
};

// Add JSON-LD structured data
const addJsonLd = (structuredData) => {
  let script = document.head.querySelector('script[type="application/ld+json"]');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(structuredData);
};

export const applySeo = ({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  keywords = '',
  author = SITE_NAME,
  published_date = '',
  modified_date = '',
  product = null,
  breadcrumbs = []
}) => {
  const canonicalUrl = `${SITE_URL}${path}`;
  document.title = title;

  // Basic Meta Tags
  upsertMeta('meta[name="description"]', { name: 'description', content: description });
  upsertMeta('meta[name="keywords"]', { name: 'keywords', content: keywords });
  upsertMeta('meta[name="author"]', { name: 'author', content: author });

  // Mobile & Display
  upsertMeta('meta[name="viewport"]', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' });
  upsertMeta('meta[name="theme-color"]', { name: 'theme-color', content: '#22c55e' });
  upsertMeta('meta[name="apple-mobile-web-app-capable"]', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  upsertMeta('meta[name="apple-mobile-web-app-status-bar-style"]', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' });

  // Robots & Crawlers
  upsertMeta('meta[name="robots"]', { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' });
  upsertMeta('meta[name="googlebot"]', { name: 'googlebot', content: 'index, follow' });

  // Open Graph (Social)
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });
  upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width', content: '1200' });
  upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height', content: '630' });
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
  upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'en_US' });

  // Twitter
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });
  upsertMeta('meta[name="twitter:creator"]', { name: 'twitter:creator', content: '@chattalastore' });
  upsertMeta('meta[name="twitter:site"]', { name: 'twitter:site', content: '@chattalastore' });

  // Generic tags for better SEO
  upsertMeta('meta[name="application-name"]', { name: 'application-name', content: SITE_NAME });
  upsertMeta('meta[name="apple-mobile-web-app-title"]', { name: 'apple-mobile-web-app-title', content: SITE_NAME });

  // Publication dates for news/blog articles
  if (published_date) {
    upsertMeta('meta[property="article:published_time"]', { property: 'article:published_time', content: published_date });
  }
  if (modified_date) {
    upsertMeta('meta[property="article:modified_time"]', { property: 'article:modified_time', content: modified_date });
  }

  // Canonical URL
  upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });

  // Add Alternate Link for mobile
  upsertLink('link[rel="alternate"]', { rel: 'alternate', media: 'only screen and (max-width: 640px)', href: canonicalUrl });

  // Preconnect to external resources
  upsertLink('link[rel="preconnect"][href="https://fonts.googleapis.com"]', { rel: 'preconnect', href: 'https://fonts.googleapis.com' });
  upsertLink('link[rel="preconnect"][href="https://fonts.gstatic.com"]', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' });

  // JSON-LD Structured Data
  const structuredData = generateStructuredData({
    title,
    description,
    path,
    image,
    type,
    product,
    breadcrumbs
  });

  if (structuredData) {
    addJsonLd(structuredData);
  }
};

/**
 * Generate structured data based on page type
 */
const generateStructuredData = ({ title, description, path, image, type, product, breadcrumbs }) => {
  if (type === 'product' && product) {
    return generateProductSchema(product);
  } else if (breadcrumbs && breadcrumbs.length > 0) {
    return generateBreadcrumbSchema(breadcrumbs);
  } else if (type === 'website' || path === '/') {
    return generateOrganizationSchema();
  }
  return null;
};

/**
 * Generate Product Schema for Google Rich Results
 */
const generateProductSchema = (product) => {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.shortDescription,
    image: product.images?.[0]?.url || DEFAULT_IMAGE,
    brand: {
      '@type': 'Brand',
      name: product.brand || SITE_NAME
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product._id}`,
      priceCurrency: 'BDT',
      price: product.discountPrice || product.price,
      availability: product.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    },
    aggregateRating: product.ratings?.count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.ratings?.average || 0,
      reviewCount: product.ratings?.count || 0
    } : undefined,
    category: product.category?.name || 'Products'
  };
};

/**
 * Generate Breadcrumb Schema for navigation
 */
const generateBreadcrumbSchema = (breadcrumbs) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`
    }))
  };
};

/**
 * Generate Organization Schema for homepage
 */
const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: DEFAULT_IMAGE,
    description: 'Buy imported foods, cosmetics and bakery essentials in Bangladesh with fast delivery and trusted quality.',
    sameAs: [
      'https://www.facebook.com/chattala.store',
      'https://www.instagram.com/chattala.store',
      'https://www.tiktok.com/@chattala.store'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@chattala.store',
      availableLanguage: ['en', 'bn']
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'BD',
      addressLocality: 'Dhaka'
    }
  };
};

/**
 * Add breadcrumb to page navigation for SEO
 */
export const addBreadcrumbs = (breadcrumbs) => {
  if (breadcrumbs && breadcrumbs.length > 0) {
    const schema = generateBreadcrumbSchema(breadcrumbs);
    addJsonLd(schema);
  }
};

