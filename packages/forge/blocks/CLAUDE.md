# CLAUDE.md

Este arquivo fornece orientação ao Claude Code (claude.ai/code) ao trabalhar com o código deste repositório.

## Escopo

Este arquivo cobre os quatro pacotes específicos da TecPet neste diretório: `tecpet`, `tecpet-ai`,
`tecpet-gateway` e o `tecpet-sdk` embutido. Eles ficam dentro do fork do Typebot (`botflow`,
Turborepo + Bun, Node 22), em `packages/forge/blocks/`. Os três primeiros são **blocos do Forge** —
blocos de integração customizados do Typebot que expõem ações para o builder/viewer do chatbot.
O `tecpet-sdk` é o cliente TypeScript publicado (`@tec.pet/tecpet-sdk`) que o bloco `tecpet` consome.

Trabalhe a partir da raiz do repositório com `bun` (o monorepo é um workspace Bun/Turborepo); estes
pacotes não têm scripts de dev próprios por pasta.

## Comandos

```bash
# A partir da raiz do repositório botflow:
bun install
bun dev                         # builder + viewer (turbo) — os blocos recarregam a quente aqui
bun run build
bun run format-and-lint         # biome (verificação)
bun run format-and-lint:fix     # biome (correção automática) — a CLI do Forge roda isto após o scaffold

# Criar um NOVO bloco (não escreva o boilerplate na mão):
bun run create-new-block        # = cd packages/forge/cli && bun start
```

Os pacotes de bloco (`@typebot.io/tecpet-block`, `-ai-block`, `-gateway-block`) são `private`,
`type: module`, distribuem os `src/*.ts` crus via `exports` (sem etapa de build) e são consumidos pelo
workspace como `workspace:*`. O `tecpet-sdk` é a exceção — ele compila com `tsc` (`npm run build`
dentro de `tecpet-sdk/`, emite para `dist/`) e é o único com testes (`jest`).

## Anatomia de um bloco (o contrato que todo bloco segue)

Cada pasta de bloco tem o mesmo formato de cinco arquivos, e **todos os cinco precisam ficar em sincronia**
ao adicionar ou renomear uma ação:

- `index.ts` — `createBlock({ id, name, tags, LightLogo, auth, actions: [...] })`. O `id` precisa ser
  único e também é listado no registro do repositório (veja abaixo). Importa cada ação e a coloca em
  `actions`.
- `auth.ts` — `createAuth({ type: "encryptedCredentials", schema: option.object({ baseUrl, apiKey }) })`.
  O `baseUrl` tem valor padrão vindo de uma constante e remove a barra final via `.transform()`.
- `constants.ts` — a URL base padrão mais o objeto compartilhado `baseOptions` (oculto).
- `schemas.ts` — **gerado, não editar** (`parseBlockSchema` / `parseBlockCredentials`).
- `handlers.ts` — o runtime. Cada ação é pareada com seu handler de servidor via
  `createActionHandler(action, { server })`, exportado como um array default.

### Definição da ação vs. handler (a separação central)

Uma "ação de bloco" é definida em duas metades que você precisa manter pareadas:

1. **Definição** (`createAction({ auth, baseOptions, name, options, getSetVariableIds })`) — declara
   a UI: campos de opção construídos com `option.string/number/object(...).layout({...})`, e
   `getSetVariableIds` listando quais variáveis do Typebot a ação escreve. Fica em `actions/.../*.ts`.
2. **Handler de servidor** — a função async que recebe `{ credentials, options, variables, logs }`,
   executa o trabalho e chama `variables.set([{ id, value }])` para gravar os resultados de volta.

Existem dois estilos de ligação neste código — siga o que já é usado no bloco que você está editando:
- O **`tecpet`** coloca o handler junto da definição (ex.: `getClient` + `GetClientHandler` no mesmo
  arquivo), e o `handlers.ts` apenas importa e pareia ambos. Ações internas/parser/validação que fazem
  transformação pura de dados ficam em `actions/internal/`, `actions/parser/`, `actions/validations/`.
- O **`tecpet-ai`** e o **`tecpet-gateway`** definem os handlers inline dentro do `handlers.ts` e
  mantêm os arquivos de ação apenas com a definição.

