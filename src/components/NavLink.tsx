
import React, { ReactElement } from "react";
import { Link } from "react-router-dom";

interface NavLinkProps {
  to: string;
  icon: ReactElement;
  label: string;
  isActive: boolean;
}

export const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, isActive }) => {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-3 rounded-md px-3 py-2 transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span className="text-sm font-medium truncate">{label}</span>
    </Link>
  );
};
