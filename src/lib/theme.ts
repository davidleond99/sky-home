/**
 * Tema claro/oscuro: clase `.dark` en <html>. Sin preferencia guardada sigue
 * al sistema. Este script corre en el <head> antes de pintar (sin parpadeo).
 */
export const THEME_STORAGE_KEY = "theme";

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