`option.string.layout({ inputType: "variableDropdown" })` (ou `withVariableButton`) é como uma opção
se liga a uma variável do Typebot; o id da variável escolhida então flui por `getSetVariableIds` e
`variables.set(...)`.

### Registrando um bloco no workspace

Um bloco só fica ativo depois de registrado no pacote de repositório do Forge
(`packages/forge/repository/src/`). A CLI do Forge faz isso automaticamente no scaffold; para mudanças
manuais, atualize **os quatro**:
- `constants.ts` — id do bloco adicionado à lista de ids
- `definitions.ts` — `import { xBlock }` + entrada no mapa de definitions
- `handlers.ts` — `import xBlockHandlers from ".../handlers"` + entrada no mapa de handlers
- `repository/package.json` — dependência `workspace:*`

## Os três blocos em resumo

- **`tecpet`** — o maior (~40 ações). Conversa com a API da TecPet **através do `@tec.pet/tecpet-sdk`**
  (`new TecpetSDK(baseUrl, apiKey)`), não via HTTP cru. Cobre todo o fluxo de agendamento: clientes,
  pets, raças/espécies, serviços/combos, horários disponíveis, agendamentos, funcionários, faturamento,
  configurações/mensagens do chatbot, além dos builders em `internal/` (moldam respostas do SDK em
  listas de opções do chatbot), `parser/` (interpreta a config do fluxo selecionado) e `validations/`
  (CPF, datas, booking guards, tabelas de horário).
- **`tecpet-ai`** — 4 ações (`startChat`, `continueChat`, `speechToText`, `textToSpeech`). POSTs `ky`
  crus para um serviço de gateway de IA (`/start`, `/continue`, `/speechToText`, `/textToSpeech`) com
  `Bearer apiKey`; timeouts de 10 minutos. Erros passam por `parseUnknownError` + `logs.add`.
- **`tecpet-gateway`** — 3 ações (`talkToAttendant`, `endChat`, `changeShop`). POSTs `ky` crus para um
  gateway de sessão (`/action`, `/session/changeShop`); as duas primeiras enviam um enum `action` de
  `ChatbotActionButtonTypeEnum`.

Note a diferença de convenção: o bloco `tecpet` usa o SDK; `tecpet-ai`/`tecpet-gateway` chamam seus
backends diretamente com `ky`. Novas superfícies da API da TecPet devem, em geral, passar pelo SDK.

## tecpet-sdk

Pacote publicado separado (repo git próprio, `engines.node >= 23`, baseado em axios) embutido aqui.
O layout é orientado a domínio: `src/domain/<entidade>/<entidade>.service.ts` + `dto/` (tipos de
request/response prefixados com `Pa…`/`pa.*.dto.ts`) + `enum/`. O `src/index.ts` expõe a fachada
`TecpetSDK` que agrega um serviço por domínio (`sdk.client`, `sdk.pet`, `sdk.booking`, …), cada um
envolvendo um `HttpClient` compartilhado (`src/infra/http/client.http.ts`). O cliente HTTP injeta
`Authorization: Bearer <apiKey>` e um header opcional `x-shop` (multi-tenant — passe `shopId` para
escopar a requisição) e desempacota `response.data`.

- Build: `cd tecpet-sdk && npm run build` (ou `npm run watch`). Emite `dist/` com declarações.
- Testes: `jest` (único pacote aqui com testes).
- Subir a versão do SDK significa rebuildar o `dist/`, publicar e atualizar a versão de
  `@tec.pet/tecpet-sdk` em `tecpet/package.json` (atualmente um `^0.0.x` fixado).

## Convenções

- Os campos `name` das ações são rótulos visíveis ao usuário em **português (pt-BR)**; código/
  identificadores permanecem em inglês.
- Não edite `schemas.ts` na mão — ele é regenerado a partir da definição do bloco.
- Após adicionar/remover uma ação, atualize `index.ts` (array de actions) **e** `handlers.ts` (array de
  handlers) juntos — um par faltando descarta silenciosamente a ação em runtime.
- Rode `bun run format-and-lint:fix` (Biome) antes de commitar; o monorepo exige isso.
