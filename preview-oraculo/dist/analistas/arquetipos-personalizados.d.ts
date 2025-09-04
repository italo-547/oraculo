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
/**
 * Verifica se existe um arquétipo personalizado
 */
export declare function existeArquetipoPersonalizado(baseDir?: string): Promise<boolean>;
/**
 * Obtém o arquétipo oficial base para um arquétipo personalizado
 */
export declare function obterArquetipoOficial(
  arquetipoPersonalizado: ArquetipoPersonalizado,
): ArquetipoEstruturaDef | null;
/**
 * Gera sugestões de criação de arquétipo personalizado quando projeto é desconhecido
 */
export declare function gerarSugestaoArquetipoPersonalizado(projetoDesconhecido: {
  nome: string;
  estruturaDetectada: string[];
  arquivosRaiz: string[];
}): string;
/**
 * Cria um template de arquétipo personalizado baseado na estrutura atual do projeto
 */
export declare function criarTemplateArquetipoPersonalizado(
  nomeProjeto: string,
  estruturaDetectada: string[],
  arquivosRaiz: string[],
  arquetipoSugerido?: string,
): Omit<ArquetipoPersonalizado, 'metadata'>;
/**
 * Valida um arquétipo personalizado
 */
export declare function validarArquetipoPersonalizado(arquetipo: ArquetipoPersonalizado): {
  valido: boolean;
  erros: string[];
};
/**
 * Lista todos os arquétipos oficiais disponíveis
 */
export declare function listarArquetiposOficiais(): ArquetipoEstruturaDef[];
/**
 * Integra arquétipo personalizado com oficial para sugestões
 */
export declare function integrarArquetipos(
  personalizado: ArquetipoPersonalizado,
  oficial: ArquetipoEstruturaDef,
): ArquetipoEstruturaDef;
//# sourceMappingURL=arquetipos-personalizados.d.ts.map
