interface ProductPhotoProps {
  src?: string
  alt?: string
  className?: string
  /* Widest the picture is ever drawn, so the browser can skip the oversized decode. */
  sizes?: string
  eager?: boolean
}

/*
 * The photographs are cut-outs on transparency, so nothing here paints a
 * background — whatever the picture sits on shows through, in either theme.
 */
export function ProductPhoto({ src, alt = '', className, sizes, eager }: ProductPhotoProps) {
  if (!src) return null

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      sizes={sizes}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  )
}
