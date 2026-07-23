export default function CardWrapper({ children, className = '', ...props }) {
  return (
    <div className={`rounded-lg border border-[#D6DAE3] bg-white shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}