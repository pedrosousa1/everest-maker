/**
 * Máscaras de input – BRL e Telefone BR
 */

/** Remove tudo exceto dígitos */
function onlyDigits(v: string): string {
  return v.replace(/\D/g, "");
}

/**
 * Formata centavos em moeda brasileira: "R$ 1.234,56"
 * Armazena como string formatada; use parseCurrency() para obter o número.
 */
export function maskCurrency(raw: string): string {
  const digits = onlyDigits(raw);
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  const value = (cents / 100).toFixed(2);
  const [intPart, decPart] = value.split(".");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${formatted},${decPart}`;
}

/**
 * Extrai o valor numérico de uma string formatada como moeda.
 * "R$ 1.234,56" → 1234.56
 */
export function parseCurrency(formatted: string): number {
  if (!formatted) return 0;
  const cleaned = formatted
    .replace(/R\$\s?/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/**
 * Máscara para telefone brasileiro:
 * (11) 9999-9999   ou   (11) 99999-9999
 */
export function maskPhone(raw: string): string {
  const digits = onlyDigits(raw).slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Formata um número como moeda para exibição em campo (quando já temos o valor numérico).
 * Usado para preencher campos de edição com valor existente.
 */
export function numberToCurrencyInput(n: number): string {
  if (!n && n !== 0) return "";
  if (n === 0) return "";
  const str = n.toFixed(2);
  const [intPart, decPart] = str.split(".");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${formatted},${decPart}`;
}
