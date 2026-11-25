// =====================================================
// Chat com LLM - HTML + CSS + JavaScript (client-side)
// API: Groq (compatível com o formato "Chat Completions")
// =====================================================

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b"; // alternativa mais rápida: "openai/gpt-oss-20b"

// Opção 1: cole sua chave de TESTE aqui (não publique em repositório público!)
// Opção 2: deixe vazio e digite a chave no campo "Key" da lateral (fica só no seu navegador)
const API_KEY_FIXA = "";

// Mensagem de sistema: define o comportamento da IA
const MENSAGEM_SISTEMA = {
  role: "system",
  content: "Você é um assistente prestativo. Responda sempre em português do Brasil, de forma clara e objetiva."
};

// Cada conversa tem o seu próprio histórico (é ele que mantém o contexto:
// a cada requisição, o array inteiro da conversa é enviado à API).
let conversas = [];
let atual = null;   // conversa selecionada
let contador = 0;

// ---------- Elementos da página ----------
const areaMensagens = document.getElementById("mensagens");
const form = document.getElementById("form");
const campoTexto = document.getElementById("texto");
const btnEnviar = document.getElementById("btn-enviar");
const btnNova = document.getElementById("btn-nova");
const campoChave = document.getElementById("chave");
const listaConversas = document.getElementById("lista-conversas");

// ---------- Chave da API ----------
function obterChave() {
  return API_KEY_FIXA || campoChave.value.trim();
}

campoChave.value = localStorage.getItem("chat_api_key") || "";
campoChave.addEventListener("input", () => {
  localStorage.setItem("chat_api_key", campoChave.value.trim());
});

// ---------- Conversas (lista lateral) ----------
function criarConversa() {
  contador++;
  const conversa = {
    id: contador,
    titulo: `Conversa ${contador}`,
    historico: [MENSAGEM_SISTEMA],
    aguardando: false
  };
  conversas.push(conversa);
  selecionarConversa(conversa);
}

function selecionarConversa(conversa) {
  atual = conversa;
  renderizarLista();
  renderizarMensagens();
  atualizarEntrada();
  campoTexto.focus();
}

function renderizarLista() {
  listaConversas.innerHTML = "";
  conversas.forEach((c) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = c.titulo;
    if (c === atual) btn.classList.add("ativa");
    btn.addEventListener("click", () => selecionarConversa(c));
    li.appendChild(btn);
    listaConversas.appendChild(li);
  });
}

// ---------- Mensagens na tela ----------
function mostrarTelaVazia() {
  areaMensagens.innerHTML = `
    <div class="vazio">
      <strong>Como posso ajudar?</strong>
      Digite uma mensagem abaixo para começar a conversar.
    </div>`;
}

function renderizarMensagens() {
  areaMensagens.innerHTML = "";
  const mensagens = atual.historico.filter((m) => m.role !== "system");

  if (mensagens.length === 0) {
    mostrarTelaVazia();
    return;
  }

  mensagens.forEach((m) => {
    adicionarBalao(m.content, m.role === "user" ? "usuario" : "ia");
  });

  if (atual.aguardando) mostrarCarregando();
}

