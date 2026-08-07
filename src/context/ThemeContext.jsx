import { useTheme } from "../pages/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} style={{ background: "none", border: "none", cursor: "pointer" }}>
      {theme === "dark" ? <Sun size={20} color="#fff" /> : <Moon size={20} color="#000" />}
    </button>
  );
}