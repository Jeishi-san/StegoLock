import { Link } from "@inertiajs/react";

export default function Layout({ children }) {
    return (
        <>
            <header>
                <nav>
                    <Link className="nav-link" href="/">Home</Link>
                    <Link className="nav-link" href="/create">Create</Link>
                </nav>
            </header>

            <main>
                {children}
            </main>
        </>
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
