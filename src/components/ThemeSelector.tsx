import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type ThemeMode = 'light' | 'dark' | 'system';

const ThemeSelector = () => {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem('theme') as ThemeMode | null) ?? 'system';
  });

  const applyTheme = useCallback((mode: ThemeMode) => {
    const html = document.documentElement;
    const isDarkSystemPreference =
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (mode === 'dark') {
      html.classList.add('dark');
    } else if (mode === 'light') {
      html.classList.remove('dark');
    } else {
      if (isDarkSystemPreference) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [applyTheme, theme]);

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value as ThemeMode;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  useEffect(() => {
    if (theme !== 'system') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      applyTheme('system');
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme, applyTheme]);

  return (
    <label className="flex items-center gap-2 text-sm text-mocha-300">
      <span>{t('theme.label')}</span>
      <select
        value={theme}
        onChange={handleThemeChange}
        className="rounded-md border border-mocha-700 bg-mocha-800 px-2 py-1 text-sm text-mocha-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <option value="light">{t('theme.light')}</option>
        <option value="dark">{t('theme.dark')}</option>
        <option value="system">{t('theme.system')}</option>
      </select>
    </label>
  );
};

export default ThemeSelector;
