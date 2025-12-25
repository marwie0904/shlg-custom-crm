"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Calendar,
  Users,
  Target,
  Receipt,
  GraduationCap,
  CheckSquare,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Conversations", href: "/conversations", icon: MessageSquare },
  { name: "Intake", href: "/intake", icon: FileText },
  { name: "Calendars", href: "/calendars", icon: Calendar },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Opportunities", href: "/opportunities", icon: Target },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Workshops", href: "/workshops", icon: GraduationCap },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col h-screen bg-white border-r border-gray-200 text-gray-700 transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image
              src="/shlf-logo.webp"
              alt="Safe Harbor Law Firm"
              fill
              className="object-contain"
            />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm leading-tight text-gray-900">
              Safe Harbor Law Firm
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-gray-100 text-brand font-medium"
                      : "hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );

              return (
                <li key={item.name}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 p-2 space-y-1">
          {collapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-center text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Profile
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-center text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Logout
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:bg-gray-50"
              >
                <User className="w-5 h-5 mr-3" />
                Profile
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-20 -right-3 bg-white border border-gray-200 text-gray-500 rounded-full p-1 shadow-sm hover:bg-gray-50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>
    </TooltipProvider>
  );
}
