import { isSunday, addDays } from './datas.js';

// Retorna o ciclo para escalas que são puramente rotativas (trabalha/folga)
function getCicloEscalaRotativa(escala) {
    switch(escala) {
        case '12x36': return [true, false];
        case '5x1':   return [true, true, true, true, true, false];
        case '4x2':   return [true, true, true, true, false, false]; 
        default:      return null; // Retorna null para escalas fixas por dias da semana
    }
}

export function calcularDiasEDomingos(di, df, tipoEscala) {
    if (!di || !df || di > df) return { diasTrabalhados: 0, domingos: 0 };

    let diasTrabalhados = 0;
    let domingos = 0;
    let dataAtual = new Date(di);
    
    // A data final deve ser incluída inteiramente no cálculo
    const dataFinal = new Date(df);
    dataFinal.setHours(23, 59, 59, 999);

    // Verifica se a escala é rotativa/cíclica
    const cicloRotativo = getCicloEscalaRotativa(tipoEscala);

    if (cicloRotativo) {
        // --- LÓGICA PARA ESCALAS CÍCLICAS (12x36, 5x1, 4x2) ---
        // Seguem o fluxo contínuo a partir da Data de Início (DI)
        let indexCiclo = 0;
        while (dataAtual <= dataFinal) {
            const trabalhaHoje = cicloRotativo[indexCiclo % cicloRotativo.length];
            
            if (trabalhaHoje) {
                diasTrabalhados++;
                if (isSunday(dataAtual)) {
                    domingos++;
                }
            }
            
            dataAtual = addDays(dataAtual, 1);
            indexCiclo++;
        }
    } else {
        // --- LÓGICA CORRIGIDA PARA ESCALAS BASEADAS NO DIA DA SEMANA (5x2, 6x1) ---
        // Independente de quando começou, a folga depende estritamente do dia da semana
        while (dataAtual <= dataFinal) {
            const diaDaSemana = dataAtual.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
            let trabalhaHoje = false;

            if (tipoEscala === '5x2') {
                // Trabalha de Segunda (1) a Sexta (5). Sábado (6) e Domingo (0) são folgas.
                if (diaDaSemana >= 1 && diaDaSemana <= 5) {
                    trabalhaHoje = true;
                }
            } else if (tipoEscala === '6x1') {
                // Trabalha de Segunda (1) a Sábado (6). Domingo (0) é folga.
                if (diaDaSemana >= 1 && diaDaSemana <= 6) {
                    trabalhaHoje = true;
                }
            }

            if (trabalhaHoje) {
                diasTrabalhados++;
                if (diaDaSemana === 0) { // Se for domingo (embora na 5x2 e 6x1 o domingo seja folga, a validação fica aqui por segurança caso haja exceções futuras)
                    domingos++;
                }
            }

            dataAtual = addDays(dataAtual, 1);
        }
    }

    return { diasTrabalhados, domingos };
}
