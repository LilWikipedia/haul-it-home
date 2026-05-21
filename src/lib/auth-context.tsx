import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: "user" | "hauler" | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [userRole, setUserRole] = useState<"user" | "hauler" | null>(null);

  const fetchUserRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("fetchUserRole error", error);
      return null;
    }

    const roles = (data ?? []).map((r) => r.role as "user" | "hauler");
    return roles.includes("hauler") ? "hauler" : roles.includes("user") ? "user" : null;
  }, []);

  useEffect(() => {
    let mounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setUserRole((currentRole) => (nextSession?.user ? currentRole : null));
      setRoleLoading(!!nextSession?.user);
      setAuthLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        applySession(nextSession);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRole = async () => {
      if (authLoading) return;

      if (!user) {
        setUserRole(null);
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);
      const role = await fetchUserRole(user.id);
      if (cancelled) return;

      if (role === null) {
        setUserRole(null);
      } else {
        setUserRole(role);
      }
      setRoleLoading(false);
    };

    loadRole();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, fetchUserRole]);

  const loading = authLoading || roleLoading;

  const signOut = async () => {
    setAuthLoading(true);
    setRoleLoading(false);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setRoleLoading(false);
    setAuthLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
