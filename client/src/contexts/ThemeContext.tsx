import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeContextType {
    isDark: boolean;
    toggleDark: () => void;
    setDark: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem("cfm_dark_mode");
        if (saved !== null) {
            return saved === "true";
        }
        // Check system preference
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    useEffect(() => {
        // Apply theme to document
        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        // Save to localStorage
        localStorage.setItem("cfm_dark_mode", String(isDark));
    }, [isDark]);

    const toggleDark = () => {
        setIsDark((prev) => !prev);
    };

    const setDark = (value: boolean) => {
        setIsDark(value);
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleDark, setDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
