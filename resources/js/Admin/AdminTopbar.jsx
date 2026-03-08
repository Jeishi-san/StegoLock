export default function AdminTopbar({ email, role }) {
  return (
    <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
      <div className="flex items-center justify-end gap-4">
        <div className="text-right">
          <p className="text-sm text-white font-medium">{email}</p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                role === "superadmin"
                  ? "bg-red-600/20 text-red-400 border border-red-600/30"
                  : "bg-blue-600/20 text-blue-400 border border-blue-600/30"
              }`}
            >
              {role === "superadmin" ? "SUPERADMIN" : "ADMIN"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
