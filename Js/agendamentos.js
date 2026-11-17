// -----------------------------------------------------
// ELEMENTOS DA PÁGINA
// -----------------------------------------------------
const formulario = document.querySelector("#form-agendamento");
const campoApelido = document.querySelector("#apelido");
const campoContato = document.querySelector("#contato");
const campoServico = document.querySelector("#servico");
const campoData = document.querySelector("#data");
const campoHorario = document.querySelector("#horario");
const campoObservacao = document.querySelector("#observacao");
const campoConsentimento = document.querySelector("#consentimento");
const contadorObservacao = document.querySelector("#contador-observacao");
const mensagem = document.querySelector("#mensagem-form");
const tituloFormulario = document.querySelector("#titulo-form");
const botaoSalvar = document.querySelector("#btn-salvar");
const botaoCancelar = document.querySelector("#btn-cancelar-edicao");
const lista = document.querySelector("#lista-agendamentos");
const listaVazia = document.querySelector("#lista-vazia");
const totalAgendamentos = document.querySelector("#total-agendamentos");
const listaRegistros = document.querySelector("#lista-registros");
const registrosVazio = document.querySelector("#registros-vazio");
const botaoLimparRegistros = document.querySelector("#btn-limpar-registros");


// -----------------------------------------------------
// DADOS
// -----------------------------------------------------
const SERVICOS = {
  "gov-br": "Conta gov.br",
  "inss": "Meu INSS",
  "carteira-trabalho": "Carteira de Trabalho Digital",
  "curriculo": "Currículo e vagas de emprego",
  "contas": "2ª via de contas",
  "impressao": "Impressão e digitalização"
};

const VAGAS_POR_HORARIO = 2; // computadores disponíveis

// Cada agendamento: { id, apelido, contato, servico, data, horario, observacao }
let agendamentos = [];

// Guarda o id do agendamento que está sendo editado (null = novo agendamento)
let idEmEdicao = null;


// -----------------------------------------------------
// FUNÇÕES DE APOIO
// -----------------------------------------------------
function doisDigitos(numero) {
  return String(numero).padStart(2, "0");
}

// Date → "17/11/2026 08:30"
function formatarDataHora(data) {
  return doisDigitos(data.getDate()) + "/" + doisDigitos(data.getMonth() + 1) + "/" +
    data.getFullYear() + " " + doisDigitos(data.getHours()) + ":" + doisDigitos(data.getMinutes());
}

// "2026-11-17" → "17/11/2026"
function formatarData(texto) {
  const partes = texto.split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

// Date → "2026-11-17" (formato do input date)
function dataParaTexto(data) {
  return data.getFullYear() + "-" + doisDigitos(data.getMonth() + 1) + "-" + doisDigitos(data.getDate());
}

// "Meu INSS em 17/11/2026 às 09:00"
function descrever(agendamento) {
  return SERVICOS[agendamento.servico] + " em " + formatarData(agendamento.data) + " às " + agendamento.horario;
}

// tipo: "success", "danger" ou "info" (alertas do Bootstrap)
function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "alert alert-" + tipo;
  mensagem.hidden = false;
}


// -----------------------------------------------------
// REGISTRO DE ATIVIDADES
// -----------------------------------------------------
function registrarAtividade(texto, deuCerto) {
  const item = document.createElement("li");
  item.className = "border-start border-3 ps-2 mb-2 " + (deuCerto ? "border-success" : "border-danger");
  item.textContent = formatarDataHora(new Date()) + " — " + texto;

  listaRegistros.prepend(item); // o mais recente fica em cima
  registrosVazio.hidden = true;
}


// -----------------------------------------------------
// VALIDAÇÃO
// O HTML5 já barra campo vazio e formato errado (required,
// pattern, min, max). Aqui ficam as regras que o HTML
// sozinho não consegue verificar.
// -----------------------------------------------------
function lerFormulario() {
  return {
    apelido: campoApelido.value.trim(),
    contato: campoContato.value.trim(),
    servico: campoServico.value,
    data: campoData.value,
    horario: campoHorario.value,
    observacao: campoObservacao.value.trim()
  };
}

