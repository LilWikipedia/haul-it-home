import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
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
  // Start with loading=true; we resolve it only after BOTH auth and role are settled
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"user" | "hauler" | null>(null);

  // Use a ref to cancel in-flight role fetches when auth state changes
  const roleFetchAbortRef = useRef<{ cancelled: boolean } | null>(null);

  const fetchUserRole = useCallback(async (userId: string): Promise<"user" | "hauler" | null> => {
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

    const resolveSession = async (nextSession: Session | null) => {
      if (!mounted) return;

      // Cancel any previous in-flight role fetch
      if (roleFetchAbortRef.current) {
        roleFetchAbortRef.current.cancelled = true;
      }

      if (!nextSession?.user) {
        // No user — clear everything and stop loading in one go
        setSession(null);
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      // We have a user — fetch their role before clearing the loading state
      // so we never flash to /onboarding on a hard reload
      const abort = { cancelled: false };
      roleFetchAbortRef.current = abort;

      setSession(nextSession);
      setUser(nextSession.user);
      // Keep loading=true while we fetch the role

      const role = await fetchUserRole(nextSession.user.id);

      if (!mounted || abort.cancelled) return;

      setUserRole(role);
      setLoading(false);
    };

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        resolveSession(nextSession);
      }
    );

    // Resolve the initial session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveSession(session);
    });

    return () => {
      mounted = false;
      if (roleFetchAbortRef.current) {
        roleFetchAbortRef.current.cancelled = true;
      }
      subscription.unsubscribe();
    };
  // fetchUserRole is stable (useCallback with no deps)
  }, [fetchUserRole]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
