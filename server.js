require("dotenv").config();
const express = require("express");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================= CONFIGURAÇÕES ======================= */
const ATUALIZAR_CADA_MINUTOS = 5;  // frequência da coleta automática
const CACHE_TTL_MINUTOS = 10;      // tempo de validade do cache

const LOGIN_URL = "https://meggapainel.com.br/#/login";
const CLIENTS_URL = "https://meggapainel.com.br/#/customers";

const USER_EMAIL = process.env.USER_EMAIL || "";
const USER_PASSWORD = process.env.USER_PASSWORD || "";

if (!USER_EMAIL || !USER_PASSWORD) {
  console.error("❌ ERRO: defina USER_EMAIL e USER_PASSWORD antes de rodar.");
  process.exit(1);
}

/* ======================= BANCO LOCAL (CACHE) ======================= */
const dbFile = path.join(__dirname, "cache_clientes.json");
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { cache: null, last_update: null });

/* ======================= FUNÇÕES AUXILIARES ======================= */
function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function minutosDesde(isoString) {
  if (!isoString) return Infinity;
  return (Date.now() - new Date(isoString).getTime()) / 60000;
}

function formatarDataBrasil(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

async function launchBrowser(headless = true) {
  const execPath = process.env.PUPPETEER_EXECUTABLE_PATH || await chromium.executablePath();
  return puppeteer.launch({
    headless: chromium.headless,
    executablePath: execPath,
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
  });
}

/* ======================= CAPTURA DE CLIENTES ======================= */
async function capturarPagina(page) {
  await page.waitForSelector("table tbody tr", { timeout: 20000 });
  return await page.evaluate(() => {
    const linhas = document.querySelectorAll("table tbody tr");
    const lista = [];

    linhas.forEach((linha) => {
      const tds = linha.querySelectorAll("td");

      const usuario = tds[0]?.querySelector("a")?.innerText.trim() || "";
      const smalls0 = tds[0]?.querySelectorAll("small") || [];
      const plano = smalls0[0]?.innerText.trim() || "";
      const descricao = smalls0[1]?.innerText.trim() || "";
      const email = smalls0[2]?.innerText.trim() || "";

      const data_vencimento = tds[1]?.querySelector("span")?.innerText.trim() || "";
      const criado_em = tds[1]?.querySelector(".text-muted span")?.innerText.trim() || "";

      const smalls2 = tds[2]?.querySelectorAll("small") || [];
      const status = smalls2[0]?.innerText.trim() || "";
      const tipo = smalls2[1]?.innerText.trim() || "";
      const modo = smalls2[2]?.innerText.trim() || "";

      const conexoes = tds[3]?.querySelector("small")?.innerText.trim() || "";

      const acoes =
        Array.from(tds[4]?.querySelectorAll("button, a") || [])
          .map((btn) => btn.title || btn.innerText.trim())
          .filter(Boolean)
          .join(", ") || "";

      if (usuario) {
        lista.push({
          usuario,
          plano,
          descricao,
          email,
          data_vencimento,
          criado_em,
          status,
          tipo,
          modo,
          conexoes,
          acoes,
        });
      }
    });

    const rodape = document.querySelector(
      ".row .col-sm-12.col-md-3.d-flex.align-items-center.justify-content-end"
    );
    let inicio = null, fim = null, total = null, por_pagina = null;
    if (rodape) {
      const ss = rodape.querySelectorAll("strong");
      if (ss.length >= 3) {
        inicio = parseInt(ss[0].innerText.replace(/\D+/g, "")) || null;
        fim = parseInt(ss[1].innerText.replace(/\D+/g, "")) || null;
        total = parseInt(ss[2].innerText.replace(/\D+/g, "")) || null;
        if (inicio && fim) por_pagina = (fim - inicio + 1);
      }
    }

    if (!por_pagina) {
      const sel = document.querySelector("#items-per-page");
      if (sel && sel.value) por_pagina = parseInt(sel.value) || null;
    }

    return { lista, contador: { inicio, fim, total, por_pagina } };
  });
}

/* ======================= LOGIN E COLETA ======================= */
async function loginAndFetch(headless = true) {
  const browser = await launchBrowser(headless);
  const page = await browser.newPage();

  // Tornar o ambiente mais "real" no Render
  await page.setViewport({ width: 1366, height: 768 });
  await page.setExtraHTTPHeaders({
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  });
  try { await page.emulateTimezone("America/Sao_Paulo"); } catch (_) {}
  page.setDefaultTimeout(45000);

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );

  console.log("🔑 Fazendo login...");
  await page.goto(LOGIN_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  console.log("🌐 URL:", page.url());
  let pageTitle = "";
  try { pageTitle = await page.title(); console.log("📄 Título:", pageTitle); } catch (_) {}
  if ((pageTitle || "").toLowerCase().includes("404")) {
    console.log("↪️  Detetado 404. Tentando rota com hash explicitamente...");
    await page.goto("https://meggapainel.com.br/#/login", { waitUntil: "domcontentloaded", timeout: 60000 });
    try { console.log("📄 Título após fallback:", await page.title()); } catch (_) {}
  }

  // Espera flexível por diferentes seletores de login
  const userSelectors = [
    'input[name="username"]',
    'input[name="email"]',
    'form input[type="email"]',
    'form input[name="login"]',
  ];
  const passSelectors = [
    'input[name="password"]',
    'form input[type="password"]',
  ];

  const foundUser = await Promise.race(
    userSelectors.map(sel => page.waitForSelector(sel, { timeout: 60000, visible: true }).then(() => sel))
  ).catch(() => null);
  const foundPass = await Promise.race(
    passSelectors.map(sel => page.waitForSelector(sel, { timeout: 60000, visible: true }).then(() => sel))
  ).catch(() => null);

  if (!foundUser || !foundPass) {
    const htmlSample = (await page.content()).slice(0, 500).replace(/\s+/g, ' ').trim();
    console.log("⚠️ Formulário de login não encontrado. Amostra HTML:", htmlSample);
    throw new Error("Formulário de login não carregou no tempo esperado (Render)");
  }

  await page.type(foundUser, USER_EMAIL, { delay: 20 });
  await page.type(foundPass, USER_PASSWORD, { delay: 20 });

  const botaoLogin = await page.$('button[type="submit"]');
  if (botaoLogin) {
    await Promise.all([
      botaoLogin.click(),
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {}),
    ]);
  } else {
    await page.keyboard.press("Enter");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }).catch(() => {});
  }

  console.log("✅ Login concluído!");
  await esperar(3000);

  console.log("📋 Acessando clientes...");
  await page.goto(CLIENTS_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await esperar(6000);

  try {
    console.log("🔢 Tentando definir 100 clientes por página...");
    await page.waitForSelector("#items-per-page", { timeout: 10000 });
    await page.select("#items-per-page", "100");
    await esperar(4000);
  } catch (err) {
    console.log("⚠️ Não foi possível ajustar para 100 por página:", err.message);
  }

  const clientes = [];
  let pagina = 1;

  const primeira = await capturarPagina(page);
  clientes.push(...primeira.lista);

  let total_clientes = primeira.contador.total || clientes.length;
  let porPagina = primeira.contador.por_pagina || 100;
  const paginasEsperadas = Math.max(1, Math.ceil(total_clientes / porPagina));

  console.log(`ℹ️ Total esperado: ${total_clientes} | Por página: ${porPagina} | Páginas: ${paginasEsperadas}`);

  async function irParaProximaPagina() {
    const antes = await page.evaluate(() => document.querySelector("table tbody")?.innerText);
    const botaoProximo = await page.$('li.paginate_button.page-item:not(.disabled) a[aria-label="Next"], li.paginate_button.page-item:not(.disabled) i.fa-arrow-right');
    if (!botaoProximo) return false;
    await botaoProximo.click();
    await esperar(3500);
    await page.waitForFunction(
      (textoAnterior) => document.querySelector("table tbody")?.innerText !== textoAnterior,
      { timeout: 10000 },
      antes
    ).catch(() => {});
    return true;
  }

  while (pagina < paginasEsperadas) {
    const ok = await irParaProximaPagina();
    if (!ok) break;
    pagina++;
    console.log(`📄 Capturando página ${pagina}/${paginasEsperadas}...`);
    const prox = await capturarPagina(page);
    clientes.push(...prox.lista);
  }

  console.log(`✅ Coleta finalizada — ${clientes.length} clientes coletados em ${pagina} páginas.`);
  await browser.close();

  return {
    status: 200,
    origem: "nova_coleta",
    atualizado_em: new Date().toISOString(),
    total_clientes: total_clientes || clientes.length,
    paginas: pagina,
    por_pagina: porPagina,
    data: clientes,
  };
}

