# Política de Proveniência, Autoria e Licenciamento

Este projeto é licenciado sob MIT. Salvo indicação em contrário, todo o conteúdo do repositório (código e documentação) está sob a mesma licença.

Nada nesta documentação constitui cessão ou transferência dos direitos morais/autorais dos autores. Contribuições são aceitas sob os termos do arquivo LICENSE deste repositório.

## Diretrizes

- Evite inserir conteúdo de terceiros sem licença compatível. Não copie trechos longos (>20 linhas) de uma única fonte pública.
- Quando necessário referenciar material externo (ex.: documentação oficial), reescreva com suas palavras e cite apenas o link (no PR), não cole o texto integral.
- Não “vendorize” conteúdo de terceiros em documentação. Prefira links.
- Para código, prefira dependências com licenças permissivas (MIT/Apache-2.0/BSD). Evite GPL/AGPL/LGPL salvo justificativa explícita em PR.

### Notas sobre o scanner de documentação (termos de risco)

- O pipeline possui um scanner que marca termos sensíveis (ex.: “GPL/AGPL/LGPL”, “cessão de direitos”, “All rights reserved”).
- Documentos de política/referência já são isentos automaticamente (whitelist).
- Quando for necessário citar termos sensíveis por referência em qualquer outro documento, inclua o marcador:

  <!-- RISCO_REFERENCIA_OK -->

  Isso sinaliza citação legítima, evitando falha no modo estrito do scanner.

## Aviso a ser incluído nos principais documentos

Inclua o bloco abaixo no topo de READMEs e documentos-chave:

> Proveniência e Autoria: Este documento integra o projeto Oráculo (licença MIT). Nada aqui implica cessão de direitos morais/autorais. Conteúdos de terceiros não licenciados de forma compatível não devem ser incluídos. Referências a materiais externos devem ser linkadas e reescritas com palavras próprias.
