export const paths = {
  items: "/items",
  itemNew: "/items/new",
  itemDetail: (id: string) => `/items/${id}`,
  locations: "/locations",
} as const;
