// Agente para integración de Katalon, Appsflyer y Google Analytics
const fs = require('fs');
const path = require('path');

module.exports.integrarHerramientas = async function integrarHerramientas() {
  console.log('Integrando Katalon, Appsflyer y Google Analytics...');
  // Ejemplo: insertar tags en index.html
  const indexPath = path.resolve(process.cwd(), '../public/index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    if (!html.includes('<!-- KATALON_TAG -->')) {
      html = html.replace(
        '</head>',
        '<!-- KATALON_TAG --><script src="https://cdn.katalon.com/agent.js"></script>\n</head>',
      );
    }
    if (!html.includes('<!-- APPSFLYER_TAG -->')) {
      html = html.replace(
        '</head>',
        '<!-- APPSFLYER_TAG --><script src="https://cdn.appsflyer.com/agent.js"></script>\n</head>',
      );
    }
    if (!html.includes('<!-- GA_TAG -->')) {
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
