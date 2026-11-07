import demo from '../data/reference.json';

// Optional boot endpoint: return the documented NewsDataset JSON shape.
// Without an API URL the frontend uses the captured reference fixtures.
export async function loadNewsDataset() {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) return demo;
  const response = await fetch(`${base.replace(/\/$/, '')}/site-data`);
  if (!response.ok) throw new Error(`News API returned ${response.status}`);
  const dataset = await response.json();
  if (!dataset.articles || !dataset.categories || !Array.isArray(dataset.homeIds) || !Array.isArray(dataset.papers)) {
    throw new Error('News API returned an invalid dataset');
  }
  return dataset;
}
