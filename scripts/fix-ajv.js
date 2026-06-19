const fs = require('fs');
const path = require('path');

const codegenDir = path.join(__dirname, '..', 'node_modules', 'ajv', 'dist', 'compile', 'codegen');
const codegenFile = codegenDir + '.js';

if (fs.existsSync(codegenDir) && !fs.existsSync(codegenFile)) {
  fs.writeFileSync(
    codegenFile,
    'module.exports = require("./codegen/index.js");\n',
    'utf-8'
  );
  console.log('[fix-ajv] Created forwarder: ajv/dist/compile/codegen.js -> codegen/index.js');
}
