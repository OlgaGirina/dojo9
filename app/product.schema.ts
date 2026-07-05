// schemas/product.schema.ts

import { z } from "zod";

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  image: z.string().url(),
  slug: z.string(),
});

export const ProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  price: z.number(),
  description: z.string(),
  images: z.array(z.string().url()),
  category: CategorySchema,
  creationAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Product = z.infer<typeof ProductSchema>;
