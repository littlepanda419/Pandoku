import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhTW from "./zh-TW";
import en from "./en";

// 支援的語言代碼
const SUPPORTED_LANGS = ["zh-TW", "en"];

// 依 localStorage 記憶的使用者偏好決定初始語言，預設繁體中文
const savedLang = localStorage.getItem("language");
const initLang: string = SUPPORTED_LANGS.includes(savedLang ?? "")
  ? savedLang!
  : "zh-TW";

i18n.use(initReactI18next).init({
  resources: {
    "zh-TW": zhTW,
    en: en,
  },
  lng: initLang,
  fallbackLng: "zh-TW",
  interpolation: {
    // React 已做安全跳脫，不需 i18next 再次跳脫
    escapeValue: false,
  },
});

export default i18n;
