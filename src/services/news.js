const env = import.meta.env || {};
export const API_BASE = (env.VITE_API_BASE_URL?.trim() || 'https://newspaper-web-production.up.railway.app').replace(/\/+$/, '');
export const TENANT_SLUG = env.VITE_TENANT_SLUG?.trim() || 'digontonews';

async function request(path, signal) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {'X-Tenant-Slug': TENANT_SLUG},
    signal,
  });
  if (!response.ok) {
    const error = new Error(`News API returned ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export function publicationDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(value));
}

function articleFromApi(article) {
  const publishedAt = article.published_at || article.created_at;
  let content = article.content || '';
  if (typeof DOMParser !== 'undefined' && /<[^>]+>/.test(content)) {
    const doc = new DOMParser().parseFromString(content.replace(/<\/(p|div|h[1-6])>|<br\s*\/?\s*>/gi, '\n'), 'text/html');
    doc.querySelectorAll('script,style').forEach(node => node.remove());
    content = doc.body.textContent || '';
  }
  const date = publicationDate(publishedAt) ? new Date(publishedAt).toLocaleDateString('bn-BD', {timeZone: 'Asia/Dhaka', dateStyle: 'long'}) : '';
  return {
    id: article.slug,
    title: article.title,
    image: article.featured_image_url || '',
    summary: article.ai_summary || '',
    category: article.category?.name || 'অনলাইন',
    categorySlug: article.category?.slug,
    publishedAt,
    meta: `${article.category?.name || 'অনলাইন'} | ${date}`,
    body: content.split(/\n+/).map(part => part.trim()).filter(Boolean),
    videoUrl: article.video_url || '',
  };
}

export async function loadNewsDataset(signal) {
  const [categories, articles] = await Promise.all([
    request('/api/news/categories/', signal),
    request('/api/news/articles/', signal),
  ]);
  const dataset = {articles: {}, categories: {}, categorySlugs: {}, homeIds: [], papers: []};
  for (const category of categories) {
    dataset.categories[category.name] = [];
    dataset.categorySlugs[category.name] = category.slug;
  }
  for (const article of articles) {
    const story = articleFromApi(article);
    dataset.articles[story.id] = story;
    dataset.homeIds.push(story.id);
    (dataset.categories[story.category] ||= []).push(story.id);
    dataset.categorySlugs[story.category] = story.categorySlug;
  }
  return dataset;
}

export async function loadArticle(slug, signal) {
  return articleFromApi(await request(`/api/news/articles/${encodeURIComponent(slug)}/`, signal));
}
