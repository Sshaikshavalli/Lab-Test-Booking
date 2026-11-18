/** URL of a file in /public that also works when the site is served from a sub-folder (e.g. GitHub Pages). */
export const asset = (path) => `${import.meta.env.BASE_URL}${String(path).replace(/^\//, '')}`;
