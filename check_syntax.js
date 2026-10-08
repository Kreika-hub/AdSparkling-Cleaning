const fs = require('fs');
try {
  const code = fs.readFileSync('assets/js/admin.js', 'utf8');
  new Function(code);
  console.log('JS_ADMIN_SYNTAX_OK');
} catch (e) {
  console.error('JS_ADMIN_SYNTAX_ERROR:', e.message);
  process.exit(1);
}
try {
  const code2 = fs.readFileSync('assets/js/app.js', 'utf8');
  new Function(code2);
  console.log('JS_APP_SYNTAX_OK');
} catch (e) {
  console.error('JS_APP_SYNTAX_ERROR:', e.message);
  process.exit(1);
}
