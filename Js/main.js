const pagina = document.documentElement; // a tag <html>
const botaoFonte = document.querySelector("#btn-fonte");
const botaoTema = document.querySelector("#btn-tema");
const anoAtual = document.querySelector("#ano-atual");


function lerPreferencia(nome) {
  try {
    return localStorage.getItem("pontoDigital." + nome) === "true";
  } catch (erro) {
    return false; // navegador bloqueou o localStorage: usa o padrão
  }
}

function salvarPreferencia(nome, valor) {
  try {
    localStorage.setItem("pontoDigital." + nome, valor);
  } catch (erro) {
    console.warn(erro);
  }
}

// A classe "fonte-grande" está no style.css
function aplicarFonteGrande(ligada) {
  pagina.classList.toggle("fonte-grande", ligada);
  botaoFonte.setAttribute("aria-pressed", String(ligada));
}

// O Bootstrap 5.3 tem modo escuro pronto: basta trocar o data-bs-theme do <html>
function aplicarModoEscuro(ligado) {
  pagina.setAttribute("data-bs-theme", ligado ? "dark" : "light");
  botaoTema.textContent = ligado ? "☀️ Modo claro" : "🌙 Modo escuro";
}


if (botaoFonte) {
  aplicarFonteGrande(lerPreferencia("fonteGrande"));
  botaoFonte.addEventListener("click", function () {
    const ligada = !pagina.classList.contains("fonte-grande");
    aplicarFonteGrande(ligada);
    salvarPreferencia("fonteGrande", ligada);
  });
}

if (botaoTema) {
  aplicarModoEscuro(lerPreferencia("modoEscuro"));
  botaoTema.addEventListener("click", function () {
    const ligado = pagina.getAttribute("data-bs-theme") !== "dark";
    aplicarModoEscuro(ligado);
    salvarPreferencia("modoEscuro", ligado);
  });
}

if (anoAtual) {
  anoAtual.textContent = new Date().getFullYear();
}