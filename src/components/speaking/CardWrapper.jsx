export default function CardWrapper({ children, className = '', ...props }) {
  return (
    <div className={`rounded-lg border border-border bg-card shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}