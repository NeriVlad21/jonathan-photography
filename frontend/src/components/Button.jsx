export default function Button({
  children,
  variant = 'primary', // primary | ghost-dark | ghost-light
  size,
  block,
  as: Component = 'button',
  className = '',
  ...props
}) {
  const cls = [
    'btn',
    `btn--${variant}`,
    size === 'sm' ? 'btn--sm' : '',
    block ? 'btn--block' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <Component className={cls} {...props}>
      {children}
    </Component>
  )
}