// Converte o Markdown básico da IA em HTML.
// Primeiro "escapa" < > & (segurança), depois troca só o que queremos.
function formatarTexto(texto) {
  const seguro = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return seguro
    .replace(/^\s*[*-]\s+/gm, "• ")                      // listas: "* item" vira "• item"
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")   // **negrito**
    .replace(/`([^`]+)`/g, "<code>$1</code>");           // `código`
}

function criarLinha(tipo, rotuloTexto) {
  // tipo: "usuario" | "ia" | "erro"
  const vazio = areaMensagens.querySelector(".vazio");
  if (vazio) vazio.remove();

  const linha = document.createElement("div");
  linha.className = `linha ${tipo}`;

  const rotulo = document.createElement("span");
  rotulo.className = "rotulo";
  rotulo.textContent = rotuloTexto;

  linha.appendChild(rotulo);
  return linha;
}

function adicionarBalao(texto, tipo) {
  const rotulos = { usuario: "EU:", ia: "Chat:", erro: "Erro:" };
  const linha = criarLinha(tipo, rotulos[tipo]);

  const balao = document.createElement("div");
  balao.className = `balao ${tipo}`;

  if (tipo === "ia") {
    balao.innerHTML = formatarTexto(texto);
  } else {
    balao.textContent = texto; // textContent evita injeção de HTML
  }

  // O rótulo ("EU:" / "Chat:") fica sempre à esquerda do balão
  linha.appendChild(balao);
  areaMensagens.appendChild(linha);
  rolarParaFim();
}

function mostrarCarregando() {
  const linha = criarLinha("ia", "Chat:");
  linha.id = "indicador";

  const pontos = document.createElement("div");
  pontos.className = "digitando";
  pontos.innerHTML = "<span></span><span></span><span></span>";

  linha.appendChild(pontos);
  areaMensagens.appendChild(linha);
  rolarParaFim();
}

function esconderCarregando() {
  const el = document.getElementById("indicador");
  if (el) el.remove();
}

function rolarParaFim() {
  areaMensagens.scrollTop = areaMensagens.scrollHeight;
}

function atualizarEntrada() {
  const bloqueado = atual.aguardando;
  btnEnviar.disabled = bloqueado;
  campoTexto.disabled = bloqueado;
}

function ajustarAlturaCampo() {
  campoTexto.style.height = "auto";
  campoTexto.style.height = campoTexto.scrollHeight + "px";
}

// ---------- Integração com a API ----------
async function chamarAPI(mensagens) {
  const chave = obterChave();
  if (!chave) {
    throw new Error("Nenhuma chave de API informada. Digite sua chave no campo \"Key\" da lateral.");
  }

  const resposta = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${chave}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: mensagens
    })
  });

  if (!resposta.ok) {
    let detalhe = "";
    try {
      const corpo = await resposta.json();
      detalhe = corpo?.error?.message || "";
    } catch (_) { /* corpo sem JSON */ }

    if (resposta.status === 401) throw new Error("Chave de API inválida ou ausente (401).");
    if (resposta.status === 429) throw new Error("Limite de requisições atingido (429). Aguarde um pouco e tente de novo.");
    throw new Error(`Erro ${resposta.status} na comunicação com a API. ${detalhe}`);
  }

  const dados = await resposta.json();
  return dados.choices[0].message.content;
}

async function enviarMensagem(texto) {
  const conversa = atual; // guarda a conversa de origem (o usuário pode trocar de conversa enquanto espera)

  adicionarBalao(texto, "usuario");
  conversa.historico.push({ role: "user", content: texto });

  conversa.aguardando = true;
  atualizarEntrada();
  mostrarCarregando();

  try {
    const respostaIA = await chamarAPI(conversa.historico);
    conversa.historico.push({ role: "assistant", content: respostaIA });

    if (atual === conversa) {
      esconderCarregando();
      adicionarBalao(respostaIA, "ia");
    }
  } catch (erro) {
    console.error("Erro:", erro);

    // Remove a pergunta que falhou para o histórico não ficar inconsistente
    conversa.historico.pop();

    if (atual === conversa) {
      esconderCarregando();
      const msg = erro instanceof TypeError
        ? "Falha de rede: verifique sua conexão com a internet."
        : erro.message;
      adicionarBalao("⚠️ " + msg, "erro");
    }
  } finally {
    conversa.aguardando = false;
    if (atual === conversa) {
      atualizarEntrada();
      campoTexto.focus();
    }
  }
}

// ---------- Eventos ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const texto = campoTexto.value.trim();
  if (!texto || atual.aguardando) return;

  campoTexto.value = "";
  ajustarAlturaCampo();
  enviarMensagem(texto);
});

campoTexto.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

campoTexto.addEventListener("input", ajustarAlturaCampo);
btnNova.addEventListener("click", criarConversa);

// ---------- Início ----------
criarConversa();
