# CLAUDE.md — Blocos Forge da TecPet

Este arquivo especifica o funcionamento dos três blocos Forge da TecPet neste diretório:
`tecpet`, `tecpet-ai` e `tecpet-gateway` (mais o `tecpet-sdk` embutido que o `tecpet` consome).
Ele complementa o `botflow/CLAUDE.md` (visão geral) e o `CLAUDE.md` raiz do workspace, com o
detalhe de implementação de cada bloco. As demais pastas de `packages/forge/blocks/` são blocos do
Typebot upstream e não são cobertas aqui.

Todos são **blocos do Forge** do Typebot: expõem ações para o builder/viewer do chatbot. São
`private`, `type: module`, distribuem os `src/*.ts` crus via `exports` (sem etapa de build) e são
consumidos pelo workspace como `workspace:*`.

## Contrato comum (os 5 arquivos de todo bloco)

Cada pasta de bloco segue o mesmo formato e **os cinco precisam ficar em sincronia** ao adicionar/
renomear uma ação:

- `index.ts` — `createBlock({ id, name, tags, LightLogo, auth, actions: [...] })`. O `id` é único e
  também é listado no registro do repositório do Forge (ver "Registro" abaixo).
- `auth.ts` — `createAuth({ type: "encryptedCredentials", schema: option.object({ baseUrl, apiKey }) })`.
  Os três usam o **mesmo formato**: `baseUrl` (obrigatório, com `defaultValue` de uma constante e
  `.transform(v => v?.replace(/\/$/, ""))` removendo a barra final) + `apiKey` (obrigatório,
  `inputType: "password"`).
- `constants.ts` — a URL base padrão + o objeto `baseOptions` compartilhado (oculto, marcado como
  deprecated; herdado do template de bloco OpenAI, mantido por compatibilidade).
- `schemas.ts` — **gerado, não editar** (`parseBlockSchema` / `parseBlockCredentials`); é regenerado a
  partir da definição do bloco.
- `handlers.ts` — o runtime. Pareia cada ação com seu handler de servidor e exporta um array default.

### Definição da ação vs. handler (a separação central)

Uma "ação de bloco" tem duas metades que precisam andar pareadas:

1. **Definição** — `createAction({ auth, baseOptions, name, options, getSetVariableIds })`. Declara a
   UI (campos `option.string/number/object(...).layout({...})`) e, em `getSetVariableIds`, lista quais
   variáveis do Typebot a ação escreve. `name` é o rótulo visível ao usuário, em **pt-BR**.
2. **Handler de servidor** — função async `({ credentials, options, variables, logs }) => ...` que
   executa o trabalho e grava resultados com `variables.set([{ id, value }])`.

`option.string.layout({ inputType: "variableDropdown" })` (ou `withVariableButton`) liga uma opção a
uma variável do Typebot; o id escolhido flui por `getSetVariableIds` e `variables.set(...)`.

**Dois estilos de binding neste código — siga o do bloco que estiver editando:**
- **`tecpet`**: handler **co-localizado** com a definição no mesmo arquivo de ação (ex.:
  `getFormattedMessages` + `GetFormattedMessagesHandler`). O `handlers.ts` só importa os dois e pareia
  com `createActionHandler(action, { server: Handler })`.
- **`tecpet-ai` e `tecpet-gateway`**: os handlers são definidos **inline** dentro do `handlers.ts`
  (`createActionHandler(action, { server: async (...) => {...} })`), e os arquivos de ação ficam só com
  a definição.

## `tecpet` — o bloco grande (via `@tec.pet/tecpet-sdk`)

Conversa com a API da TecPet **através do SDK** (`new TecpetSDK(baseUrl, apiKey)`), não via HTTP cru.
`id: "tecpet"`, baseUrl padrão `https://api.tec.pet` (`tecpetDefaultBaseUrl`).

Estrutura de `src/actions/`:
- `actions/api/<domínio>/` — ações que chamam o SDK (um domínio por pasta: `client`, `pet`, `booking`,
  `combo`, `service`, `breed`, `specie`, `employee`, `shop`, `availableTimes`, `billingMethod`,
  `chatbotSettings`, `serviceRecommendation`, `token`).
- `actions/internal/` — *builders* que moldam respostas do SDK em listas de opções do chatbot
  (ex.: `buildServiceOptions`, `buildSelectedAdditionals`, `buildClientBookingsSummary`,
  `buildAvailableTimesOptions`, `buildEmployeeOptions`, `buildChainShopOptions`). Fazem transformação
  pura de dados — sem SDK, sem HTTP.
- `actions/parser/` — interpretam a config do fluxo selecionado (`parseSelectedFluxSettings`,
  `parseSelectedFluxInfoCollectionMenus` em `selectedFlux.*.ts`).
- `actions/validations/` — guards/validações (CPF, datas, `verifyBookingGuard`, `verifyShopTimeTable`,
  `validateTakeAndBringMinAdvanceHours`, `verifyActiveShopSegments`, etc.). Costumam gravar um boolean.

