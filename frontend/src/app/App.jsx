import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import { AppRouter } from './router.jsx';

export function App() { return <BrowserRouter><AuthProvider><AppRouter /></AuthProvider></BrowserRouter>; }
