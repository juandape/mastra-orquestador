// Agente para integración de Katalon, Appsflyer y Google Analytics
const fs = require('fs');
const path = require('path');

const analisisAgente = require('./analisisAgente');

module.exports.integrarHerramientas = async function integrarHerramientas() {
  console.log('Integrando Katalon, Appsflyer y Google Analytics...');
  // Consultar al agente de análisis si ya existen implementaciones
  if (!global.__analisisProyecto) {
    await analisisAgente.analizarProyecto();
  }
  const ejemplos = global.__analisisProyecto?.ejemplosSimilares || [];
  const indexPath = path.resolve(process.cwd(), '../public/index.html');
  let html = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
  // Validar si ya existen implementaciones
  let katalonExiste =
    ejemplos.some((e) => e.fragmento.includes('katalon')) ||
    html.includes('<!-- KATALON_TAG -->');
  let appsflyerExiste =
    ejemplos.some((e) => e.fragmento.includes('appsflyer')) ||
    html.includes('<!-- APPSFLYER_TAG -->');
  let gaExiste =
    ejemplos.some(
      (e) =>
        e.fragmento.includes('gtag') ||
        e.fragmento.includes('google-analytics'),
    ) || html.includes('<!-- GA_TAG -->');
  if (fs.existsSync(indexPath)) {
    if (!katalonExiste) {
      html = html.replace(
        '</head>',
        '<!-- KATALON_TAG --><script src="https://cdn.katalon.com/agent.js"></script>\n</head>',
      );
    }
    if (!appsflyerExiste) {
      html = html.replace(
        '</head>',
        '<!-- APPSFLYER_TAG --><script src="https://cdn.appsflyer.com/agent.js"></script>\n</head>',
      );
    }
    if (!gaExiste) {
      html = html.replace(
        '</head>',
        `<!-- GA_TAG -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
</head>`,
      );
    }
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('Tags insertados en public/index.html');
  } else {
    console.log('No se encontró public/index.html para insertar tags.');
  }
  console.log('Integraciones completadas.');
};
