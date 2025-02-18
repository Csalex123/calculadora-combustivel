document.addEventListener("DOMContentLoaded", async () => {
  const apiStatus = await testarConectividadeAPI();
  if (apiStatus) {
    document.getElementById("estadoContainer").style.display = "block";
    await carregarEstados();
    obterLocalizacao();
  } else {
    document.getElementById("estadoContainer").style.display = "none";
  }
  document.getElementById("precoGasolina").disabled = false;
  document.getElementById("precoEtanol").disabled = false;
  mostrarInterface('custo');
  verificarHistorico();
});

function mostrarInterface(interface) {
  limpar();
  limparEconomia();
  document.getElementById("alertas").innerHTML = ""; // Clear warnings
  document.getElementById("formCusto").style.display = interface === 'custo' ? 'block' : 'none';
  document.getElementById("formEconomia").style.display = interface === 'economia' ? 'block' : 'none';
  document.querySelectorAll('.btn-outline-primary, .btn-outline-secondary').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.btn-outline-${interface === 'custo' ? 'primary' : 'secondary'}`).classList.add('active');
  if (interface === 'custo') {
    obterLocalizacao(); // Re-fetch location when switching back to trip cost interface
  }
}

async function testarConectividadeAPI() {
  try {
    const response = await axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent('https://combustivelapi.com.br/api/precos')}`);
    const data = JSON.parse(response.data.contents);
    return data && response.status === 200;
  } catch (error) {
    console.error("Erro ao testar a conectividade com a API:", error);
    return false;
  }
}

async function carregarEstados() {
  try {
    const response = await axios.get(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
    );
    const estados = response.data;
    const estadoSelect = document.getElementById("estado");

    estados.forEach((estado) => {
      const option = document.createElement("option");
      option.value = estado.sigla;
      option.text = estado.nome;
      estadoSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar os estados:", error);
    alert("Não foi possível carregar os estados. Tente novamente mais tarde.");
  }
}

async function obterLocalizacao() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const estado = response.data.address.state;
        const estadoSelect = document.getElementById("estado");
        for (let option of estadoSelect.options) {
          if (option.text === estado) {
            option.selected = true;
            obterPrecoCombustivel();
            break;
          }
        }
      } catch (error) {
        console.error("Erro ao obter a localização:", error);
      }
    });
  } else {
    alert("Geolocalização não é suportada pelo seu navegador.");
  }
}

async function obterPrecoCombustivel() {
  const estado = document.getElementById("estado").value;
  const precoGasolinaInput = document.getElementById("precoGasolina");
  const precoEtanolInput = document.getElementById("precoEtanol");
  const alertas = document.getElementById("alertas");
  precoGasolinaInput.disabled = true;
  precoEtanolInput.disabled = true;
  alertas.innerHTML = "";

  if (!estado) {
    precoGasolinaInput.value = "";
    precoEtanolInput.value = "";
    precoGasolinaInput.disabled = false;
    precoEtanolInput.disabled = false;
    return;
  }

  try {
    const response = await axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent('https://combustivelapi.com.br/api/precos')}`);
    const data = JSON.parse(response.data.contents);
    const precoGasolina = data.precos.gasolina[estado.toLowerCase()];
    precoGasolinaInput.value = precoGasolina ? precoGasolina : "";
    precoGasolinaInput.disabled = false;
    precoEtanolInput.disabled = false;
    if (!precoGasolina) {
      alertas.innerHTML += `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
          <i class="material-icons icon">warning</i> Preço da <b>gasolina</b> não encontrado no sistema. Por favor, preencha o preço manualmente.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `;
    }
    alertas.innerHTML += `
      <div class="alert alert-warning alert-dismissible fade show" role="alert" id="alertaEtanol">
        <i class="material-icons icon">warning</i> Preço do <b>etanol</b> não encontrado no sistema. Por favor, preencha o preço manualmente.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  } catch (error) {
    console.error("Erro ao obter o preço do combustível:", error);
    alert(
      "Não foi possível obter o preço do combustível. Tente novamente mais tarde."
    );
    precoGasolinaInput.disabled = false;
    precoEtanolInput.disabled = false;
  }
}

