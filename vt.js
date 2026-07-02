import { formatCurrency } from './utils.js';

export function calcularVT(dias, domingos, passagens, periodo) {
    let valorIda = 0;
    let valorIdaEVolta = 0;
    let custoDomingo = 0; 
    let logLines = [];

    passagens.forEach(p => {
        valorIda += p.valor;
        const idaVolta = p.valor * 2;
        valorIdaEVolta += idaVolta;

        let valorDiaDomingo = idaVolta; // Custo base do domingo se não houvesse desconto

        if (p.tipo === 'integracao') {
            // Regra da integração: 9.38 - Metrô (5.40) = Ônibus (3.98)
            const valorMetro = 5.40;
            if (periodo === 'diurno') {
                valorDiaDomingo = valorMetro * 2; // Desconta ônibus ida e volta
                logLines.push(`- Integração: Ônibus ida e volta descontados. Metrô mantido (${formatCurrency(valorDiaDomingo)}/domingo).`);
            } else {
                // Noturno: Desconta apenas a ida do ônibus no domingo. 
                // Ida domingo = Metrô (5.40) | Volta segunda = Integração cheia (9.38)
                valorDiaDomingo = valorMetro + p.valor;
                logLines.push(`- Integração (Noturno): Desconto apenas da ida do ônibus no domingo (${formatCurrency(valorDiaDomingo)}/domingo).`);
            }
        } else if (p.descontoDomingo) {
            if (periodo === 'diurno') {
                valorDiaDomingo = 0; // Ônibus SP grátis
                logLines.push(`- ${p.nome}: Desconto integral no domingo (${formatCurrency(valorDiaDomingo)}).`);
            } else {
                valorDiaDomingo = p.valor; // Noturno: Paga só a volta na segunda
                logLines.push(`- ${p.nome} (Noturno): Desconto apenas na ida do domingo (${formatCurrency(valorDiaDomingo)}/domingo).`);
            }
        } else {
            logLines.push(`- ${p.nome}: Mantido valor integral no domingo (${formatCurrency(valorDiaDomingo)}).`);
        }

        custoDomingo += valorDiaDomingo;
    });

    const diasSemDomingo = dias - domingos;
    const custoDiasNormais = valorIdaEVolta * diasSemDomingo;
    const custoTotalDomingos = custoDomingo * domingos;
    const vtFinal = custoDiasNormais + custoTotalDomingos;

    return {
        valorIda,
        valorIdaEVolta,
        custoDomingo,
        vtFinal,
        logLines,
        diasSemDomingo
    };
}