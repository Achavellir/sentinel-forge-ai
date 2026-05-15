import { useEffect } from 'react';

const defaultImage = '/og-image.svg';

export function SEO({ title, description, image = defaultImage }) {
  useEffect(() => {
    document.title = title ? `${title} | 1PhishGuard AI` : '1PhishGuard AI';

    const tags = {
      description,
      'og:title': document.title,
      'og:description': description,
      'og:image': image,
    };

    Object.entries(tags).forEach(([name, content]) => {
      if (!content) return;
      const selector = name.startsWith('og:') ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (name.startsWith('og:')) element.setAttribute('property', name);
        else element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    });
  }, [title, description, image]);

  return null;
}