async function obterPrecoCombustivelEconomia() {
  const estado = document.getElementById("estado").value;
  const precoGasolinaInput = document.getElementById("precoGasolinaEconomia");
  const precoEtanolInput = document.getElementById("precoEtanolEconomia");
  const alertas = document.getElementById("alertas");
  precoGasolinaInput.disabled = true;
  precoEtanolInput.disabled = true;
  alertas.innerHTML = "";

  if (!estado) {
    precoGasolinaInput.value = "";
    precoEtanolInput.value = "";
    precoGasolinaInput.disabled = false;
    precoEtanolInput.disabled = false;
    return;
  }

  try {
    const response = await axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent('https://combustivelapi.com.br/api/precos')}`);
    const data = JSON.parse(response.data.contents);
    const precoGasolina = data.precos.gasolina[estado.toLowerCase()];
    precoGasolinaInput.value = precoGasolina ? precoGasolina : "";
    precoGasolinaInput.disabled = false;
    precoEtanolInput.disabled = false;
    if (!precoGasolina) {
      alertas.innerHTML += `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
          <i class="material-icons icon">warning</i> Preço da <b>gasolina</b> não encontrado no sistema. Por favor, preencha o preço manualmente.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `;
    }
    alertas.innerHTML += `
      <div class="alert alert-warning alert-dismissible fade show" role="alert" id="alertaEtanol">
        <i class="material-icons icon">warning</i> Preço do <b>etanol</b> não encontrado no sistema. Por favor, preencha o preço manualmente.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  } catch (error) {
    console.error("Erro ao obter o preço do combustível:", error);
    alert(
      "Não foi possível obter o preço do combustível. Tente novamente mais tarde."
    );
    precoGasolinaInput.disabled = false;
    precoEtanolInput.disabled = false;
  }
}

function validarCampos() {
  const distancia = document.getElementById("distancia").value;
  const consumoGasolina = document.getElementById("consumoGasolina").value;
  const consumoEtanol = document.getElementById("consumoEtanol").value;
  const precoGasolina = document.getElementById("precoGasolina").value;
  const precoEtanol = document.getElementById("precoEtanol").value;

  const calcularBtn = document.getElementById("calcularBtn");
  if (distancia && consumoGasolina && consumoEtanol && (precoGasolina || precoEtanol)) {
    calcularBtn.disabled = false;
  } else {
    calcularBtn.disabled = true;
  }

  document.getElementById("precoGasolina").disabled = false;
  document.getElementById("precoEtanol").disabled = false;
}

function validarCamposEconomia() {
  const precoGasolina = document.getElementById("precoGasolinaEconomia").value;
  const precoEtanol = document.getElementById("precoEtanolEconomia").value;
  const consumoGasolina = document.getElementById("consumoGasolinaEconomia").value;
  const consumoEtanol = document.getElementById("consumoEtanolEconomia").value;

  const compararBtn = document.getElementById("compararBtn");
  if (precoGasolina && precoEtanol && consumoGasolina && consumoEtanol) {
    compararBtn.disabled = false;
  } else {
    compararBtn.disabled = true;
  }
}

function formatarMoeda(input) {
  let value = input.value.replace(/\D/g, "");
  value = (value / 100).toFixed(2) + "";
  value = value.replace(".", ",");
  value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
  input.value = value;
}

function removerMensagemEtanol() {
  const alertaEtanol = document.getElementById("alertaEtanol");
  if (alertaEtanol) {
    alertaEtanol.remove();
  }
}

