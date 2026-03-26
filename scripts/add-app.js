#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
  console.log('🚀 UnifiedVIP 新增APP向导\n');
  
  const id = await question('1. APP ID（小写英文）: ');
  const name = await question('2. 显示名称: ');
  const domain = await question('3. 主域名: ');
  const apiPath = await question('4. API路径: ');
  
  console.log('\n5. 要解锁的字段（回车结束）:');
  const fields = {};
  
  while (true) {
    const key = await question('   字段路径: ');
    if (!key) break;
    const val = await question('   字段值: ');
    fields[key] = val;
  }

  const appsPath = path.join(__dirname, '../src/apps/_index.js');
  let content = fs.readFileSync(appsPath, 'utf8');
  
  const insertMarker = '// ==========================================';
  const newApp = `
  // ${name}
  ${id}: {
    name: '${name}',
    urlPattern: '^https?:\\\\/\\\\/${domain.replace(/\./g, '\\\\.')}${apiPath.replace(/\//g, '\\\\/')}',
    fields: ${JSON.stringify(fields, null, 4).replace(/"/g, "'").replace(/^/gm, '    ')}
  },`;

  content = content.replace(insertMarker, newApp + '\n' + insertMarker);
  fs.writeFileSync(appsPath, content);
  
  console.log(`\n✅ APP "${name}" 添加成功！`);
  console.log('📝 运行: node scripts/build.js');
  
  rl.close();
}

main();
