"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
}

export function SearchBar({ value, onChange, visible }: SearchBarProps) {
  return (
    <div
      className={`mx-auto w-full max-w-md transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <Input
          type="text"
          placeholder="Search exoplanets..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/30 focus-visible:border-white/20 focus-visible:ring-white/10"
        />
      </div>
    </div>
  );
}