function calcular() {
  let distancia = parseFloat(document.getElementById("distancia").value);
  let consumoGasolina = parseFloat(document.getElementById("consumoGasolina").value);
  let consumoEtanol = parseFloat(document.getElementById("consumoEtanol").value);
  let precoGasolina = parseFloat(
    document.getElementById("precoGasolina").value.replace(/\./g, "").replace(",", ".")
  );
  let precoEtanol = parseFloat(
    document.getElementById("precoEtanol").value.replace(/\./g, "").replace(",", ".")
  );
  let idaEVolta = document.getElementById("idaEVolta").checked;
  const estado = document.getElementById("estado").value;

  if (!distancia || !consumoGasolina || !consumoEtanol || (!precoGasolina && !precoEtanol)) {
    document.getElementById("resultado").innerText = "";
    document.getElementById("litros").innerText = "";
    document.getElementById("comparacao").innerText = "";
    return;
  }

  if (idaEVolta) {
    distancia *= 2;
  }

  let litrosNecessariosGasolina = distancia / consumoGasolina;
  let litrosNecessariosEtanol = distancia / consumoEtanol;
  let custoTotalGasolina = precoGasolina
    ? litrosNecessariosGasolina * precoGasolina
    : null;
  let custoTotalEtanol = precoEtanol ? litrosNecessariosEtanol * precoEtanol : null;

  let resultadoText = `
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Combustível</th>
          <th>Custo Total (R$)</th>
          <th>Litros Necessários</th>
        </tr>
      </thead>
      <tbody>
  `;
  if (custoTotalGasolina !== null) {
    resultadoText += `
      <tr>
        <td>Gasolina</td>
        <td>R$ ${custoTotalGasolina.toFixed(2)}</td>
        <td>${litrosNecessariosGasolina.toFixed(2)} L</td>
      </tr>
    `;
  }
  if (custoTotalEtanol !== null) {
    resultadoText += `
      <tr>
        <td>Etanol</td>
        <td>R$ ${custoTotalEtanol.toFixed(2)}</td>
        <td>${litrosNecessariosEtanol.toFixed(2)} L</td>
      </tr>
    `;
  }
  resultadoText += `
      </tbody>
    </table>
  `;

  document.getElementById("resultado").innerHTML = resultadoText;

  let economiaText = "";
  if (custoTotalGasolina !== null && custoTotalEtanol !== null) {
    const economia = custoTotalGasolina - custoTotalEtanol;
    const economiaPercentual = (economia / custoTotalGasolina) * 100;
    if (custoTotalEtanol < custoTotalGasolina) {
      economiaText = `Você economizará R$ ${economia.toFixed(2)} (${economiaPercentual.toFixed(2)}%) abastecendo com etanol.`;
      document.getElementById(
        "comparacao"
      ).innerHTML = `
        <div class="alert alert-success" role="alert">
          <i class="material-icons icon">check_circle</i> É mais barato e econômico abastecer com etanol. ${economiaText}
        </div>
      `;
    } else {
      economiaText = `É mais barato e econômico abastecer com gasolina.`;
      document.getElementById(
        "comparacao"
      ).innerHTML = `
        <div class="alert alert-success" role="alert">
          <i class="material-icons icon">check_circle</i> ${economiaText}
        </div>
      `;
    }
  } else {
    document.getElementById("comparacao").innerText = "";
  }

  salvarHistorico('custo', {
    distancia,
    consumoGasolina,
    consumoEtanol,
    precoGasolina,
    precoEtanol,
    idaEVolta,
    estado,
    economiaText,
    resultado: resultadoText
  });
}

function compararEconomia() {
  let precoGasolina = parseFloat(
    document.getElementById("precoGasolinaEconomia").value.replace(/\./g, "").replace(",", ".")
  );
  let precoEtanol = parseFloat(
    document.getElementById("precoEtanolEconomia").value.replace(/\./g, "").replace(",", ".")
  );
  let consumoGasolina = parseFloat(document.getElementById("consumoGasolinaEconomia").value);
  let consumoEtanol = parseFloat(document.getElementById("consumoEtanolEconomia").value);

  if (!precoGasolina || !precoEtanol || !consumoGasolina || !consumoEtanol) {
    document.getElementById("resultadoEconomia").innerText = "Por favor, preencha todos os campos.";
    return;
  }

  const custoPorKmGasolina = precoGasolina / consumoGasolina;
  const custoPorKmEtanol = precoEtanol / consumoEtanol;
  let resultadoEconomiaText = "";
  let economiaText = "";

  if (custoPorKmEtanol < custoPorKmGasolina) {
    economiaText = `É mais econômico abastecer com etanol.`;
    resultadoEconomiaText = `
      <div class="alert alert-success" role="alert">
        <i class="material-icons icon">check_circle</i> ${economiaText}
      </div>
    `;
  } else {
    economiaText = `É mais econômico abastecer com gasolina.`;
    resultadoEconomiaText = `
      <div class="alert alert-success" role="alert">
        <i class="material-icons icon">check_circle</i> ${economiaText}
      </div>
    `;
  }

  document.getElementById("resultadoEconomia").innerHTML = resultadoEconomiaText;

  salvarHistorico('economia', {
    precoGasolina,
    precoEtanol,
    consumoGasolina,
    consumoEtanol,
    economiaText,
    resultado: resultadoEconomiaText
  });
}

