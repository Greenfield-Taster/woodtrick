/*
 * How a piece count is laid out as rows and columns. It is arithmetic and
 * nothing else, but it used to live in `assemble.ts` beside the geometry —
 * which imports three, so the custom-puzzle page pulled a renderer in to
 * answer a question about two integers. It sits on its own for that reason.
 */
export function previewGrid(pieces: number): { rows: number; cols: number } {
  if (pieces <= 100) return { rows: 4, cols: 5 }
  if (pieces <= 200) return { rows: 5, cols: 7 }
  if (pieces <= 350) return { rows: 6, cols: 9 }
  return { rows: 8, cols: 11 }
}
