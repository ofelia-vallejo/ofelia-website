/* ════════════════════════════════════════════════════════════════
   Ofelia Vallejo · Configuración de analítica
   ────────────────────────────────────────────────────────────────
   ÚNICO archivo que debes editar para conectar tus cuentas de Google.
   Reemplaza los placeholders por tus IDs reales (ver GUIA-ANALYTICS.md).

   Mientras los IDs sigan con "XXXX", la analítica queda en modo inerte:
   no carga GTM ni envía datos, y el sitio funciona con normalidad.
   ════════════════════════════════════════════════════════════════ */
window.OV_ANALYTICS = {
  // Contenedor de Google Tag Manager. Formato: 'GTM-XXXXXXX'
  GTM_ID: 'GTM-XXXXXXX',

  // ID de medición de GA4. Formato: 'G-XXXXXXXXXX'
  // Informativo: el tag de GA4 se CONFIGURA DENTRO de GTM, no aquí.
  GA4_ID: 'G-XXXXXXXXXX',

  // ID de Google Ads para conversiones/remarketing (fase posterior).
  // Formato: 'AW-XXXXXXXXX'. Déjalo vacío hasta activar Ads.
  ADS_ID: '',

  // Moneda de la tienda (mercado europeo).
  CURRENCY: 'CHF',

  // Pon en true para ver logs de cada evento en la consola del navegador.
  DEBUG: false
};
