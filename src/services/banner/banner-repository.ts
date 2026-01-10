import { BannerEntity } from "@/entities/banner-entity";

export interface BannerRepository {
  createBanner(data: {
    mobile_url: string;
    desktop_url: string;
    text?: string;
  }): Promise<BannerEntity>;

  findById(id: string): Promise<BannerEntity | null>;
  findFirst(): Promise<{ id: string } | null>;
}
