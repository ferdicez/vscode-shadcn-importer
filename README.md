# shadcn/ui Importer

Extensão de VS Code que instala componentes do [shadcn/ui](https://ui.shadcn.com/docs/components) direto no seu projeto, sem precisar abrir o site, copiar comando e colar no terminal manualmente.

Você abre um menu dentro do VS Code, navega pelos componentes disponíveis, vê o código antes de decidir, e confirma a instalação com um clique.

## Em que situação essa extensão serve

Essa extensão é útil se você:

- Trabalha com **React** e usa (ou pretende usar) [shadcn/ui](https://ui.shadcn.com/) como base de componentes de interface;
- Já tem, ou vai criar, um projeto com **Tailwind CSS** configurado (Next.js, Vite, etc — qualquer setup que o shadcn suporte);
- Quer parar de alternar entre o navegador (pra achar o nome do componente) e o terminal (pra rodar o comando de instalação).

Ela **não substitui** o shadcn/ui nem reimplementa os componentes — ela só automatiza o fluxo de descobrir e rodar `npx shadcn add <componente>`, que é o comando oficial deles.

## O que ela faz, na prática

1. Mostra a lista de todos os componentes de UI disponíveis no registro oficial do shadcn (busca em tempo real, direto do site deles — a lista está sempre atualizada).
2. Deixa você ver o **código-fonte real** do componente antes de instalar, mais um link "Visualizar no site" que abre a página de documentação oficial (com a demonstração visual) no seu navegador.
3. Só instala depois que você confirmar, clicando em "Sim, instalar".
4. Roda o comando oficial (`npx shadcn@latest add <componente>`) no terminal integrado do VS Code — você vê rodando, mas não precisa digitar nada.
5. Depois de instalado, oferece criar um arquivo de exemplo de uso do componente (a "vitrine"), numa pasta que você configura.
6. Se o projeto ainda não tiver o shadcn configurado (falta o arquivo `components.json`), ela detecta isso e oferece rodar a inicialização (`npx shadcn init`) por você.

## O que precisa estar instalado

- **[VS Code](https://code.visualstudio.com/)**
- **[Node.js](https://nodejs.org/)** (inclui o `npm`/`npx`, que é quem realmente baixa e instala os componentes) — qualquer versão recente (18+)
- Um **projeto com Tailwind CSS** já configurado (Next.js, Vite + React, etc). Se o projeto nunca usou shadcn, a extensão te ajuda a inicializar.

Não precisa instalar nada do shadcn/ui manualmente antes — o `npx` baixa o que for preciso na hora.

## Como instalar a extensão

Por enquanto esta extensão **não está publicada na Marketplace do VS Code** — ela roda em modo de desenvolvimento, direto do código-fonte. Veja como rodar:

1. Baixe este repositório (`git clone` ou baixar o .zip pelo botão verde "Code" do GitHub).
2. Abra a pasta baixada no VS Code — **importante**: abra especificamente esta pasta (a que tem o `package.json`), não uma pasta maior que a contenha.
3. Abra o terminal integrado do VS Code (`Ctrl+`` `) e rode:
   ```bash
   npm install
   ```
4. Aperte **F5** (ou vá em "Run and Debug" → "Run Extension").
5. Isso abre uma **segunda janela do VS Code**, com "[Extension Development Host]" no título — é nessa janela que a extensão está ativa.
6. Nessa janela nova, abra a pasta do **seu projeto** (o projeto React/Next.js onde você quer instalar componentes shadcn).

Enquanto a janela de desenvolvimento estiver aberta, a extensão funciona normalmente nela. Se fechar, é só repetir o F5 quando quiser usar de novo.

## Como usar

Depois de abrir seu projeto na janela de desenvolvimento, você tem três jeitos de acessar a extensão:

- **Barra de status**: clique no item `📦 shadcn` no rodapé da janela do VS Code. Abre um menu com as duas opções abaixo.
- **Paleta de comandos** (`Ctrl+Shift+P` no Windows/Linux, `Cmd+Shift+P` no Mac):
  - `Shadcn: Add Component` — busca rápida por nome, instala direto ao confirmar. Ideal quando você já sabe exatamente o componente que quer.
  - `Shadcn: Open Component Browser` — abre um painel lateral onde você navega pela lista, vê o código do componente e o link para a documentação oficial, e só instala depois de clicar em "Sim, instalar".

### Depois de instalar um componente

A extensão pergunta se você quer criar um arquivo de exemplo de uso (a "vitrine") daquele componente. Se disser que sim, ela cria um arquivo `.tsx` simples, já importando e usando o componente, numa pasta configurável (por padrão, `components/showcase/`).

## Configurações

Vá em **Configurações do VS Code** (`Ctrl+,`) e busque por "shadcn Importer", ou edite direto o `settings.json`:

| Configuração | Padrão | O que faz |
|---|---|---|
| `shadcnImporter.showcasePath` | `components/showcase` | Pasta (relativa à raiz do projeto) onde o arquivo de exemplo de uso é criado. |
| `shadcnImporter.autoShowcase` | `ask` | O que fazer após instalar um componente: `ask` (pergunta toda vez), `always` (sempre cria a vitrine sem perguntar) ou `never` (nunca cria). |

## Perguntas frequentes

**A extensão baixa e roda código de terceiros?**
Ela busca a lista de componentes e o código-fonte para preview direto do site oficial do shadcn/ui (`ui.shadcn.com`), e usa o comando oficial deles (`npx shadcn@latest add`) para instalar — a mesma coisa que você faria manualmente, só que com menos passos.

**Preciso saber qual "base" (Radix, Base UI, React Aria) escolher?**
Isso é perguntado pelo próprio `shadcn init` na primeira vez que você inicializa um projeto — não é algo desta extensão. Se não tiver certeza, a opção recomendada pelo próprio shadcn no momento da inicialização é uma escolha segura.

**Funciona em qualquer framework?**
Funciona em qualquer projeto que o shadcn/ui suporte oficialmente (Next.js, Vite, Remix, Astro, Laravel, etc), desde que tenha Tailwind CSS configurado.

## Estrutura do código

```
src/
├── extension.ts   # Comandos, barra de status, orquestração geral
├── registry.ts     # Busca a lista de componentes e o código-fonte (preview) no site do shadcn
├── install.ts       # Roda "npx shadcn add" no terminal integrado
├── showcase.ts    # Gera o arquivo de exemplo de uso do componente
└── panel.ts         # Painel lateral (webview) com busca, preview e confirmação
```

## Licença

MIT
