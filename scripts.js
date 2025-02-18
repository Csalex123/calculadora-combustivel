document.addEventListener("DOMContentLoaded", async () => {
    const apiStatus = await testarConectividadeAPI();
    if (apiStatus) {
        document.getElementById("estadoContainer").style.display = "block";
        await carregarEstados();
        obterLocalizacao();
    } else {
        document.getElementById("estadoContainer").style.display = "none";
    }
    document.getElementById("precoGasolina").disabled = true;
    document.getElementById("precoEtanol").disabled = true;
    mostrarInterface('custo');
});

function mostrarInterface(interface) {
    limpar();
    limparEconomia();
    
    document.getElementById("formCusto").style.display = interface === 'custo' ? 'block' : 'none';
    document.getElementById("formEconomia").style.display = interface === 'economia' ? 'block' : 'none';
    
    // Remove a classe 'active' de todos os botões para evitar múltiplas ativações
    document.querySelectorAll('.btn-outline-primary, .btn-outline-secondary').forEach(btn => btn.classList.remove('active'));
  
    // Seleciona o botão corretamente sem usar crase
    const btnAtivo = document.querySelector(interface === 'custo' ? '.btn-outline-primary' : '.btn-outline-secondary');
    if (btnAtivo) {
      btnAtivo.classList.add('active');
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

    if (custoTotalGasolina !== null && custoTotalEtanol !== null) {
        const economia = custoTotalGasolina - custoTotalEtanol;
        const economiaPercentual = (economia / custoTotalGasolina) * 100;
        if (custoTotalEtanol < custoTotalGasolina) {
            document.getElementById(
                "comparacao"
            ).innerHTML = `
        <div class="alert alert-success" role="alert">
          <i class="material-icons icon">check_circle</i> É mais barato e econômico abastecer com etanol. Você economizará R$ ${economia.toFixed(2)} (${economiaPercentual.toFixed(2)}%).
        </div>
      `;
        } else {
            document.getElementById(
                "comparacao"
            ).innerHTML = `
        <div class="alert alert-success" role="alert">
          <i class="material-icons icon">check_circle</i> É mais barato e econômico abastecer com gasolina.
        </div>
      `;
        }
    } else {
        document.getElementById("comparacao").innerText = "";
    }
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

    if (custoPorKmEtanol < custoPorKmGasolina) {
        resultadoEconomiaText = `
      <div class="alert alert-success" role="alert">
        <i class="material-icons icon">check_circle</i> É mais econômico abastecer com etanol.
      </div>
    `;
    } else {
        resultadoEconomiaText = `
      <div class="alert alert-success" role="alert">
        <i class="material-icons icon">check_circle</i> É mais econômico abastecer com gasolina.
      </div>
    `;
    }

    document.getElementById("resultadoEconomia").innerHTML = resultadoEconomiaText;
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
