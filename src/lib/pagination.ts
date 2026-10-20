/** Número de páginas para `total` filas (al menos 1, aunque no haya filas). */
export function pageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Desplazamiento SQL de la página `page` (1-indexada). */
export function pageOffset(page: number, pageSize: number) {
  return (page - 1) * pageSize;
}
