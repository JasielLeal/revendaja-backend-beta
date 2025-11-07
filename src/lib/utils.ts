export async function generateOrderNumber(): Promise<string> {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
}

export function getDateRangeUTC(from: string, to: string) {
  // Início do dia em UTC
  const fromDate = new Date(`${from}T00:00:00.000Z`);

  // Fim do dia em UTC
  const toDate = new Date(`${to}T23:59:59.999Z`);

  return { fromDate, toDate };
}
