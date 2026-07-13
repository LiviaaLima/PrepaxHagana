import { parseDateLocal, parseMoneyToNumber, formatCurrency } from './utils.js';
import { calcularDiasEDomingos } from './escalas.js';
import { identificarTransporte } from './transportes.js';
import { calcularVT } from './vt.js';
import { createPassagemCard } from './ui.js';

let passagemCount = 0;
// Array bruto para armazenar as linhas de todas as abas da planilha carregada
let dadosPlanilhaRaw = [];

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
    logCalculo: document.getElementById('log-calculo'),
    // Elementos do Excel / Posto
    alertaParticularidade: document.getElementById('alerta-particularidade'),
    codigoPosto: document.getElementById('codigo-posto'),
    uploadExcel: document.getElementById('upload-excel'),
    btnVerificarPosto: document.getElementById('btn-verificar-posto')
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

// Nova função isolada para verificar e exibir as particularidades
function verificarPosto(silencioso = false) {
    if (!dom.alertaParticularidade) return;

    const codigoInput = dom.codigoPosto ? dom.codigoPosto.value.trim() : '';

    if (!codigoInput) {
        dom.alertaParticularidade.style.display = 'none';
        dom.alertaParticularidade.innerHTML = '';
        if (!silencioso) {
            alert("Por favor, digite o código do posto para verificar.");
        }
        return;
    }

    if (dadosPlanilhaRaw.length === 0) {
        dom.alertaParticularidade.style.display = 'none';
        dom.alertaParticularidade.innerHTML = '';
        if (!silencioso) {
            alert("Por favor, faça a importação de uma planilha primeiro.");
        }
        return;
    }

    let foundParticularities = [];
    let currentSection = "";

    // Leitura bruta linha por linha para contornar qualquer variação de layout ou cabeçalho
    for (let i = 0; i < dadosPlanilhaRaw.length; i++) {
        const row = dadosPlanilhaRaw[i];
        if (!row || row.length === 0) continue;

        const col0 = String(row[0] || '').trim().toUpperCase();

        // Identifica as sessões da planilha e as rastreia dinamicamente
        if (col0.includes('CONVÊNIO') || col0.includes('CONVENIO')) {
            currentSection = "CONVÊNIO";
            continue;
        }
        if (col0.includes('VALE TRANSPORTE') || col0.includes('VALE_TRANSPORTE') || col0.includes('VALE-TRANSPORTE')) {
            currentSection = "VALE TRANSPORTE";
            continue;
        }

        // Ignora cabeçalhos internos de colunas
        if (col0 === 'POSTO') {
            continue;
        }

        // Se bater com o número do posto digitado
        const targetPostoStr = String(codigoInput).trim();
        if (col0 === targetPostoStr) {
            const cliente = row[1] ? String(row[1]).trim() : '';
            const particularidade = row[2] ? String(row[2]).trim() : '';

            if (particularidade) {
                foundParticularities.push({
                    secao: currentSection || "Geral",
                    cliente: cliente,
                    texto: particularidade
                });
            }
        }
    }

    // Exibe os alertas correspondentes de forma personalizada
    if (foundParticularities.length > 0) {
        dom.alertaParticularidade.style.backgroundColor = '#FFF9E6';
        dom.alertaParticularidade.style.borderLeftColor = '#D97706';
        dom.alertaParticularidade.style.color = '#B45309';

        let html = `<div class="alerta-titulo">⚠️ Particularidades Encontradas para o Posto ${codigoInput}:</div>`;
        foundParticularities.forEach(item => {
            const badgeClass = item.secao === 'CONVÊNIO' ? 'badge-convenio' : (item.secao === 'VALE TRANSPORTE' ? 'badge-vt' : 'badge-geral');
            html += `
                <div class="alerta-item">
                    <span class="badge-secao ${badgeClass}">${item.secao}</span>
                    <strong>Cliente:</strong> ${item.cliente || 'Não informado'}<br>
                    <strong>Particularidade:</strong> ${item.texto}
                </div>
            `;
        });
        dom.alertaParticularidade.innerHTML = html;
        dom.alertaParticularidade.style.display = 'block';
    } else {
        if (silencioso) {
            dom.alertaParticularidade.style.display = 'none';
            dom.alertaParticularidade.innerHTML = '';
        } else {
            // Mostra um aviso informativo cinza caso a consulta ocorra mas não ache nada
            dom.alertaParticularidade.style.backgroundColor = '#F3F4F6';
            dom.alertaParticularidade.style.borderLeftColor = '#9CA3AF';
            dom.alertaParticularidade.style.color = '#1F2937';
            dom.alertaParticularidade.innerHTML = `
                <div class="alerta-titulo" style="color: #4B5563;">ℹ️ Consulta de Posto</div>
                <div style="color: #4B5563;">Nenhuma particularidade encontrada na planilha para o posto <strong>${codigoInput}</strong>.</div>
            `;
            dom.alertaParticularidade.style.display = 'block';
        }
    }
}

function updateApp() {
    // Mantém a busca de posto atualizada silenciosamente quando dados da escala mudarem
    verificarPosto(true);

    // SEU CÓDIGO DE CÁLCULO ORIGINAL (100% PRESERVADO)
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

// Eventos Relacionados à Planilha e Verificação do Posto
if (dom.uploadExcel) {
    dom.uploadExcel.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = window.XLSX.read(data, { type: 'array' });
                    
                    dadosPlanilhaRaw = [];
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        // Carrega todas as células como uma matriz bruta de strings/números
                        const rows = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        dadosPlanilhaRaw.push(...rows);
                    });

                    alert("Planilha importada com sucesso! Digite um posto e clique em 'Verificar'.");
                    verificarPosto(true);
                } catch (err) {
                    console.error("Erro ao ler arquivo de planilha:", err);
                    alert("Erro ao ler a planilha. Certifique-se de carregar um arquivo .xlsx ou .csv válido.");
                }
            };
            reader.readAsArrayBuffer(file);
        }
    });
}

if (dom.btnVerificarPosto) {
    dom.btnVerificarPosto.addEventListener('click', () => verificarPosto(false));
}

if (dom.codigoPosto) {
    dom.codigoPosto.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            verificarPosto(false);
        }
    });
}

addPassagem();