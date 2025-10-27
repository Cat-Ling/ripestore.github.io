import { fetchJSON } from './utils.js';

const cache = new Map();

export async function fetchRepo(src) {
  if (cache.has(src)) {
    return cache.get(src);
  }

  const url = src.includes('://') ? src : `https://raw.githubusercontent.com/ripestore/repos/main/${src}.json`;
  const data = await fetchJSON(url);

  const result = { data, url };
  cache.set(src, result);

  return result;
}
