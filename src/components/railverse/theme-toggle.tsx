import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/railverse/theme-context";
import { Button } from "@/components/ui/button";

export function ThemeToggle({
  className = "",
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="outline"
      size={showLabel ? "sm" : "icon"}
      onClick={toggleTheme}
      className={`rounded-xl border-[#4cd7f6]/30 dark:border-[#4cd7f6]/30 bg-card/80 text-foreground hover:bg-[#4cd7f6]/10 transition-all duration-200 shadow-sm ${className}`}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme mode"
    >
      {theme === "dark" ? (
        <>
          <Sun className="size-4 text-amber-400" />
          {showLabel && <span className="ml-2 font-mono text-xs font-bold">Light Mode</span>}
        </>
      ) : (
        <>
          <Moon className="size-4 text-sky-600" />
          {showLabel && <span className="ml-2 font-mono text-xs font-bold">Dark Mode</span>}
        </>
      )}
    </Button>
  );
}
