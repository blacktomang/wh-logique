export const paths = {
  items: "/items",
  itemNew: "/items/new",
  itemDetail: (id: string) => `/items/${id}`,
  itemEdit: (id: string) => `/items/${id}/edit`,
  itemRestock: (id: string) => `/items/${id}/restock`,
  locations: "/locations",
} as const;