/* ======================= CACHE E AGENDAMENTO ======================= */
let coletaEmAndamento = null;

function cacheValido() {
  if (!db.data.last_update || !db.data.cache) return false;
  return minutosDesde(db.data.last_update) < CACHE_TTL_MINUTOS;
}

async function atualizarCacheAgora(headless = true, origem = "manual") {
  if (coletaEmAndamento) return coletaEmAndamento;
  coletaEmAndamento = (async () => {
    const result = await loginAndFetch(headless);
    result.origem = origem;
    db.data.cache = result;
    db.data.last_update = new Date().toISOString();
    await db.write();
    console.log(`💾 Cache atualizado (${new Date().toLocaleTimeString()})`);
    coletaEmAndamento = null;
    return result;
  })();
  return coletaEmAndamento;
}

function agendarAtualizacoes() {
  setInterval(() => {
    console.log("⏰ Atualização automática de cache...");
    atualizarCacheAgora(true, "agendada").catch(console.error);
  }, ATUALIZAR_CADA_MINUTOS * 60 * 1000);
}

/* ======================= ENDPOINTS ======================= */

// 📦 Retorna dados (cache ou nova coleta)
app.get("/clientes", async (req, res) => {
  await db.read();
  if (cacheValido()) {
    console.log("♻️ Respondendo com cache válido.");
    return res.json(db.data.cache);
  }
  console.log("🔄 Cache expirado — coletando...");
  const result = await atualizarCacheAgora(true, "expirada");
  res.json(result);
});

