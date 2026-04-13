const SITE_URL = 'https://www.chattala.store';
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

export const applySeo = ({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website'
}) => {
  const canonicalUrl = `${SITE_URL}${path}`;
  document.title = title;

  upsertMeta('meta[name="description"]', { name: 'description', content: description });
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });
  upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });
};

