import { prisma } from "@/lib/prisma";
import { BannerRepository } from "./banner-repository";
import { BannerEntity } from "@/entities/banner-entity";

export class BannerPrismaRepository implements BannerRepository {
  async createBanner(data: {
    mobile_url: string;
    desktop_url: string;
    text?: string;
  }): Promise<BannerEntity> {
    const newBanner = await prisma.banner.create({
      data: {
        mobile_url: data.mobile_url,
        desktop_url: data.desktop_url,
        text: data.text,
      },
    });

    return {
      id: newBanner.id,
      text: newBanner.text,
      createdAt: newBanner.createdAt,
      updatedAt: newBanner.updatedAt,
      mobileUrl: newBanner.mobile_url,
      desktopUrl: newBanner.desktop_url,
    };
  }

  async findById(id: string): Promise<BannerEntity | null> {
    const banner = await prisma.banner.findUnique({
      where: {
        id,
      },
    });

    if (!banner) {
      return null;
    }

    return {
      id: banner.id,
      text: banner.text,
      createdAt: banner.createdAt,
      updatedAt: banner.updatedAt,
      mobileUrl: banner.mobile_url,
      desktopUrl: banner.desktop_url,
    };
  }

  async findFirst(): Promise<{ id: string } | null> {
    const banner = await prisma.banner.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!banner) {
      return null;
    }

    return {
      id: banner.id,
    };
  }
}