// 📊 Status
app.get("/status", async (req, res) => {
  await db.read();
  const last = db.data.last_update;
  const minutos = minutosDesde(last);
  const valido = cacheValido();
  const proxima = last ? new Date(new Date(last).getTime() + ATUALIZAR_CADA_MINUTOS * 60000) : null;
  res.json({
    atualizar_cada_minutos: ATUALIZAR_CADA_MINUTOS,
    cache_ttl_minutos: CACHE_TTL_MINUTOS,
    last_update_iso: last,
    last_update_br: formatarDataBrasil(last),
    minutos_desde_ultima: minutos ? minutos.toFixed(2) : null,
    cache_valido: valido,
    prox_atualizacao_iso: proxima ? proxima.toISOString() : null,
    prox_atualizacao_br: proxima ? formatarDataBrasil(proxima) : null,
    total_clientes: db.data.cache?.total_clientes || 0,
  });
});

// 🔁 Força nova coleta
app.get("/atualizar", async (req, res) => {
  console.log("🚨 Coleta manual solicitada...");
  const result = await atualizarCacheAgora(true, "forcada");
  res.json(result);
});

// 🔄 Formato app
app.get("/clientes-app", async (req, res) => {
  await db.read();
  let cacheData = db.data?.cache;
  if (!cacheData?.data?.length) {
    console.log("⚙️ Nenhum cache disponível — coletando agora...");
    cacheData = await atualizarCacheAgora(true, "forcada");
  }

  const clientes = cacheData.data || [];
  const saida = clientes.map((c) => {
    let statusFormatado = "teste";
    if (c.modo && c.modo.toLowerCase().includes("teste")) statusFormatado = "teste";
    else if (!c.modo || c.modo.trim() === "") statusFormatado = "ativo";
    else if (c.status?.toLowerCase().includes("ativo")) statusFormatado = "ativo";
    else if (c.status?.toLowerCase().includes("vencido")) statusFormatado = "vencido";

    const nomeExtraido = c.conexoes?.replace("Conexões:", "").replace("Plano:", "").trim() || "";
    const dadosInternos = {
      acao: "atualizar usuarios existentes",
      usuario: c.usuario || "",
      cliente_nome: nomeExtraido || "",
      cliente_telefone1: "",
      plano_nome: c.descricao?.replace(/🟢|🟡|🔴/g, "").trim() || c.plano || "",
      quantidade_conexoes: 1,
      vencimento: c.data_vencimento || "",
      status: statusFormatado,
    };
    return { dados: JSON.stringify(dadosInternos) };
  });

  res.json(saida);
});

// 🧹 Limpar cache manualmente e regenerar automaticamente
app.get("/limpar-cache", async (req, res) => {
  await db.read();
  db.data.cache = null;
  db.data.last_update = null;
  await db.write();
  console.log("🧹 Cache limpo manualmente.");

  // ✅ Regenera o cache automaticamente após limpeza
  console.log("♻️ Gerando novo cache após limpeza...");
  await atualizarCacheAgora(true, "recriado_apos_limpeza");
  console.log("✅ Novo cache criado com sucesso após limpeza!");

  res.json({ status: 200, mensagem: "Cache limpo e recriado com sucesso." });
});

/* ======================= INÍCIO ======================= */
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🕒 Atualiza a cada ${ATUALIZAR_CADA_MINUTOS} min | Cache TTL: ${CACHE_TTL_MINUTOS} min`);
  agendarAtualizacoes();
});

// Healthcheck simples para plataformas de deploy (Render)
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime_s: process.uptime() });
});

