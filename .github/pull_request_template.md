# Oráculo – Template de Pull Request

Descreva brevemente o que foi alterado e o porquê.

## Checklist de Compliance

- [ ] Originalidade: solução autoral, sem cópia literal de código público (blogs, SO, repositórios).
- [ ] Checagem de correspondência: verifiquei similaridade com código público; quando houve risco, reescrevi.
- [ ] Licenças: auditoria passou sem copyleft (rodar `node scripts/auditar-licencas.mjs --fail-on-copyleft`).
- [ ] Segurança: sem segredos em código/commits/logs; entradas validadas; padrões seguros por defeito.
- [ ] Qualidade: testes incluídos/atualizados e passando; lint/format aplicados.
- [ ] Documentação: inclui o aviso de “Proveniência e Autoria” nos .md relevantes.
- [ ] Varredura de .md: `node scripts/scan-markdown.mjs` sem pendências.
- [ ] Referências: somente links para documentação oficial (se houver), colocados na descrição do PR.

## Impacto

- [ ] Somente docs
- [ ] Código + docs
- [ ] Infra/CI

## Notas de risco (se aplicável)

- Autenticação/Autorização:
- Criptografia/Segredos:
- Superfícies de rede/Execução de comandos:
