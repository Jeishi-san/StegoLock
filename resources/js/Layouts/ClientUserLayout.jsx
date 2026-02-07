import Sidebar from "@/Components/Sidebar";
import { Link } from "@inertiajs/react";

export default function ClientUserLayout({ children, selectedFolder = "Dashboard", user }) {
  return (
    <div className="h-screen grid grid-cols-[280px_1fr] grid-rows-[auto_1fr]">

      {/* Sidebar: spans full height */}
      <div className="row-span-2">
        <Sidebar />
      </div>

      {/* Header: starts to the right of sidebar */}
      <header className="col-start-2 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-8 py-5 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-semibold text-gray-900">
            {selectedFolder}
          </h1>

          {/* User / actions placeholder */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button className="p-2 rounded bg-white shadow-sm">Grid</button>
              <button className="p-2 rounded">List</button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">{user?.name || "User Name"}</span>
              <button className="text-gray-500 hover:text-gray-700">Logout</button>
            </div>
          </div>
        </div>

        {/* Search bar placeholder */}
        <div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </header>

      {/* Main content */}
      <main className="col-start-2 p-6 bg-gray-50 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}






//for specific layout in another file
// import Layout from "../Layouts/Layout";
// function Login({name}) {
//     return (
//         <div>
//             <h1 className="title">Login Page</h1>
//             <p>Welcome, {name}!</p>
//         </div>
//     );
// }

// Login.layout = page => <Layout children={page} />

// export default Login;
