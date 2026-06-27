/**
 * Categorías de producto de ReWear. El marketplace ya no se limita a "ropa":
 * el nicho central son las zapatillas de marca, más prendas, gorras y mochilas.
 *
 * `categoria` se guarda como texto en la DB (flexible), pero en el borde de la
 * API se valida contra este conjunto cerrado, que además rutea el prompt de IA
 * por tipo de producto.
 */
export enum Categoria {
  ZAPATILLAS = 'ZAPATILLAS',
  PRENDAS = 'PRENDAS',
  GORRAS = 'GORRAS',
  MOCHILAS = 'MOCHILAS',
}

export const CATEGORIA_VALUES = Object.values(Categoria);

/** Etiqueta legible para mostrar al usuario. */
export const CATEGORIA_LABEL: Record<Categoria, string> = {
  [Categoria.ZAPATILLAS]: 'Zapatillas',
  [Categoria.PRENDAS]: 'Prendas',
  [Categoria.GORRAS]: 'Gorras',
  [Categoria.MOCHILAS]: 'Mochilas y bolsos',
};

/**
 * Qué mirar para autenticidad/condición en cada categoría — se inyecta en el
 * prompt de visión para que la IA evalúe lo relevante de cada tipo de producto.
 */
export const CATEGORIA_FOCO_IA: Record<Categoria, string> = {
  [Categoria.ZAPATILLAS]:
    'zapatillas de marca: revisá suela (desgaste, patrón), costuras, alineación del logo, plantilla, ' +
    'etiqueta de talla y, si aparece, la caja. El desgaste y la decoloración importan mucho.',
  [Categoria.PRENDAS]:
    'prenda de marca (polera, hoodie, chamarra, etc.): revisá etiqueta de marca/talla, calidad de costuras, ' +
    'estampados o logos, pilling y decoloración.',
  [Categoria.GORRAS]:
    'gorra de marca: revisá bordado del logo, etiqueta interior, estado de la visera y la tela.',
  [Categoria.MOCHILAS]:
    'mochila o bolso de marca: revisá etiqueta de marca, cierres y herrajes, costuras y desgaste de la tela.',
};

/** Normaliza un texto libre de categoría al enum, o null si no matchea. */
export function toCategoria(value?: string | null): Categoria | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  return (CATEGORIA_VALUES as string[]).includes(upper) ? (upper as Categoria) : null;
}
