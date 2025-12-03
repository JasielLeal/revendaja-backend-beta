import { BannerRepository } from "./banner-repository";

export class BannerService {
  constructor(private bannerRepository: BannerRepository) {}

  async createBanner(data: {
    mobile_url: string;
    desktop_url: string;
    text?: string;
  }) {
    const banner = await this.bannerRepository.createBanner({
      desktop_url: data.desktop_url,
      mobile_url: data.mobile_url,
      text: data.text,
    });

    return banner;
  }
}
