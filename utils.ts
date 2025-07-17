export function parseQuantidadeFromTitle(title: string): number {
  const match = title.match(/([\d\.\,]+)\s*UNID/i);
  if (!match) return 0;

  // Remove pontos e converte para número
  const raw = match[1].replace(/\./g, '').replace(',', '.');
  return parseInt(raw, 10);
}
