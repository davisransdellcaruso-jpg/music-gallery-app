import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

export default function withAuth<P>(WrappedComponent: React.ComponentType<P>) {
  return function AuthWrapper(props: P) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
      const checkUser = async () => {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
          router.replace("/"); // redirect to welcome/login
        } else {
          setUser(data.user);
        }
        setLoading(false);
      };

      checkUser();
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
