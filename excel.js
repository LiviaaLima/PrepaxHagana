let dadosPlanilha = [];

export function processarArquivoExcel(file, callback) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converte as linhas da planilha mapeando as colunas
        dadosPlanilha = XLSX.utils.sheet_to_json(worksheet);
        
        console.log("Planilha carregada com sucesso! Total de registros:", dadosPlanilha.length);
        if (callback) callback();
    };
    
    reader.readAsArrayBuffer(file);
}

export function buscarParticularidadesPosto(codigoPosto) {
    if (!codigoPosto || dadosPlanilha.length === 0) return null;
    
    // Varre a planilha comparando o código da coluna POSTO
    return dadosPlanilha.find(linha => {
        const postoPlanilha = String(linha.POSTO || linha['Posto'] || '').trim();
        return postoPlanilha === String(codigoPosto).trim();
    });
}

// Extrai números de strings como "VT R$ 18,50" ou "VR R$ 40,12"
export function extrairValorDoTexto(texto, chave) {
    if (!texto) return null;
    const textoUpper = texto.toUpperCase();
    if (!textoUpper.includes(chave)) return null;
    
    const regex = new RegExp(chave + '\\s*(?:R\\$\\s*)?([0-9.,]+)', 'i');
    const match = textoUpper.match(regex);
    
    if (match && match[1]) {
        let valorLimpo = match[1].replace('.', '').replace(',', '.');
        return parseFloat(valorLimpo) || null;
    }
    return null;
}
