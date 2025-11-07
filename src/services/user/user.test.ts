process.env.DATABASE_URL =
  "postgresql://docker:docker@localhost:5433/lealperfumaria";
import "dotenv/config";
import { buildApp } from "@/lib/build-app";
import request from "supertest";
import { it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";

let app;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await prisma.user.deleteMany({
    where: {
      email: "john@example.com",
    },
  });
});

it("should create user, verify code and login successfully", async () => {
  const userData = {
    name: "John Doe",
    email: "john@example.com",
    password: "123456",
  };

  // 1️⃣ Cria o usuário
  const createResponse = await request(app.server)
    .post("/users")
    .send(userData);

  expect(createResponse.status).toBe(201);

  // 2️⃣ Pega o código gerado no banco
  const userInDb = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  expect(userInDb).not.toBeNull();
  const verificationCode = userInDb!.tokenAccess; // ou o campo que você usa

  console.log("token:", verificationCode)

  // 3️⃣ Valida o código
  const verifyResponse = await request(app.server).put("/verify-email").send({
    token: verificationCode,
  });

  expect(verifyResponse.status).toBe(200);

  // 4️⃣ Faz login
  const loginResponse = await request(app.server).post("/signin").send({
    email: userData.email,
    password: userData.password,
  });

  expect(loginResponse.status).toBe(201);
});
