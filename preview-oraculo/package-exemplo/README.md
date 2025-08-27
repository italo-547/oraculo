# package-exemplo

Este pacote é um wrapper mínimo que referencia o `preview-oraculo` local via `file:` para facilitar a instalação e execução do preview sem mover o `package.json` principal.

Como usar:

```powershell
# instalar dependências do preview (irá instalar as dependencies listadas em preview-oraculo/package.json)
npm run install:preview

# construir o preview
npm run build:preview

# iniciar o preview
npm run start:preview
```

Alternativamente, para instalar tudo localmente (incluindo o link file:):

```powershell
npm install
```
