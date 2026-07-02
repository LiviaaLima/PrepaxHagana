export function identificarTransporte(valorNum) {
    if (valorNum === 5.30) {
        return { nome: 'Ônibus Municipal SP', descontoDomingo: true, tipo: 'onibus', isCustom: false };
    }
    if (valorNum === 5.40) {
        return { nome: 'Metrô', descontoDomingo: false, tipo: 'metro', isCustom: false };
    }
    if (valorNum === 9.38) {
        return { nome: 'Integração (Ônibus + Metrô)', descontoDomingo: true, tipo: 'integracao', isCustom: false };
    }
    return { nome: 'Transporte Personalizado', descontoDomingo: false, tipo: 'custom', isCustom: true };
}