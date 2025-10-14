
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      aria-label="Toggle dark mode"
      className="rounded-full p-2 transition-all hover:bg-accent/10 flex items-center text-foreground hover:scale-110 active:scale-95"
      onClick={toggleTheme}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-accent transition-transform" />
      ) : (
        <Moon className="w-5 h-5 text-primary transition-transform" />
      )}
    </button>
  );
}
