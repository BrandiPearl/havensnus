export const AGE_COOKIE = "hs_age_ok";
export const AGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
/** Set on <html> before paint when the visitor has already confirmed their age. */
export const AGE_ATTR = "data-age-ok";

/**
 * Runs inline in <head>, so pages can be cached for everyone while
 * returning visitors still never see the overlay flash.
 */
export const AGE_GATE_SCRIPT = `try{if(document.cookie.indexOf("${AGE_COOKIE}=1")>-1)document.documentElement.setAttribute("${AGE_ATTR}","")}catch(e){}`;

export function isAgeVerified() {
  return typeof document !== "undefined" && document.documentElement.hasAttribute(AGE_ATTR);
}
