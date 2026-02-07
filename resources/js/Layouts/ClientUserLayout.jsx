import Sidebar from "@/Components/Sidebar";
import { Link } from "@inertiajs/react";

export default function ClientUserLayout({ children }) {
  return (
    <div className="h-screen grid grid-cols-[240px_1fr] grid-rows-[64px_1fr]">

      {/* Sidebar: spans full height */}
      <div className="row-span-2">
        <Sidebar />
      </div>

      {/* Header */}
      <header className="col-start-2 bg-white border-b px-6 flex items-center">
        <nav className="flex gap-6 text-sm font-medium">
          <Link href="/">Home</Link>
          <Link href="/create">Create</Link>
        </nav>
      </header>

      {/* Main */}
      <main className="col-start-2 p-6 overflow-y-auto bg-gray-50">
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
