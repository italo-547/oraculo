/**
 * Sistema de Arquétipos Personalizados do Oráculo
 *
 * Permite que usuários criem arquétipos personalizados para seus projetos,
 * mantendo compatibilidade com arquétipos oficiais e oferecendo sugestões
 * de melhores práticas baseadas na personalização do usuário.
 */
import type { ArquetipoPersonalizado, ArquetipoEstruturaDef } from '../tipos/tipos.js';
/**
 * Carrega o arquétipo personalizado do projeto atual
 */
<<<<<<< HEAD
export declare function carregarArquetipoPersonalizado(baseDir?: string): Promise<ArquetipoPersonalizado | null>;
/**
 * Salva um arquétipo personalizado
 */
export declare function salvarArquetipoPersonalizado(arquetipo: Omit<ArquetipoPersonalizado, 'metadata'>, baseDir?: string): Promise<void>;
=======
export declare function carregarArquetipoPersonalizado(
  baseDir?: string,
): Promise<ArquetipoPersonalizado | null>;
/**
 * Salva um arquétipo personalizado
 */
export declare function salvarArquetipoPersonalizado(
  arquetipo: Omit<ArquetipoPersonalizado, 'metadata'>,
  baseDir?: string,
): Promise<void>;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
/**
 * Verifica se existe um arquétipo personalizado
 */
export declare function existeArquetipoPersonalizado(baseDir?: string): Promise<boolean>;
/**
 * Obtém o arquétipo oficial base para um arquétipo personalizado
 */
<<<<<<< HEAD
export declare function obterArquetipoOficial(arquetipoPersonalizado: ArquetipoPersonalizado): ArquetipoEstruturaDef | null;
=======
export declare function obterArquetipoOficial(
  arquetipoPersonalizado: ArquetipoPersonalizado,
): ArquetipoEstruturaDef | null;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
/**
 * Gera sugestões de criação de arquétipo personalizado quando projeto é desconhecido
 */
export declare function gerarSugestaoArquetipoPersonalizado(projetoDesconhecido: {
<<<<<<< HEAD
    nome: string;
    estruturaDetectada: string[];
    arquivosRaiz: string[];
=======
  nome: string;
  estruturaDetectada: string[];
  arquivosRaiz: string[];
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
}): string;
/**
 * Cria um template de arquétipo personalizado baseado na estrutura atual do projeto
 */
<<<<<<< HEAD
export declare function criarTemplateArquetipoPersonalizado(nomeProjeto: string, estruturaDetectada: string[], arquivosRaiz: string[], arquetipoSugerido?: string): Omit<ArquetipoPersonalizado, 'metadata'>;
=======
export declare function criarTemplateArquetipoPersonalizado(
  nomeProjeto: string,
  estruturaDetectada: string[],
  arquivosRaiz: string[],
  arquetipoSugerido?: string,
): Omit<ArquetipoPersonalizado, 'metadata'>;
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
/**
 * Valida um arquétipo personalizado
 */
export declare function validarArquetipoPersonalizado(arquetipo: ArquetipoPersonalizado): {
<<<<<<< HEAD
    valido: boolean;
    erros: string[];
=======
  valido: boolean;
  erros: string[];
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
};
/**
 * Lista todos os arquétipos oficiais disponíveis
 */
export declare function listarArquetiposOficiais(): ArquetipoEstruturaDef[];
/**
 * Integra arquétipo personalizado com oficial para sugestões
 */
<<<<<<< HEAD
export declare function integrarArquetipos(personalizado: ArquetipoPersonalizado, oficial: ArquetipoEstruturaDef): ArquetipoEstruturaDef;
//# sourceMappingURL=arquetipos-personalizados.d.ts.map
=======
export declare function integrarArquetipos(
  personalizado: ArquetipoPersonalizado,
  oficial: ArquetipoEstruturaDef,
): ArquetipoEstruturaDef;
//# sourceMappingURL=arquetipos-personalizados.d.ts.map
>>>>>>> 143fdc685b941d444a171bd725a9366d38196e85
