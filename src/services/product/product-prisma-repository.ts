import path from "path";
import fs from "fs";
import { prisma } from "@/lib/prisma";
import { ProductRepository } from "./product-repository";

export class ProductPrismaRepository implements ProductRepository {
  async migrateProducts(): Promise<void> {
    const filePath = path.resolve(process.cwd(), "prisma", "products.json");

    const products = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // Remove campos que o banco já preenche automaticamente
    // E ajusta os nomes dos campos para o novo modelo Catalog
    const productsToInsert = products.map(
      ({ id, createdAt, updatedAt, ...rest }) => {
        // Mapeia os campos do Product antigo para o novo Catalog

        if (
          rest.category === "kit" ||
          rest.category === "kits" ||
          rest.category === "Kits" ||
          rest.category === "Kit" ||
          rest.category === "Hidratante Sabonete" ||
          rest.category === "Hidratante e Sabonete" ||
          rest.category === "Hidratante Sabonete " ||
          rest.category === "Hidratante e Sabonete " ||
          rest.category === "Kit Cabelo" ||
          rest.category === "kit " ||
          rest.category === "Spray" ||
          rest.category === "Caixa" ||
          rest.category === "Caixa " ||
          rest.category === "copo "
        ) {
          rest.category = "Kits";
        }

        if (rest.category === "Kits") {
          return null;
        }

        // 🔹 Filtra perfumes com "kit" ou "Kit" no nome
        if (
          (rest.category === "perfume" || rest.category === "Perfume") &&
          (rest.name?.toLowerCase().includes("kit") ||
            rest.name?.includes("Kit"))
        ) {
          return null;
        }

        // 🔹 Se categoria é perfume e atende critérios femininos, seta como Perfume Feminino
        if (
          (rest.category === "perfume" || rest.category === "Perfume") &&
          (rest.brand?.toLowerCase().includes("ekos") ||
            rest.brand?.toLowerCase().includes("her code") ||
            rest.brand?.toLowerCase().includes("liz") ||
            rest.brand?.toLowerCase().includes("imensi") ||
            rest.brand?.toLowerCase().includes("diva") ||
            rest.brand?.toLowerCase().includes("essencial") ||
            rest.name?.toLowerCase().includes("egeo dolce 100ml feminino") ||
            rest.name?.toLowerCase().includes("florata gold") ||
            rest.name?.toLowerCase().includes("miniatura luna absoluta 25ml") ||
            rest.name?.toLowerCase().includes("celebre sua força 100ml") ||
            rest.name
              ?.toLowerCase()
              .includes("humor da minha vida feminino 100ml") ||
            rest.name?.toLowerCase().includes("kriska delirio 100ml") ||
            rest.name?.toLowerCase().includes("linda feminino 100ml") ||
            rest.name?.toLowerCase().includes("kissme cabernet 50ml"))
        ) {
          rest.category = "Perfume Feminino";
        }

        if (
          rest.category === "bodysplash" ||
          rest.category === "body splash" ||
          rest.category === "Body Splash" ||
          rest.category === "BodySplash" ||
          rest.category === "Body Spash" ||
          rest.category === " Body Splash" ||
          rest.category === "Splash" ||
          rest.category === "Bodysplach" ||
          rest.category === "Body Spray" ||
          rest.category === "Spray Hidratante" ||
          rest.category === "Colonia" ||
          rest.category === "Refil"
        ) {
          rest.category = "Body Splash";
        }

        if (
          rest.category === "hidratante" ||
          rest.category === "Hidratante" ||
          rest.category === "Hidratantes" ||
          rest.category === "Hidratante Corporal" ||
          rest.category === "Hidratante Manga Rosa" ||
          rest.category === "Hidratante " ||
          rest.category === "Hidratante para Mãos" ||
          rest.category === "Hidratante para Mãos" ||
          rest.category === "Hidrante Corporal" ||
          rest.category === "Creme " ||
          rest.category === "Cremes para Pentear"
        ) {
          rest.category = "Hidratantes e Cremes";
        }

        if (
          rest.category === "Garrafa " ||
          rest.category === "Sanduicheira" ||
          rest.category === "Coração" ||
          rest.category === "Espatula" ||
          rest.category === "Caneca" ||
          rest.category === "Cesta Artesanal" ||
          rest.category === "Armazenamento" ||
          rest.category === "Copo" ||
          rest.category === "Biscoito"
        ) {
          rest.category = "Personalizado";
        }

        if (rest.category === "Personalizado") {
          return null;
        }

        if (rest.category === "Luna  ") {
          rest.category = "Perfume Feminino";
        }

        if (rest.category === " Chypre") {
          rest.category = "Perfume Masculino";
        }

        if (
          rest.category === "Oleo" ||
          rest.category === "oleo" ||
          rest.category === "Oléo" ||
          rest.category === "Oléo " ||
          rest.category === "Óleo" ||
          rest.category === "Óleo capilar" ||
          rest.category === "Óleo Desodorante Corporal" ||
          rest.category === "Oléo para Cabelos"
        ) {
          rest.category = "Oleos";
        }

        if (
          rest.category === "Creme para Pentear" ||
          rest.category === "Creme Para Pentear" ||
          rest.category === "Creme para pentear" ||
          rest.category === "Creme"
        ) {
          rest.category = "Hidratantes e Cremes";
        }

        if (
          rest.category === "Batom" ||
          rest.category === "Gloss" ||
          rest.category === "Batom " ||
          rest.category === "Deliniador " ||
          rest.category === "Prime" ||
          rest.category === "Base" ||
          rest.category === "Inluminador" ||
          rest.category === "Mascara"
        ) {
          rest.category = "Maquiagem";
        }

        if (
          rest.category === "Sabonete" ||
          rest.category === "Sabonete " ||
          rest.category === "Sabonete em Barra" ||
          rest.category === "Sabonete Liquido" ||
          rest.category === "Condicionador" ||
          rest.category === "Toalha " ||
          rest.category === "Flor de Lis" ||
          rest.category === "Sabonetes Sortidos" ||
          rest.category === "Shampoo" ||
          rest.category === "Shampoo " ||
          rest.category === "Saboneteira " ||
          rest.category === "Saboneteira" ||
          rest.category === " Sabonete " ||
          rest.category === " Sabonete " ||
          rest.category === "Flor de Pesego" ||
          rest.category === "Mascara " ||
          rest.category === "Protetor Solar" ||
          rest.category === "Protetor" ||
          rest.category === "Banho"
        ) {
          rest.category = "Corpo e Banho";
        }

        if (
          rest.category === "Infantill" ||
          rest.category === "Deo Colonia" ||
          rest.category === "Condicionaor" ||
          rest.category === "Colonia " ||
          rest.category === "Sabonete  Infantil"
        ) {
          rest.category = "Infantil";
        }

        if (
          rest.category === "Deo Corporal" ||
          rest.category === "Desodorante em Creme" ||
          rest.category === "Desodorante Roll-on" ||
          rest.category === "Desodorante" ||
          rest.category === "Desodorante " ||
          rest.category === "creme " ||
          rest.category === "Gel" ||
          rest.category === " Gel" ||
          rest.category === "Colonia " ||
          rest.category === "Antitraspirante "
        ) {
          rest.category = "Desodorantes";
        }

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

    // 🔹 Filtra produtos nulos (kits removidos)
    const validProducts = productsToInsert.filter(
      (product) => product !== null
    );

    await prisma.catalog.createMany({
      data: validProducts,
      skipDuplicates: true, // evita erro se produto já existir
    });

    console.log(
      `✅ Produtos migrados para Catalog com sucesso! (${validProducts.length} produtos inseridos)`
    );
  }

  async migrateProductsForStore(storeId: string): Promise<void> {
    const productsPath = path.resolve(process.cwd(), "prisma", "products.json");
    const stockPath = path.resolve(process.cwd(), "prisma", "stock.json");

    const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
    const stockItems = JSON.parse(fs.readFileSync(stockPath, "utf-8"));

    // 🔹 Mapeia produtos por ID
    const productMap = new Map<string, any>();
    for (const product of products) {
      productMap.set(product.id, product);
    }

    // 🔹 Deduplica o estoque por productId
    const stockMap = new Map<string, any>();
    for (const stock of stockItems) {
      const existing = stockMap.get(stock.productId);

      if (!existing) {
        stockMap.set(stock.productId, { ...stock });
      } else {
        existing.quantity = (existing.quantity ?? 0) + (stock.quantity ?? 0);
      }
    }

    for (const stock of stockMap.values()) {
      const product = productMap.get(stock.productId);

      if (!product) {
        console.warn(
          "⚠️ Produto não encontrado no products.json:",
          stock.productId
        );
        continue;
      }

      if (!product.barcode) {
        console.warn("⚠️ Produto sem barcode no products.json:", product.id);
        continue;
      }

      // 1️⃣ Busca no catálogo pelo barcode
      const catalog = await prisma.catalog.findFirst({
        where: { barcode: product.barcode },
      });

      if (!catalog) {
        console.warn("⚠️ Produto não encontrado no Catalog:", product.barcode);
        continue;
      }

      // 2️⃣ Upsert atômico (não duplica nunca)
      await prisma.storeProduct.upsert({
        where: {
          storeId_catalogId: {
            storeId,
            catalogId: catalog.id,
          },
        },
        update: {
          quantity: stock.quantity ?? 0,
          price:
            stock.customPrice ?? stock.suggestedPrice ?? catalog.normalPrice,
          status: "active",
        },
        create: {
          name: catalog.name,
          price:
            stock.customPrice ?? stock.suggestedPrice ?? catalog.normalPrice,
          quantity: stock.quantity ?? 0,

          catalogId: catalog.id,
          catalogPrice: catalog.normalPrice,

          barcode: catalog.barcode ?? "",
          category: catalog.category,
          imgUrl: catalog.imgUrl,
          brand: catalog.brand ?? "",
          company: catalog.company ?? "",

          storeId,
          type: "catalog",
          status: "active",
        },
      });
    }

    console.log("✅ Migração concluída sem duplicações!");
  }
}