function validarData(texto) {
  if (texto === "") {
    return "Escolha o dia do atendimento.";
  }

  const partes = texto.split("-");
  const data = new Date(partes[0], partes[1] - 1, partes[2]);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + 60);

  if (isNaN(data.getTime())) return "Data inválida.";
  if (data < hoje) return "A data não pode estar no passado.";
  if (data > limite) return "Agende com no máximo 60 dias de antecedência.";
  if (data.getDay() === 0) return "Não abrimos aos domingos. Escolha outro dia.";
  return "";
}

// Conta quantos agendamentos já existem no mesmo dia e horário
function horarioLotado(data, horario) {
  const ocupados = agendamentos.filter(function (item) {
    return item.data === data && item.horario === horario && item.id !== idEmEdicao;
  });
  return ocupados.length >= VAGAS_POR_HORARIO;
}

// Devolve um objeto { campo: "mensagem de erro" }. Vazio = tudo certo.
function validarFormulario(dados) {
  const erros = {};

  if (dados.apelido.length < 2 || dados.apelido.length > 40) {
    erros.apelido = "O apelido precisa ter de 2 a 40 letras.";
  } else if (!/^[A-Za-zÀ-ÿ ]+$/.test(dados.apelido)) {
    erros.apelido = "Use só letras e espaços.";
  }

  if (dados.contato !== "" && !/^\(?\d{2}\)?\s?9\d{4}-?\d{4}$/.test(dados.contato)) {
    erros.contato = "Use o formato (11) 91234-5678.";
  }

  // Confere se o serviço existe mesmo na lista (o <select> pode ser alterado pelo DevTools)
  if (!Object.keys(SERVICOS).includes(dados.servico)) {
    erros.servico = "Escolha um serviço da lista.";
  }

  const erroData = validarData(dados.data);
  if (erroData !== "") {
    erros.data = erroData;
  }

  // "HH:MM" pode ser comparado como texto: "08:00" < "09:30"
  if (dados.horario < "08:00" || dados.horario > "17:30") {
    erros.horario = "Atendemos das 08:00 às 17:30.";
  } else if (!dados.horario.endsWith(":00") && !dados.horario.endsWith(":30")) {
    erros.horario = "Escolha um horário cheio ou de meia hora.";
  } else if (horarioLotado(dados.data, dados.horario)) {
    erros.horario = "Esse horário já está lotado. Escolha outro.";
  }

  // LGPD: bloqueia números longos (CPF, RG, cartão) e senhas na observação
  if (dados.observacao.length > 200) {
    erros.observacao = "Use no máximo 200 caracteres.";
  } else if (/(\d[.\-\s]?){9,}/.test(dados.observacao) || /senha\s*(é|e|:|=)/i.test(dados.observacao)) {
    erros.observacao = "Por segurança, não escreva CPF, senhas nem números de documentos aqui.";
  }

  if (!campoConsentimento.checked) {
    erros.consentimento = "Marque esta opção para continuar.";
  }

  return erros;
}

// is-invalid é a classe do Bootstrap que deixa o campo vermelho
// e mostra a mensagem que está no .invalid-feedback
function mostrarErros(erros) {
  for (const campo in erros) {
    document.querySelector("#" + campo).classList.add("is-invalid");
    document.querySelector("#erro-" + campo).textContent = erros[campo];
  }
}

function limparErros() {
  formulario.querySelectorAll(".is-invalid").forEach(function (campo) {
    campo.classList.remove("is-invalid");
  });
}

// -----------------------------------------------------
// ADICIONAR, LISTAR, EDITAR E REMOVER
// -----------------------------------------------------
function adicionarAgendamento(dados) {
  dados.id = Date.now() + Math.random(); // hora atual + parte aleatória = número único
  agendamentos.push(dados);
}

