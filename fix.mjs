import fs from 'fs';
import { globSync } from 'glob';

const files = globSync('functions/**/*.ts');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import type \{ PagesFunction \} from '@cloudflare\/workers-types';\n/g, '');
  content = content.replace(/: PagesFunction<Env>/g, '');
  content = content.replace(/= async \(context\)/g, '= async (context: any)');
  content = content.replace(/getHeaders = \(request: Request/g, 'getHeaders = (request: any');
  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
}
