import { Server, Socket } from "socket.io";

let io: Server | null = null;

export function initializeSocket(socketServer: Server) {
  io = socketServer;

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // Quando o cliente se conectar, ele pode se juntar a uma sala específica da loja
    socket.on("join-store", (storeId: string) => {
      socket.join(`store:${storeId}`);
      console.log(`📍 Socket ${socket.id} entrou na sala da loja: ${storeId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.IO não foi inicializado!");
  }
  return io;
}

// Função helper para emitir eventos de vendas
export function emitOrderCreated(storeId: string, orderData: any) {
  const io = getIO();
  // Emite para todos os clientes conectados na sala da loja específica
  io.to(`store:${storeId}`).emit("order:created", orderData);
  console.log(`📢 Evento order:created emitido para loja ${storeId}`);
}

// Função helper para emitir eventos de atualização de pedidos
export function emitOrderUpdated(storeId: string, orderData: any) {
  const io = getIO();
  io.to(`store:${storeId}`).emit("order:updated", orderData);
  console.log(`📢 Evento order:updated emitido para loja ${storeId}`);
}

// Função helper para emitir eventos de estoque baixo
export function emitLowStock(storeId: string, productData: any) {
  const io = getIO();
  io.to(`store:${storeId}`).emit("product:low-stock", productData);
  console.log(`📢 Evento product:low-stock emitido para loja ${storeId}`);
}

// Função helper para emitir eventos de venda online criada (para invalidar cache no frontend)
export function emitOnlineOrderCreated(storeId: string, orderData: any) {
  const io = getIO();
  const room = `store:${storeId}`;
  // Emite para todos os clientes conectados na sala da loja específica
  io.to(room).emit("online-order:created", {
    ...orderData,
    room, // Adiciona a sala ao payload
  });

  console.log(`📢 Evento online-order:created emitido para sala: ${room}`);
}
