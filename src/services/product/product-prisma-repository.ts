import path from "path";
import fs from "fs";
import { prisma } from "@/lib/prisma";

export class ProductPrismaRepository {
  async migrateProducts(): Promise<void> {
    const filePath = path.resolve(process.cwd(), "prisma", "products.json");

    const products = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Remove campos que o banco já preenche automaticamente
    // E ajusta os nomes dos campos para o novo modelo Catalog
    const productsToInsert = products.map(
      ({ id, createdAt, updatedAt, ...rest }) => {
        // Mapeia os campos do Product antigo para o novo Catalog
        return {
          name: rest.name,
          normalPrice: rest.price || rest.normalPrice || 0, // ajuste conforme seu JSON
          suggestedPrice: rest.suggestedPrice || rest.price || 0,
          category: rest.category || "Geral",
          barcode: rest.barcode,
          imgUrl: rest.imgUrl || rest.image,
          brand: rest.brand,
          company: rest.company,
          // createdAt e updatedAt serão gerados automaticamente
        };
      }
    );

    await prisma.catalog.createMany({
      data: productsToInsert,
      skipDuplicates: true, // evita erro se produto já existir
    });

    console.log("✅ Produtos migrados para Catalog com sucesso!");
  }
}
