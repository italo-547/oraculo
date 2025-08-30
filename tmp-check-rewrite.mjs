import { reescreverImports } from "./dist/zeladores/util/imports.js";
const conteudo = "import { A } from '@/cli/utils/a.js';\nexport const ctrl=()=>A;\n";
const arquivoDe = 'src/pedido.controller.ts';
const arquivoPara = 'src/domains/pedido/controllers/pedido.controller.ts';
const out = reescreverImports(conteudo, arquivoDe, arquivoPara);
console.log(JSON.stringify(out, null, 2));
