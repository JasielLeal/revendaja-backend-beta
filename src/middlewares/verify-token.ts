import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

export async function verifyToken(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return reply.status(401).send({ error: "Token ausente" });
  }

  const token = authHeader.split(" ")[1]; // "Bearer <token>"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      name: string | null;
      role: string;
      plan?: string;
      firstAccess?: boolean;
    };

    req.user = decoded; // <-- injeta o user no request
  } catch (error) {
    return reply.status(401).send({ error: "Token inválido" });
  }
}