function limpar() {
  document.getElementById("distancia").value = "";
  document.getElementById("consumoGasolina").value = "";
  document.getElementById("consumoEtanol").value = "";
  document.getElementById("precoGasolina").value = "";
  document.getElementById("precoEtanol").value = "";
  document.getElementById("idaEVolta").checked = false;
  document.getElementById("resultado").innerHTML = "";
  document.getElementById("litros").innerHTML = "";
  document.getElementById("comparacao").innerHTML = "";
  document.getElementById("estado").value = "";
  document.getElementById("precoGasolina").disabled = false;
  document.getElementById("precoEtanol").disabled = false;
  document.getElementById("calcularBtn").disabled = true;
}

function limparEconomia() {
  document.getElementById("precoGasolinaEconomia").value = "";
  document.getElementById("precoEtanolEconomia").value = "";
  document.getElementById("resultadoEconomia").innerHTML = "";
  document.getElementById("compararBtn").disabled = true;
}

function salvarHistorico(tipo, dados) {
  const historico = JSON.parse(localStorage.getItem('historico')) || [];
  const timestamp = new Date().toLocaleString();
  historico.unshift({ tipo, dados, timestamp }); // Add new entries to the beginning
  localStorage.setItem('historico', JSON.stringify(historico));
  verificarHistorico();
}

function mostrarHistorico() {
  const historico = JSON.parse(localStorage.getItem('historico')) || [];
  const historicoList = document.getElementById('historicoList');
  historicoList.innerHTML = '';

  historico.forEach((item, index) => {
    const listItem = document.createElement('li');
    listItem.className = 'list-group-item';
    listItem.innerHTML = `
      <div>
        <strong class="text-primary">${item.tipo === 'custo' ? 'Cálculo de Custo de Viagem' : 'Comparação de Economia de Combustível'}</strong>
        <span class="text-muted">(${item.timestamp})</span>
      </div>
      ${item.dados.estado ? `<div><strong>Estado:</strong> ${item.dados.estado}</div>` : ''}
      ${item.dados.distancia ? `<div><strong>Distância:</strong> ${item.dados.distancia} km</div>` : ''}
      ${item.dados.consumoGasolina ? `<div><strong>Consumo Gasolina:</strong> ${item.dados.consumoGasolina} km/l</div>` : ''}
      ${item.dados.consumoEtanol ? `<div><strong>Consumo Etanol:</strong> ${item.dados.consumoEtanol} km/l</div>` : ''}
      ${item.dados.precoGasolina ? `<div><strong>Preço Gasolina:</strong> R$ ${item.dados.precoGasolina}</div>` : ''}
      ${item.dados.precoEtanol ? `<div><strong>Preço Etanol:</strong> R$ ${item.dados.precoEtanol}</div>` : ''}
      ${item.dados.economiaText ? `<div><strong>Economia:</strong> ${item.dados.economiaText}</div>` : ''}
      <div>${item.dados.resultado}</div>
    `;
    historicoList.appendChild(listItem);
  });

  const historicoModal = new bootstrap.Modal(document.getElementById('historicoModal'));
  historicoModal.show();
}

function limparHistorico() {
  localStorage.removeItem('historico');
  mostrarHistorico();
  verificarHistorico();
}

function verificarHistorico() {
  const historico = JSON.parse(localStorage.getItem('historico')) || [];
  const historicoBtn = document.getElementById('historicoBtn');
  if (historico.length === 0) {
    historicoBtn.disabled = true;
    historicoBtn.setAttribute('title', 'Ainda não há histórico');
  } else {
    historicoBtn.disabled = false;
    historicoBtn.removeAttribute('title');
  }
}

document.getElementById('historicoModal').addEventListener('hidden.bs.modal', function () {
  document.body.classList.remove('modal-open');
  document.body.style.paddingRight = '';
  const modalBackdrop = document.querySelector('.modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.remove();
  }
});

document.getElementById('historicoList').style.maxHeight = '400px';
document.getElementById('historicoList').style.overflowY = 'auto';

document.getElementById('historicoModal').addEventListener('hidden.bs.modal', function () {
  document.body.classList.remove('modal-open');
  document.body.style.paddingRight = '';
  const modalBackdrop = document.querySelector('.modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.remove();
  }
});

document.getElementById('historicoList').style.maxHeight = '400px';
document.getElementById('historicoList').style.overflowY = 'auto';
