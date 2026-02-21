"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Zap, Swords, Users, TreePine, Trophy, BarChart3, LogOut, ChevronDown, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/practice",  label: "Problems",  icon: Code2 },
  { href: "/duel",      label: "Duel",      icon: Swords,   badge: "1v1" },
  { href: "/pairlab",   label: "PairLab",   icon: Users },
  { href: "/dashboard", label: "Dev-Tree",  icon: TreePine },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="h-13 flex items-center px-5 gap-5 sticky top-0 z-50"
      style={{
        background: "rgba(13,15,20,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, var(--accent-green), var(--accent-blue))" }}
        >
          <Zap className="w-4 h-4 text-black" />
        </div>
        <span
          className="font-bold text-[15px] tracking-tight"
          style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}
        >
          Code<span style={{ color: "var(--accent-green)" }}>Arena</span>
        </span>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider"
          style={{ background: "var(--accent-blue-dim)", color: "var(--accent-blue)", border: "1px solid rgba(79,142,247,0.3)" }}
        >
          AI
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-0.5 overflow-x-auto">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all",
                active
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]"
              )}
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-md"
                  style={{ background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.2)" }}
                />
              )}
              <item.icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{item.label}</span>
              {item.badge && (
                <span
                  className="relative z-10 text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider"
                  style={{ background: "var(--accent-orange-dim)", color: "var(--accent-orange)" }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right */}
      <div className="ml-auto flex items-center gap-3">
        {session?.user ? (
          <>
            {/* Stats pills */}
            <div className="hidden sm:flex items-center gap-2">
              <span
                className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                style={{ background: "var(--accent-purple-dim)", color: "var(--accent-purple)", border: "1px solid rgba(155,108,247,0.25)" }}
              >
                ⚡ 1200
              </span>
              <span
                className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                style={{ background: "var(--accent-yellow-dim)", color: "var(--accent-yellow)", border: "1px solid rgba(245,200,66,0.25)" }}
              >
                ✦ 0 XP
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-full p-0.5 transition-all hover:ring-2 hover:ring-[var(--border-strong)]"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={30}
                    height={30}
                    className="rounded-full"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "var(--accent-blue-dim)", color: "var(--accent-blue)" }}
                  >
                    {session.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <ChevronDown className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
              </button>

              {open && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden animate-fade-in"
                  style={{
                    background: "var(--bg-overlay)",
                    border: "1px solid var(--border-default)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                  }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {session.user.name}
                    </p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {session.user.email}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> Profile
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-[13px] transition-colors hover:bg-[var(--accent-red-dim)]"
                    style={{ color: "var(--accent-red)" }}
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all hover:brightness-110"
            style={{ background: "var(--accent-green)", color: "#08090c" }}
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
