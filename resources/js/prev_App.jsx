import { useState } from 'react';
import { SignupPage } from './components/SignUpPage';

function App() {
  const [lastSignup, setLastSignup] = useState(null);

  const handleSignup = (name, email, password) => {
    console.log('Signup submitted:', { name, email, password });
    setLastSignup({ name, email });
  };

  const handleSwitchToLogin = () => {
    console.log('Switch to login clicked');
    alert('Login page not wired yet');
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <SignupPage
        onSignup={handleSignup}
        onSwitchToLogin={handleSwitchToLogin}
      />

      {lastSignup && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded text-sm">
          Signed up as: {lastSignup.name} ({lastSignup.email})
        </div>
      )}
    </div>
  );
}

export default App;


// import { useState } from 'react'
// import reactLogo from '../app/assets/react.svg'
// import viteLogo from '/vite.svg'
// import '../styles/App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)} className='bg-yellow-500'>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
