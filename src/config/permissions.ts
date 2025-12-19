// Definição de Roles e suas permissões
export const ROLES = {
  Admin: "Admin",
  Member: "Member",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Permissões disponíveis no sistema
export const PERMISSIONS = {
  // Produtos
  CREATE_PRODUCT: "create_product",
  EDIT_PRODUCT: "edit_product",
  DELETE_PRODUCT: "delete_product",
  VIEW_PRODUCTS: "view_products",

  // Vendas
  CREATE_ORDER: "create_order",
  VIEW_ORDERS: "view_orders",
  CANCEL_ORDER: "cancel_order",
  UPDATE_ORDER_STATUS: "update_order_status",

  // Loja
  EDIT_STORE: "edit_store",
  VIEW_STORE: "view_store",

  // Dashboard
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_METRICS: "view_metrics",

  // Configurações Admin
  MANAGE_USERS: "manage_users",
  MANAGE_PLANS: "manage_plans",
  VIEW_ALL_STORES: "view_all_stores",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Mapeamento de Role -> Permissões
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  Admin: [
    // Admin tem TODAS as permissões
    PERMISSIONS.CREATE_PRODUCT,
    PERMISSIONS.EDIT_PRODUCT,
    PERMISSIONS.DELETE_PRODUCT,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.CANCEL_ORDER,
    PERMISSIONS.UPDATE_ORDER_STATUS,
    PERMISSIONS.EDIT_STORE,
    PERMISSIONS.VIEW_STORE,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_METRICS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_PLANS,
    PERMISSIONS.VIEW_ALL_STORES,
  ],
  Member: [
    // Member tem permissões básicas
    PERMISSIONS.CREATE_PRODUCT,
    PERMISSIONS.EDIT_PRODUCT,
    PERMISSIONS.DELETE_PRODUCT,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.UPDATE_ORDER_STATUS,
    PERMISSIONS.EDIT_STORE,
    PERMISSIONS.VIEW_STORE,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_METRICS,
  ],
};

// Função para verificar se um role tem uma permissão
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.includes(permission) ?? false;
}
