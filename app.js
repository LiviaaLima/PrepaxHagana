import { parseDateLocal, parseMoneyToNumber, formatCurrency } from './utils.js';
import { calcularDiasEDomingos } from './escalas.js';
import { identificarTransporte } from './transportes.js';
import { calcularVT } from './vt.js';
import { createPassagemCard } from './ui.js';

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

function renderLog(dias, domingos, escala, periodo, vtData, passagens) {
    if (dias === 0) {
        dom.logCalculo.textContent = "Selecione um intervalo de datas válido para iniciar o cálculo.";
        return;
    }

    let passagensLog = passagens.map(p => `${p.nome}: ${formatCurrency(p.valor)}`).join('\n  ');

    let log = `Escala: ${escala}\nPeríodo: ${periodo === 'diurno' ? 'Diurno' : 'Noturno'}\n\n`;
    log += `Dias totais trabalhados: ${dias}\nDomingos trabalhados: ${domingos}\nDias normais (sem domingo): ${vtData.diasSemDomingo}\n\n`;
    log += `Passagens Registradas:\n  ${passagensLog || 'Nenhuma'}\n\n`;
    log += `Valor diário (Ida): ${formatCurrency(vtData.valorIda)}\n`;
    log += `Valor diário (Ida e Volta): ${formatCurrency(vtData.valorIdaEVolta)}\n\n`;
    
    if (domingos > 0 && passagens.length > 0) {
        log += `Análise de Domingos:\n`;
        log += vtData.logLines.join('\n') + '\n';
        log += `Custo total de 1 domingo: ${formatCurrency(vtData.custoDomingo)}\n\n`;
    }

    log += `Cálculo Matemático:\n`;
    log += `(${formatCurrency(vtData.valorIdaEVolta)} × ${vtData.diasSemDomingo} dias normais) + `;
    log += `(${formatCurrency(vtData.custoDomingo)} × ${domingos} domingos)\n`;
    log += `Total = ${formatCurrency(vtData.vtFinal)}`;

    dom.logCalculo.textContent = log;
}

function updateApp() {
    const di = parseDateLocal(dom.dataInicio.value);
    const df = parseDateLocal(dom.dataFechamento.value);
    const escala = dom.escala.value;
    const periodo = getPeriodo();

    const { diasTrabalhados, domingos } = calcularDiasEDomingos(di, df, escala);
    const passagens = getPassagensAtuais();

    dom.resDias.textContent = diasTrabalhados;
    dom.resDomingos.textContent = domingos;

    if (diasTrabalhados > 0 && passagens.length > 0) {
        const vtData = calcularVT(diasTrabalhados, domingos, passagens, periodo);
        dom.resVt.textContent = formatCurrency(vtData.vtFinal);
        renderLog(diasTrabalhados, domingos, escala, periodo, vtData, passagens);
    } else {
        dom.resVt.textContent = 'R$ 0,00';
        renderLog(diasTrabalhados, domingos, escala, periodo, { valorIda:0, valorIdaEVolta:0, custoDomingo:0, vtFinal:0, logLines:[], diasSemDomingo:0 }, passagens);
    }
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

addPassagem();
