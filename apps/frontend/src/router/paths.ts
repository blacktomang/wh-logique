export const paths = {
  items: "/items",
  itemNew: "/items/new",
  itemDetail: (id: string) => `/items/${id}`,
  itemEdit: (id: string) => `/items/${id}/edit`,
  locations: "/locations",
} as const;
