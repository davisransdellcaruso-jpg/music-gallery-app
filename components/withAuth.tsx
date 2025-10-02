// components/withAuth.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function withAuth<P>(WrappedComponent: React.ComponentType<P>) {
  return function AuthWrapper(props: P) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
      const checkUser = async () => {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
          router.replace("/welcome"); // ✅ go to your login page
        } else {
          setUser(data.user);
        }
        setLoading(false);
      };

      checkUser();

      // ✅ listen for auth changes (logout, expiry, etc.)
      const { data: subscription } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!session?.user) {
            router.replace("/welcome");
          } else {
            setUser(session.user);
          }
        }
      );

      return () => {
        subscription?.subscription.unsubscribe();
      };
    }, [router]);

    if (loading) {
      return <div style={{ color: "white" }}>Checking authentication…</div>;
    }

    if (!user) {
      return null; // nothing until redirect happens
    }

    return <WrappedComponent {...props} />;
  };
}
