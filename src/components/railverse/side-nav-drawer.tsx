import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  UserPlus,
  LogIn,
  Ticket,
  ShieldCheck,
  X,
  TrainFront,
  LogOut,
  Compass,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/railverse/auth";
import { Button } from "@/components/ui/button";

export function SideNavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    {
      label: "Home Page",
      to: "/",
      icon: Home,
      description: "Return to Travia landing & express search",
    },
    {
      label: "Passenger Console",
      to: "/passenger",
      icon: Ticket,
      description: "Book tickets, track RAC & Boarding Pass",
    },
    {
      label: "Admin Console",
      to: "/admin",
      icon: ShieldCheck,
      description: "Fleet management & passenger charts",
    },
    {
      label: "Login",
      to: "/auth",
      search: { mode: "login" },
      icon: LogIn,
      description: "Access your saved passenger account",
    },
    {
      label: "Sign Up",
      to: "/auth",
      search: { mode: "signup" },
      icon: UserPlus,
      description: "Create a new Travia membership",
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Dark Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#0f1417]/80 backdrop-blur-md"
          />

          {/* Side Navigation Panel Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-[#0f1417] text-[#dfe3e7] border-r border-[#4cd7f6]/30 shadow-[0_0_40px_rgba(76,215,246,0.2)] flex flex-col justify-between p-6 overflow-y-auto"
          >
            <div>
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between border-b border-[#909097]/20 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4cd7f6] to-[#03b5d3] text-[#0f1417] flex items-center justify-center shadow-[0_0_15px_rgba(76,215,246,0.4)]">
                    <TrainFront className="size-6 font-bold" />
                  </div>
                  <div>
                    <span className="font-display text-2xl font-extrabold tracking-tighter text-[#4cd7f6] block drop-shadow-[0_0_10px_rgba(76,215,246,0.3)]">
                      TRAVIA
                    </span>
                    <span className="text-[10px] font-mono font-semibold tracking-[0.2em] text-[#909097] uppercase -mt-1 block">
                      PREMIUM RAIL
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full text-[#909097] hover:text-white hover:bg-[#171c1f]"
                >
                  <X className="size-5" />
                </Button>
              </div>

              {/* User Quick Account Badge */}
              {user ? (
                <div className="mt-5 glass-card rounded-xl p-3.5 border border-[#4cd7f6]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#4cd7f6]/20 text-[#4cd7f6] flex items-center justify-center font-bold text-sm">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{user.name}</p>
                      <p className="text-[10px] font-mono uppercase text-[#4cd7f6]">{user.role}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-bold px-2.5 h-8"
                    onClick={() => {
                      logout();
                      onClose();
                      navigate({ to: "/", replace: true });
                    }}
                  >
                    <LogOut className="size-3.5 mr-1" /> Exit
                  </Button>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-[#4cd7f6]/20 bg-[#171c1f]/80 p-3 flex items-center justify-between text-xs text-[#909097]">
                  <span className="flex items-center gap-1.5 text-[#4cd7f6] font-mono font-bold">
                    <Sparkles className="size-3.5" /> Guest Explorer
                  </span>
                  <span>Not logged in</span>
                </div>
              )}

              {/* Navigation Menu List */}
              <div className="mt-6 space-y-2">
                <span className="font-mono text-[11px] font-bold tracking-widest text-[#909097] uppercase px-1 block mb-3">
                  System Navigation
                </span>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      to={item.to as any}
                      search={item.search}
                      onClick={onClose}
                      className="group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-[#4cd7f6]/40 hover:bg-[#171c1f] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#4cd7f6]/10 text-[#4cd7f6] group-hover:bg-[#4cd7f6] group-hover:text-[#0f1417] flex items-center justify-center transition-colors">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-[#4cd7f6] transition-colors">
                            {item.label}
                          </p>
                          <p className="text-[11px] text-[#909097] font-medium">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-[#909097] group-hover:text-[#4cd7f6] group-hover:translate-x-1 transition-all" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Side Drawer Footer */}
            <div className="mt-8 pt-4 border-t border-[#909097]/20 text-center font-mono text-[11px] text-[#909097]">
              <div className="inline-flex items-center gap-1.5 text-[#4cd7f6] mb-1">
                <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse" />
                <span>TRAVIA HIGH-SPEED NETWORK ACTIVE</span>
              </div>
              <p className="text-[10px]">© 2026 TRAVIA · All Rights Reserved</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
