type Theme = "light" | "dark";

type ThemeToggleProps = {
  theme: Theme;
  onToggle: () => void;
};

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label="Toggle theme"
      onClick={onToggle}
    >
      <span className="theme-toggle-label">{theme === "light" ? "Light" : "Dark"}</span>
      <span className="theme-toggle-indicator" aria-hidden="true" />
    </button>
  );
}
