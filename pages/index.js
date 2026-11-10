import { useEffect } from "react";
import { useRouter } from "next/router";

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    // Keep ?src= (and anything else) so bio links to the home page still count
    router.replace({ pathname: "/gallery", query: router.query });
  }, [router, router.isReady]);

  return null;
}
