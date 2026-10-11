export interface Product {
  id: string;
  slug: string;
  name: string;
  sku: string;
  /** Sanitised HTML (p, h3, ul, li, strong, em). */
  description: string;
  short_description: string;
  /** AUD, per can. */
  price: number;
  compare_at_price?: number;
  brand?: string;
  brand_name?: string;
  product_line?: string;
  tags: string[];
  images: ProductImage[];
  features: string[];
  strength_mg?: number;
  strength_level?: string;
  flavour?: string;
  flavour_family?: string;
  pouch_format?: string;
  pouches_per_tin?: number;
  stock_quantity?: number;
  in_stock: boolean;
  is_featured: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
  seo?: ProductSEO;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
  is_primary: boolean;
}

export interface ProductSEO {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  image_url?: string;
  position: number;
  is_featured: boolean;
  product_count?: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author: Author;
  category: string;
  tags: string[];
  published_at: string;
  updated_at: string;
  read_time: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface Author {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  review: string;
  product: string;
  avatar?: string;
  date: string;
}

export type SortOption =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "strength-asc"
  | "strength-desc"
  | "newest"
  | "az";

export interface FilterState {
  brands: string[];
  strengths: string[];
  flavours: string[];
  formats: string[];
  inStock: boolean;
  search?: string;
  sort: SortOption;
}
