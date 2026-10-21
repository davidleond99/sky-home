import type { AuditAction, AuditEntity } from "./record";

export const ACTION_LABELS: Record<AuditAction, string> = {
  create: "Creó",
  update: "Editó",
  delete: "Eliminó",
  restore: "Restauró",
  archive: "Archivó",
  login: "Entró",
  logout: "Salió",
};

export const ENTITY_LABELS: Record<AuditEntity, string> = {
  exchange: "Venta de USD",
  expense: "Gasto",
  product: "Producto",
  category: "Categoría",
  shopping_list: "Lista de la compra",
  shopping_list_item: "Producto de la lista",
  session: "Sesión",
};

export const FIELD_LABELS: Record<string, string> = {
  occurredOn: "Fecha",
  usdAmount: "USD",
  rate: "Tasa (CUP/USD)",
  currency: "Moneda",
  cupAmount: "CUP recibidos",
  product: "Producto",
  productName: "Producto",
  category: "Categoría",
  categoryName: "Categoría",
  quantity: "Cantidad",
  unit: "Unidad",
  unitPrice: "Precio unitario",
  total: "Total",
  note: "Nota",
  name: "Nombre",
  defaultUnit: "Unidad por defecto",
  sortOrder: "Orden",
  deletedAt: "Eliminado",
  archivedAt: "Archivado",
  listName: "Lista",
  closedAt: "Cerrada",
  status: "Estado",
};
