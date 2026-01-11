import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  children: React.ReactNode;
}

export function MobileNav({ isOpen, onToggle, children }: MobileNavProps) {
  return (
    <>
      {/* Mobile toggle button - positioned in top header area */}
      <div className="md:hidden fixed top-3 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggle(!isOpen)}
          className="bg-card border-border hover:bg-muted h-8 w-8 p-0"
        >
          {isOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => onToggle(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`md:hidden fixed left-0 top-0 h-screen w-64 bg-card border-r border-border z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } animate-slide-down`}
      >
        {children}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 bg-card border-r border-border h-screen overflow-y-auto">
        {children}
      </div>
    </>
  );
}
