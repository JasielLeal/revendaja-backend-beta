interface Banner {
  id: string;
  name: string;
  url: string;
  category: string;
  previewUrl: string;
}

export class BannerService {
  // Lista de banners disponíveis (você pode mover isso para um arquivo JSON ou banco de dados)
  private static availableBanners: Banner[] = [
    {
      id: "elegant-purple",
      name: "Elegante Roxo",
      url: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1200&h=400&fit=crop",
      category: "elegante",
      previewUrl:
        "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300&h=100&fit=crop",
    },
    {
      id: "modern-pink",
      name: "Moderno Rosa",
      url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=1200&h=400&fit=crop",
      category: "moderno",
      previewUrl:
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=100&fit=crop",
    },
    {
      id: "luxury-gold",
      name: "Luxo Dourado",
      url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=400&fit=crop",
      category: "luxo",
      previewUrl:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=100&fit=crop",
    },
    {
      id: "minimalist-white",
      name: "Minimalista Branco",
      url: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=400&fit=crop",
      category: "minimalista",
      previewUrl:
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=100&fit=crop",
    },
    {
      id: "nature-green",
      name: "Natureza Verde",
      url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
      category: "natureza",
      previewUrl:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=100&fit=crop",
    },
    {
      id: "perfume-bottles",
      name: "Frascos de Perfume",
      url: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&h=400&fit=crop",
      category: "perfume",
      previewUrl:
        "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=100&fit=crop",
    },
  ];

  static getAllBanners(): Banner[] {
    return this.availableBanners;
  }

  static getBannersByCategory(category: string): Banner[] {
    return this.availableBanners.filter(
      (banner) => banner.category === category
    );
  }

  static getBannerById(id: string): Banner | null {
    return this.availableBanners.find((banner) => banner.id === id) || null;
  }

  static getCategories(): string[] {
    const categories = [
      ...new Set(this.availableBanners.map((banner) => banner.category)),
    ];
    return categories;
  }

  static validateBannerId(bannerId: string): boolean {
    return this.availableBanners.some((banner) => banner.id === bannerId);
  }
}
