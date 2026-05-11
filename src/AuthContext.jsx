import { createContext, useContext, useState, useEffect } from "react";
import { COACH_PASSWORD } from "./theme";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isCoach, setIsCoach] = useState(() => sessionStorage.getItem("id_coach") === "yes");
  const [identity, setIdentity] = useState(() => {
    try { return JSON.parse(localStorage.getItem("id_identity")) || null; }
    catch { return null; }
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  const loginCoach = (password) => {
    if (password === COACH_PASSWORD) {
      setIsCoach(true);
      sessionStorage.setItem("id_coach", "yes");
      return true;
    }
    return false;
  };

  const logoutCoach = () => {
    setIsCoach(false);
    sessionStorage.removeItem("id_coach");
  };

  const saveIdentity = (name, playerName) => {
    const id = { name, playerName, savedAt: Date.now() };
    setIdentity(id);
    localStorage.setItem("id_identity", JSON.stringify(id));
    setShowIdentityModal(false);
  };

  const requireIdentity = (fn) => {
    if (!identity) { setShowIdentityModal(true); return; }
    fn();
  };

  const requireCoach = (fn) => {
    if (!isCoach) { setShowPasswordModal(true); return; }
    fn();
  };

  return (
    <AuthContext.Provider value={{
      isCoach, identity,
      loginCoach, logoutCoach,
      saveIdentity, requireIdentity, requireCoach,
      showPasswordModal, setShowPasswordModal,
      showIdentityModal, setShowIdentityModal,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
