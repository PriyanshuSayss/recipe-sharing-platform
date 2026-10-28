import slugify from 'slugify';
import { Recipe } from '../models/Recipe';

/**
 * Generate a unique slug from a title.
 * If slug already exists, appends a numeric suffix: -2, -3, etc.
 */
export async function generateUniqueSlug(
  title: string,
  excludeId?: string
): Promise<string> {
  const baseSlug = slugify(title, { lower: true, strict: true, trim: true });
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const query: Record<string, unknown> = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await Recipe.findOne(query).lean();
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
