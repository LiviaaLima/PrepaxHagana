import { parseDateLocal, parseMoneyToNumber, formatCurrency } from './utils.js';
import { calcularDiasEDomingos } from './escalas.js';
import { identificarTransporte } from './transportes.js';
import { calcularVT } from './vt.js';
import { createPassagemCard } from './ui.js';
import { processarArquivoExcel, buscarParticularidadesPosto, extrairValorDoTexto } from './excel.js';

let passagemCount = 0;

const dom = {
    dataInicio: document.getElementById('data-inicio'),
    dataFechamento: document.getElementById('data-fechamento'),
    escala: document.getElementById('escala'),
    radiosPeriodo: document.getElementsByName('periodo'),
    passagensContainer: document.getElementById('passagens-container'),
    btnAddPassagem: document.getElementById('btn-add-passagem'),
    resDias: document.getElementById('res-dias'),
    resDomingos: document.getElementById('res-domingos'),
    resVt: document.getElementById('res-vt'),
    alertaParticularidade: document.getElementById('alerta-particularidade'),
    codigoPosto: document.getElementById('codigo-posto'),
    uploadExcel: document.getElementById('upload-excel'),
    logCalculo: document.getElementById('log-calculo')
};

function getPeriodo() {
    let selecionado;
    dom.radiosPeriodo.forEach(r => { if (r.checked) selecionado = r.value; });
    return selecionado;
}

function getPassagensAtuais() {
    const passagens = [];
    document.querySelectorAll('.passagem-card').forEach(card => {
        const id = card.dataset.id;
        const valorRaw = card.querySelector('.input-valor').value;
        const valor = parseMoneyToNumber(valorRaw);
        
        if (valor > 0) {
            const transporte = identificarTransporte(valor);
            const isCustomDesc = card.querySelector(`#desc-domingo-${id}`).checked;
            
            passagens.push({
                valor,
                tipo: transporte.tipo,
                nome: transporte.nome,
                descontoDomingo: transporte.isCustom ? isCustomDesc : transporte.descontoDomingo
            });
        }
    });
    return passagens;
}

function updateApp() {
    const di = parseDateLocal(dom.dataInicio.value);
    let df = parseDateLocal(dom.dataFechamento.value);
    const escala = dom.escala.value;
    const periodo = getPeriodo();
    const codigoPosto = dom.codigoPosto ? dom.codigoPosto.value : '';

    // Esconde o card de alerta por padrão
    dom.alertaParticularidade.style.display = 'none';
    dom.alertaParticularidade.textContent = '';

    let vtFixoEspecie = null;
    let ehVtMensalEmEspecie = false;

    // 1. CONFERIR PLANILHA
    const registroPosto = buscarParticularidadesPosto(codigoPosto);
    if (registroPosto) {
        // Encontra as chaves corretas ignorando espaços extras nas colunas
        const chaveParticularidades = Object.keys(registroPosto).find(k => k.trim().toUpperCase() === 'PARTICULARIDADES');
        const chaveCliente = Object.keys(registroPosto).find(k => k.trim().toUpperCase() === 'CLIENTE');

        const textoObs = chaveParticularidades ? (registroPosto[chaveParticularidades] || '') : '';
        const nomeCliente = chaveCliente ? (registroPosto[chaveCliente] || '') : '';
        
        if (textoObs) {
            // MOSTRA O ALERTA NA TELA COM O TEXTO EXATO DA PLANILHA
            dom.alertaParticularidade.innerHTML = `<strong>Posto ${codigoPosto} - ${nomeCliente}:</strong> ${textoObs}`;
            dom.alertaParticularidade.style.display = 'block';

            // Tenta identificar se o texto fala sobre "VT R$" em dinheiro
            const vtExtraido = extrairValorDoTexto(textoObs, "VT");
            if (vtExtraido) {
                vtFixoEspecie = vtExtraido;
                ehVtMensalEmEspecie = true;
            }
        }
    }

    // Regra de Fechamento (Corte dia 5) para VT em dinheiro
    if (ehVtMensalEmEspecie && di) {
        df = new Date(di.getFullYear(), di.getMonth(), 5);
        if (di > df) {
            df = new Date(di.getFullYear(), di.getMonth() + 1, 5);
        }
    }

    const { diasTrabalhados, domingos } = calcularDiasEDomingos(di, df, escala);
    const passagens = getPassagensAtuais();

    dom.resDias.textContent = diasTrabalhados;
    dom.resDomingos.textContent = domingos;

    // 2. EXIBIR VALOR DO VT
    if (diasTrabalhados > 0 && (passagens.length > 0 || vtFixoEspecie)) {
        const vtData = calcularVT(diasTrabalhados, domingos, passagens, periodo, vtFixoEspecie);
        dom.resVt.textContent = formatCurrency(vtData.vtFinal);
        renderLog(diasTrabalhados, domingos, escala, periodo, vtData, passagens, df);
    } else {
        dom.resVt.textContent = 'R$ 0,00';
        renderLog(diasTrabalhados, domingos, escala, periodo, { valorIda:0, valorIdaEVolta:0, custoDomingo:0, vtFinal:0, logLines:[], diasSemDomingo:0 }, passagens, df);
    }
}

function renderLog(dias, domingos, escala, periodo, vtData, passagens, dataFechamentoUtilizada) {
    if (dias === 0) {
        dom.logCalculo.textContent = "Selecione as datas e certifique-se de carregar sua planilha.";
        return;
    }

    const dfFormatada = dataFechamentoUtilizada ? dataFechamentoUtilizada.toLocaleDateString('pt-BR') : '';
    let passagensLog = passagens.map(p => `${p.nome}: ${formatCurrency(p.valor)}`).join('\n  ');

    let log = `Escala: ${escala} | Período: ${periodo === 'diurno' ? 'Diurno' : 'Noturno'}\n`;
    log += `Corte considerado no cálculo: ${dfFormatada}\n`;
    log += `Dias calculados: ${dias} (Domingos: ${domingos})\n\n`;
    log += `Cálculo de VT:\n`;
    if (vtData.logLines.length > 0) log += vtData.logLines.join('\n') + '\n';
    log += `Total VT = ${formatCurrency(vtData.vtFinal)}`;

    dom.logCalculo.textContent = log;
}

function addPassagem() {
    passagemCount++;
    const card = createPassagemCard(passagemCount, updateApp, updateApp);
    dom.passagensContainer.appendChild(card);
}

dom.dataInicio.addEventListener('change', updateApp);
dom.dataFechamento.addEventListener('change', updateApp);
dom.escala.addEventListener('change', updateApp);
dom.radiosPeriodo.forEach(r => r.addEventListener('change', updateApp));
dom.btnAddPassagem.addEventListener('click', addPassagem);

if(dom.uploadExcel) {
    dom.uploadExcel.addEventListener('change', (e) => {
        if (e.target.files.length > 0) processarArquivoExcel(e.target.files[0], updateApp);
    });
}
if(dom.codigoPosto) dom.codigoPosto.addEventListener('input', updateApp);

addPassagem();
