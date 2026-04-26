export function DecorativeBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Light Mode Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:hidden" />
      
      {/* Dark Mode Gradient (Cyber-Noir) */}
      <div className="absolute inset-0 bg-[#020617] hidden dark:block" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.05),transparent_70%)] hidden dark:block" />

      {/* Animated Gradient Orbs - Light mode */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob dark:hidden" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000 dark:hidden" />
      
      {/* Animated Gradient Orbs - Dark mode */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-cyber-accent/5 rounded-full filter blur-[100px] opacity-50 animate-blob hidden dark:block" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-cyber-accent/5 rounded-full filter blur-[100px] opacity-30 animate-blob animation-delay-2000 hidden dark:block" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <svg width="100%" height="100%">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-400 dark:text-cyber-border" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Decorative Shapes */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 border border-indigo-200/30 rounded-full" />
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 border border-purple-200/30 rounded-full" />
    </div>
  );
}
