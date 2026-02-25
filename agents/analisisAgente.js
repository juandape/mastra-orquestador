// Agente para análisis independiente del proyecto React/React Native
const fs = require('fs');
const path = require('path');

module.exports.analizarProyecto = async function analizarProyecto() {
  console.log('Analizando estructura y dependencias del proyecto...');
  let resultado = {
    dependencias: [],
    devDependencies: [],
    carpetas: [],
    ejemplosSimilares: [],
  };
  try {
    // Buscar package.json en el directorio raíz
    const pkgPath = path.resolve(process.cwd(), '../package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      resultado.dependencias = Object.keys(pkg.dependencies || {});
      resultado.devDependencies = Object.keys(pkg.devDependencies || {});
      console.log('Nombre del proyecto:', pkg.name);
    }
    // Analizar estructura de carpetas típica
    const srcPath = path.resolve(process.cwd(), '../src');
    if (fs.existsSync(srcPath)) {
      resultado.carpetas = fs
        .readdirSync(srcPath)
        .filter((f) => fs.statSync(path.join(srcPath, f)).isDirectory());
    }
    // Buscar implementaciones similares
    const readline = require('readline');
    const userInput = await new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(
        'Describe brevemente la funcionalidad que quieres implementar: ',
        (answer) => {
          rl.close();
          resolve(answer);
        },
      );
    });
    // Buscar archivos JS/TS/JSX/TSX en src
    function buscarArchivos(dir, ext = ['.js', '.jsx', '.ts', '.tsx']) {
      let files = [];
      fs.readdirSync(dir).forEach((f) => {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory())
          files = files.concat(buscarArchivos(full, ext));
        else if (ext.includes(path.extname(f))) files.push(full);
      });
      return files;
    }
    let ejemplos = [];
    if (fs.existsSync(srcPath)) {
      const archivos = buscarArchivos(srcPath);
      archivos.forEach((file) => {
        const contenido = fs.readFileSync(file, 'utf8');
        if (contenido.toLowerCase().includes(userInput.toLowerCase())) {
          ejemplos.push({ archivo: file, fragmento: contenido.slice(0, 500) });
        }
      });
    }
    resultado.ejemplosSimilares = ejemplos;
    if (ejemplos.length) {
      console.log('Se encontraron implementaciones similares:');
      ejemplos.forEach((e) => {
        console.log(`Archivo: ${e.archivo}`);
        console.log('Fragmento:', e.fragmento.substring(0, 300), '...');
      });
    } else {
      console.log('No se encontraron implementaciones similares.');
    }
    // Guardar resultado para el mediador
    global.__analisisProyecto = resultado;
  } catch (e) {
    console.error('Error en análisis:', e.message);
  }
  console.log('Análisis completo.');
};
