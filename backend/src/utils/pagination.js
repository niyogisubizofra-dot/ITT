/**
 * Build Sequelize pagination options from query params
 * @param {object} query - req.query
 * @returns {{ limit, offset, page }}
 */
const paginate = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { limit, offset, page };
};

/**
 * Format paginated response
 */
const paginatedResponse = (data, count, page, limit) => ({
  data,
  pagination: {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  },
});

module.exports = { paginate, paginatedResponse };
