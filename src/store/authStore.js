import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";

// Import token refresh timer functions (dynamic import to avoid circular dependency)
let startTokenRefreshTimer, stopTokenRefreshTimer;
if (typeof window !== "undefined") {
  import("../lib/axios").then((module) => {
    startTokenRefreshTimer = module.startTokenRefreshTimer;
    stopTokenRefreshTimer = module.stopTokenRefreshTimer;
  });
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      token: null,
      refreshToken: null,
      hydrated: false,
      isAuthenticated: false,
      login: (userData, token, refresh, role) => {
        // Shared cookie for cross-subdomain auth
        if (typeof window !== "undefined") {
          const cookieData = { token, refreshToken: refresh, role };
          Cookies.set("axile_shared_auth", JSON.stringify(cookieData), { 
            domain: ".axile.ng", 
            expires: 7,
            secure: true,
            sameSite: 'Lax'
          });

          localStorage.removeItem("organizer-storage");
          localStorage.removeItem("Axile_pin_reminder_dismissed");

          const authData = {
            state: {
              user: userData,
              token,
              refreshToken: refresh,
              role,
              isAuthenticated: true,
              hydrated: true,
            },
            version: 0,
          };
          localStorage.setItem("auth-storage", JSON.stringify(authData));
        }

        set({
          user: userData,
          token,
          refreshToken: refresh,
          role,
          isAuthenticated: true,
        });

        if (startTokenRefreshTimer) {
          startTokenRefreshTimer();
        }
      },
      logout: () => {
        if (typeof window !== "undefined") {
          Cookies.remove("axile_shared_auth", { domain: ".axile.ng" });
        }

        if (stopTokenRefreshTimer) {
          stopTokenRefreshTimer();
        }

        set({
          user: null,
          role: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
      setHydrated: () => set({ hydrated: true }),
      setUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),
      
      // Sync state from shared cookie
      syncWithCookie: () => {
        if (typeof window === "undefined") return;
        
        // Don't overwrite if already have a token
        if (get().token) return;

        const shared = Cookies.get("axile_shared_auth");
        if (shared) {
          try {
            // Cookies.get() sometimes returns URI encoded string, decode if necessary
            const decoded = shared.startsWith("%") ? decodeURIComponent(shared) : shared;
            const parsed = JSON.parse(decoded);
            const { token, refreshToken, role } = parsed;
            
            if (token) {
              set({ 
                token, 
                refreshToken: refreshToken || null, 
                role: role || null, 
                isAuthenticated: true 
              });
              if (startTokenRefreshTimer) startTokenRefreshTimer();
              return true;
            }
          } catch (e) {
            console.warn("Auth sync parsing failed, trying raw string...", e);
            // Fallback: If it's just the token string
            if (shared && shared.length > 50) {
               set({ token: shared, isAuthenticated: true });
               return true;
            }
          }
        }
        return false;
      }
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state.setHydrated();
        // Check for shared cookie on hydration
        state.syncWithCookie();
      },
    }
  )
);

export default useAuthStore;
