import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "us-east-2", // Substitua pela região do seu bucket
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "", // Chave de acesso
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "", // Chave secreta
  },
});
