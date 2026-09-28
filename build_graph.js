const { execSync } = require('child_process');

console.log('Generando mapa interactivo Graphify...');

let pythonExe = 'python';
try {
  execSync('python --version');
} catch (e) {
  try {
    execSync('py --version');
    pythonExe = 'py';
  } catch (e2) {
    pythonExe = 'C:\\Users\\HP\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
  }
}

try {
  const result = execSync(`${pythonExe} run_graphify.py`, { encoding: 'utf8' });
  console.log(result);
  console.log('\n✅ ¡Grafo de conocimiento generado exitosamente!');
} catch (err) {
  console.error('Error al ejecutar:', err.stdout || err.message);
}
