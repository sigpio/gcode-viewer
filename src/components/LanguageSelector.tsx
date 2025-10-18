import { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const currentLanguage =
    i18n.resolvedLanguage?.split('-')[0] ?? i18n.language?.split('-')[0] ?? 'en';

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    void i18n.changeLanguage(event.target.value);
  };

  return (
    <label className="flex items-center gap-2 text-sm text-slate-300">
      <span>{t('language.label')}</span>
      <select
        value={currentLanguage}
        onChange={handleChange}
        className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light"
      >
        <option value="en">{t('language.english')}</option>
        <option value="it">{t('language.italian')}</option>
      </select>
    </label>
  );
};

export default LanguageSelector;