function editarAgendamento(id, dados) {
  const posicao = agendamentos.findIndex(function (item) {
    return item.id === id;
  });
  dados.id = id;
  agendamentos[posicao] = dados;
}

function removerAgendamento(id) {
  agendamentos = agendamentos.filter(function (item) {
    return item.id !== id;
  });
}

// Monta o <li> de um agendamento.
// textContent mostra o texto sem interpretar HTML (proteção contra XSS).
function criarItemDaLista(agendamento) {
  const item = document.createElement("li");
  item.className = "card card-body";
  if (agendamento.id === idEmEdicao) {
    item.classList.add("border-warning", "border-2"); // destaca o item em edição
  }

  const titulo = document.createElement("h3");
  titulo.className = "h5 mb-1";
  titulo.textContent = agendamento.apelido;

  const servico = document.createElement("p");
  servico.className = "fw-bold text-primary mb-1";
  servico.textContent = SERVICOS[agendamento.servico];

  const quando = document.createElement("p");
  quando.className = "mb-1";
  quando.textContent = formatarData(agendamento.data) + " às " + agendamento.horario;

  item.append(titulo, servico, quando);

  if (agendamento.observacao) {
    const observacao = document.createElement("p");
    observacao.className = "fst-italic text-body-secondary mb-1";
    observacao.textContent = agendamento.observacao;
    item.append(observacao);
  }

  // data-acao e data-id dizem qual botão foi clicado e de qual agendamento
  const botoes = document.createElement("div");
  botoes.className = "d-flex gap-2 mt-2";
  botoes.innerHTML =
    '<button type="button" class="btn btn-sm btn-outline-primary" data-acao="editar">Editar</button>' +
    '<button type="button" class="btn btn-sm btn-outline-danger" data-acao="remover">Remover</button>';
  botoes.querySelectorAll("button").forEach(function (botao) {
    botao.dataset.id = agendamento.id;
  });
  item.append(botoes);

  return item;
}

function listarAgendamentos() {
  lista.innerHTML = "";

  // Ordena por data e horário (o mais próximo primeiro)
  agendamentos.sort(function (a, b) {
    return (a.data + a.horario).localeCompare(b.data + b.horario);
  });

  agendamentos.forEach(function (agendamento) {
    lista.append(criarItemDaLista(agendamento));
  });

  totalAgendamentos.textContent = agendamentos.length + " agendamento(s)";
  listaVazia.hidden = agendamentos.length > 0;
}

// Coloca os dados no formulário e troca para o modo edição
function iniciarEdicao(id) {
  const agendamento = agendamentos.find(function (item) {
    return item.id === id;
  });

  idEmEdicao = id;
  campoApelido.value = agendamento.apelido;
  campoContato.value = agendamento.contato || "";
  campoServico.value = agendamento.servico;
  campoData.value = agendamento.data;
  campoHorario.value = agendamento.horario;
  campoObservacao.value = agendamento.observacao || "";
  campoConsentimento.checked = true;

  tituloFormulario.textContent = "Editando agendamento";
  botaoSalvar.textContent = "Salvar alterações";
  botaoCancelar.hidden = false;
  mostrarMensagem("Altere os campos e clique em \"Salvar alterações\".", "info");
  listarAgendamentos();
  formulario.scrollIntoView({ behavior: "smooth" });
}

// Volta o formulário para "Novo agendamento"
function sairDaEdicao() {
  idEmEdicao = null;
  formulario.reset();
  limparErros();
  contadorObservacao.textContent = "0/200 caracteres";
  tituloFormulario.textContent = "Novo agendamento";
  botaoSalvar.textContent = "Agendar";
  botaoCancelar.hidden = true;
}

// -----------------------------------------------------
// SALVAR NO NAVEGADOR (localStorage)
// -----------------------------------------------------
const CHAVE_DADOS = "pontoDigital.agendamentos";

function salvarNoNavegador() {
  try {
    localStorage.setItem(CHAVE_DADOS, JSON.stringify(agendamentos));
  } catch (erro) {
    console.error(erro);
    mostrarMensagem("Não foi possível salvar os dados neste navegador.", "danger");
  }
}

