"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Clears the "new feedback" dot a moment after the student opens the Feedback Corner. */
export default function MarkSeen() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(async () => {
      await fetch("/api/me/seen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ what: "feedback" }) });
      router.refresh();
    }, 2500);
    return () => clearTimeout(t);
  }, [router]);
  return null;
}
