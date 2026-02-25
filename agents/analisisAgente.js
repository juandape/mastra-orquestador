// Agente para análisis independiente del proyecto React/React Native
const fs = require('fs');
const path = require('path');

module.exports.analizarProyecto = async function analizarProyecto() {
  console.log('Analizando estructura y dependencias del proyecto...');
  try {
    // Buscar package.json en el directorio raíz
    const pkgPath = path.resolve(process.cwd(), '../package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      console.log('Nombre del proyecto:', pkg.name);
      console.log('Dependencias:', Object.keys(pkg.dependencies || {}));
      console.log('DevDependencies:', Object.keys(pkg.devDependencies || {}));
    } else {
      console.log('No se encontró package.json en el proyecto principal.');
    }
    // Analizar estructura de carpetas típica
    const srcPath = path.resolve(process.cwd(), '../src');
    if (fs.existsSync(srcPath)) {
      const carpetas = fs.readdirSync(srcPath).filter(f => fs.statSync(path.join(srcPath, f)).isDirectory());
      console.log('Carpetas en src:', carpetas);
    } else {
      console.log('No se encontró carpeta src.');
    }
  } catch (e) {
    console.error('Error en análisis:', e.message);
  }
  console.log('Análisis completo.');
};
