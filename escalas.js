import { isSunday, addDays } from './datas.js';

// Retorna array de booleanos representando o ciclo (true=trabalha, false=folga)
function getCicloEscala(escala) {
    switch(escala) {
        case '12x36': return [true, false];
        case '5x1': return [true, true, true, true, true, false];
        case '6x1': return [true, true, true, true, true, true, false];
        case '5x2': return [true, true, true, true, true, false, false];
        default: return [true];
    }
}

export function calcularDiasEDomingos(di, df, tipoEscala) {
    if (!di || !df || di > df) return { diasTrabalhados: 0, domingos: 0 };

    const ciclo = getCicloEscala(tipoEscala);
    let diasTrabalhados = 0;
    let domingos = 0;
    let dataAtual = new Date(di);
    let indexCiclo = 0;

    // A data final deve ser incluída no cálculo
    const dataFinal = new Date(df);
    dataFinal.setHours(23, 59, 59, 999);

    while (dataAtual <= dataFinal) {
        const trabalhaHoje = ciclo[indexCiclo % ciclo.length];
        
        if (trabalhaHoje) {
            diasTrabalhados++;
            if (isSunday(dataAtual)) {
                domingos++;
            }
        }
        
        dataAtual = addDays(dataAtual, 1);
        indexCiclo++;
    }

    return { diasTrabalhados, domingos };
}