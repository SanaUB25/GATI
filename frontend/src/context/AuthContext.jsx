import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('railvista.session') || 'null'));
  function signIn(user, token) { localStorage.setItem('railvista.token', token); localStorage.setItem('railvista.session', JSON.stringify(user)); setSession(user); }
  function signOut() { localStorage.removeItem('railvista.token'); localStorage.removeItem('railvista.session'); setSession(null); }
  return <AuthContext.Provider value={{ session, signIn, signOut }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
