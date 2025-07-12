export function buildQueryString(data) {
    const query = Object.keys(data).map((k) => `${k}=${data[k]}`).join('&');
    return query.length > 0 ? `?${query}` : '';
}
