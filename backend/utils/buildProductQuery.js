export const buildProductQuery = (query) => {
  const filters = {};

  if (query.search) {
    filters.$text = { $search: query.search };
  }

  if (query.category) {
    filters.category = query.category;
  }

  if (query.featured === "true") {
    filters.featured = true;
  }

  if (query.minPrice || query.maxPrice) {
    filters.price = {};
    if (query.minPrice) filters.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filters.price.$lte = Number(query.maxPrice);
  }

  if (query.productType && ["IN_STOCK", "PRE_ORDER", "OUT_OF_STOCK"].includes(query.productType)) {
    filters.productType = query.productType;
  }

  return filters;
};