No `index.ts` as ações são agrupadas em `apiActions` + `buildActions` (com `clientActions`,
`petActions`, `bookingActions` e `validations` embutidos em `apiActions`) e concatenadas em `actions`.

Datas/fuso: usar o fuso da loja (`shopSettings.timeZone`, com default `"America/Sao_Paulo"`) e
`date-fns-tz` (`utcToZonedTime`) — nunca comparar horário de parede contra `Date.now()` em UTC.

## `tecpet-ai` — 4 ações (HTTP cru com `ky`)

`id: "tecpet-ai"`. Ações: `startChat`, `continueChat`, `speechToText`, `textToSpeech`. Handlers inline
no `handlers.ts` fazem `POST` com `ky` para o gateway de IA:
- `startChat` → `POST {baseUrl}/start`
- `continueChat` → `POST {baseUrl}/continue`
- `speechToText` → `POST {baseUrl}/speechToText`
- `textToSpeech` → `POST {baseUrl}/textToSpeech`

Cabeçalho `Authorization: Bearer {apiKey}`, `timeout: 10 * 60000` (10 min). Erros passam por
`parseUnknownError` + `logs.add` (tratando `HTTPError` do `ky`). Resultado gravado via
`variables.set` quando há `saveResponseInVariableId`.

## `tecpet-gateway` — 3 ações (HTTP cru com `ky`)

`id: "tecpet-gateway"`, baseUrl padrão `https://localhost:8181` (`tecpetGatewayDefaultBaseUrl`).
Ações: `talkToAttendant`, `endChat`, `changeShop`. Handlers inline no `handlers.ts` fazem `POST` com
`ky` para o gateway de sessão:
- `talkToAttendant` e `endChat` → `POST {baseUrl}/action`, enviando um enum `action` de
  `ChatbotActionButtonTypeEnum`.
- `changeShop` → `POST {baseUrl}/session/changeShop`.

## `tecpet-sdk` (embutido) — como o `tecpet` fala com a API

Cliente TypeScript publicado (`@tec.pet/tecpet-sdk`, repo git próprio, baseado em axios) **embutido**
em `packages/forge/blocks/tecpet-sdk/`. Layout por domínio:
`src/domain/<entidade>/<entidade>.service.ts` + `dto/` (tipos `Pa…`/`pa.*.dto.ts`) + `enum/`. O
`src/index.ts` expõe a fachada `TecpetSDK`, que agrega um serviço por domínio (`sdk.client`, `sdk.pet`,
`sdk.booking`, `sdk.chatbot`, `sdk.availableTimes`, …) sobre um `HttpClient` compartilhado
(`src/infra/http/client.http.ts`) que injeta `Authorization: Bearer <apiKey>`, um header opcional
`x-shop` (multi-tenant — passe `shopId`) e desempacota `response.data`.

**Como é consumido / build:**
- O `tecpet` importa `@tec.pet/tecpet-sdk` (hoje `^0.0.167`). No workspace, `node_modules/@tec.pet/
  tecpet-sdk` é um **symlink** para `packages/forge/blocks/tecpet-sdk/`.
- Diferente dos blocos, o SDK **compila** (`tsc`, `main`/`types` → `dist/`). Ao editar a fonte do SDK,
  **rebuilde o `dist/`** (`tsc -p packages/forge/blocks/tecpet-sdk/tsconfig.json`) — senão o `tecpet`
  continua enxergando os tipos antigos.
- Release oficial = rebuildar o `dist/`, publicar o pacote e subir a versão de `@tec.pet/tecpet-sdk`
  em `packages/forge/blocks/tecpet/package.json`. Prefira que novas superfícies da API da TecPet passem
  pelo SDK (o `tecpet-ai`/`tecpet-gateway` chamam seus backends direto com `ky`).

## Registro de um bloco no workspace

Um bloco só fica ativo depois de registrado no pacote de repositório do Forge
(`packages/forge/repository/src/`). A CLI do Forge (`bun run create-new-block`) faz isso no scaffold;
para mudanças manuais, atualize **os quatro**:
- `constants.ts` — id do bloco na lista de ids
- `definitions.ts` — `import { xBlock }` + entrada no mapa de definitions
- `handlers.ts` — `import xBlockHandlers from ".../handlers"` + entrada no mapa de handlers
- `repository/package.json` — dependência `workspace:*`

## Convenções

- `name` das ações em **pt-BR** (rótulo do usuário); código/identificadores em inglês.
- **Não edite `schemas.ts`** na mão — é regenerado a partir da definição do bloco.
- Ao adicionar/remover uma ação, atualize `index.ts` (array `actions`) **e** `handlers.ts` (array de
  handlers) **juntos** — um par faltando descarta a ação silenciosamente em runtime.
- Rode `bun run format-and-lint:fix` (Biome) antes de commitar.
