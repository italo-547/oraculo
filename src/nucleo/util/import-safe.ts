// SPDX-License-Identifier: MIT
import { config } from '../constelacao/cosmos.js';
import { resolverPluginSeguro } from '../constelacao/seguranca.js';

export async function importarModuloSeguro(baseDir: string, pluginRel: string) {
  if (config.SAFE_MODE && !config.ALLOW_PLUGINS) {
    throw new Error(
      'Carregamento de plugins desabilitado em SAFE_MODE. Defina ORACULO_ALLOW_PLUGINS=1 para permitir.',
    );
  }
  const resolvido = resolverPluginSeguro(baseDir, pluginRel);
  if (resolvido.erro) throw new Error(`Plugin bloqueado: ${resolvido.erro}`);
  if (!resolvido.caminho) throw new Error('Caminho de plugin não resolvido');
  // permite que o chamador capture exceções do plugin
  return import(resolvido.caminho);
}
