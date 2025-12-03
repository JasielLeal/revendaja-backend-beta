export class BannerEntity {
  id?: string;
  mobileUrl: string;
  desktopUrl: string;
  text?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(partial: Partial<BannerEntity>) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }
}
