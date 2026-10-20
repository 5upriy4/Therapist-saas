/**
 * Generates a clean URL slug from a name or title
 * @param {string} text - The input name (e.g., "Dr. Priya Sharma")
 * @returns {string} - Clean slug (e.g., "dr-priya-sharma")
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\./g, '') // remove dots (Dr. -> dr)
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w\-]+/g, '') // remove non-word chars
    .replace(/\-\-+/g, '-') // replace multiple - with single -
    .replace(/^-+/, '') // trim - from start
    .replace(/-+$/, ''); // trim - from end
};

/**
 * Ensures slug uniqueness against a Mongoose model
 * @param {Model} model - The Mongoose model to check (e.g., Therapist)
 * @param {string} baseText - Name to generate slug from
 * @param {ObjectId} currentId - Optional ID to ignore when updating existing record
 * @returns {Promise<string>} - A guaranteed unique slug
 */
const generateUniqueSlug = async (model, baseText, currentId = null) => {
  let baseSlug = slugify(baseText);
  if (!baseSlug) baseSlug = 'therapist';

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (currentId) {
      query._id = { $ne: currentId };
    }

    const exists = await model.findOne(query);
    if (!exists) {
      return slug;
    }

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
};

module.exports = {
  slugify,
  generateUniqueSlug,
};
