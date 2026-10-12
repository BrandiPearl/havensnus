import type { MetadataRoute } from "next";
import { getBrands, getProductSlugs } from "@/lib/queries/products";
import { getBlogSlugs } from "@/lib/queries/blog";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const page = (path: string, changeFrequency: "daily" | "weekly" | "monthly" | "yearly", priority: number) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  const staticPages = [
    page("", "daily", 1),
    page("/products", "daily", 0.9),
    page("/brands", "weekly", 0.8),
    page("/faq", "monthly", 0.6),
    page("/blog", "weekly", 0.6),
    page("/about", "monthly", 0.5),
    page("/contact", "monthly", 0.5),
    page("/shipping", "monthly", 0.4),
    page("/returns", "monthly", 0.3),
    page("/privacy", "yearly", 0.2),
    page("/terms", "yearly", 0.2),
  ];

  const [brands, catalog, blog] = await Promise.all([getBrands(), getProductSlugs(), getBlogSlugs()]);

  const brandPages = brands.map((brand) => ({
    url: `${SITE_URL}/products?brand=${brand.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const productPages = catalog.map((product) => ({
    url: `${SITE_URL}/product/${product.slug}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const blogPages = blog.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...brandPages, ...productPages, ...blogPages];
}
