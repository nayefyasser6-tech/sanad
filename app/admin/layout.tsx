"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // الإيميل الوحيد المسموح له بدخول لوحة التحكم
  const ADMIN_EMAIL = "nayefyaser6@gmail.com";

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email === ADMIN_EMAIL) {
        setIsAuthorized(true);
      } else {
        // طرد أي زائر أو مستخدم عادي إلى الصفحة الرئيسية
        router.push("/");
      }
      setLoading(false);
    };

    checkAdminAccess();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return <>{children}</>;
}