function carregarDoNavegador() {
  try {
    const texto = localStorage.getItem(CHAVE_DADOS);
    if (texto === null) return;

    const dados = JSON.parse(texto);
    // Só aceita itens com o formato esperado (os dados podem ter sido alterados à mão)
    agendamentos = dados.filter(function (item) {
      return typeof item.id === "number" &&
        typeof item.apelido === "string" &&
        Object.keys(SERVICOS).includes(item.servico) &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.data) &&
        /^\d{2}:\d{2}$/.test(item.horario);
    });
  } catch (erro) {
    console.error(erro); // o detalhe técnico fica só no console
    agendamentos = [];
    mostrarMensagem("Não foi possível carregar os dados. Tente novamente.", "danger");
    registrarAtividade("Erro ao carregar os dados salvos", false);
  }
}


// -----------------------------------------------------
// EVENTOS
// -----------------------------------------------------
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  try {
    limparErros();
    const dados = lerFormulario();
    const erros = validarFormulario(dados);

    if (Object.keys(erros).length > 0) {
      mostrarErros(erros);
      mostrarMensagem("Confira os campos destacados em vermelho.", "danger");
      registrarAtividade("Tentativa de salvar agendamento com dados inválidos", false);
      return;
    }

    if (idEmEdicao === null) {
      adicionarAgendamento(dados);
      mostrarMensagem("Pronto, " + dados.apelido + "! Agendamento confirmado: " + descrever(dados) + ".", "success");
      registrarAtividade("Agendamento adicionado com sucesso (" + descrever(dados) + ")", true);
    } else {
      editarAgendamento(idEmEdicao, dados);
      mostrarMensagem("Agendamento atualizado: " + descrever(dados) + ".", "success");
      registrarAtividade("Agendamento editado com sucesso (" + descrever(dados) + ")", true);
    }

    salvarNoNavegador();
    sairDaEdicao();
    listarAgendamentos();
  } catch (erro) {
    console.error(erro);
    mostrarMensagem("Não foi possível salvar. Tente novamente.", "danger");
    registrarAtividade("Erro ao salvar agendamento", false);
  }
});

// Um único evento na lista atende todos os botões Editar e Remover
lista.addEventListener("click", function (evento) {
  const botao = evento.target.closest("button");
  if (!botao) return;

  const id = Number(botao.dataset.id);

  if (botao.dataset.acao === "editar") {
    iniciarEdicao(id);
    registrarAtividade("Edição iniciada", true);
  }

  if (botao.dataset.acao === "remover") {
    if (!confirm("Remover este agendamento? Essa ação não pode ser desfeita.")) {
      registrarAtividade("Remoção cancelada pelo usuário", true);
      return;
    }
    removerAgendamento(id);
    if (idEmEdicao === id) {
      sairDaEdicao();
    }
    salvarNoNavegador();
    listarAgendamentos();
    mostrarMensagem("Agendamento removido.", "success");
    registrarAtividade("Agendamento removido com sucesso", true);
  }
});

botaoCancelar.addEventListener("click", function () {
  sairDaEdicao();
  listarAgendamentos();
  mostrarMensagem("Edição cancelada. Nada foi alterado.", "info");
  registrarAtividade("Edição cancelada pelo usuário", true);
});

botaoLimparRegistros.addEventListener("click", function () {
  listaRegistros.innerHTML = "";
  registrosVazio.hidden = false;
});

campoObservacao.addEventListener("input", function () {
  contadorObservacao.textContent = campoObservacao.value.length + "/200 caracteres";
});


// -----------------------------------------------------
// INÍCIO
// -----------------------------------------------------

// O campo de data só aceita de hoje até 60 dias depois
const hoje = new Date();
const limite = new Date();
limite.setDate(hoje.getDate() + 60);
campoData.min = dataParaTexto(hoje);
campoData.max = dataParaTexto(limite);

carregarDoNavegador();
listarAgendamentos();
