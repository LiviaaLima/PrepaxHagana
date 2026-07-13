let dadosPlanilha = [];

export function processarArquivoExcel(file, callback) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Carrega o Excel como Array de Objetos brutos
        dadosPlanilha = XLSX.utils.sheet_to_json(worksheet);
        
        console.log("Planilha carregada! Total de linhas encontradas:", dadosPlanilha.length);
        if (callback) callback();
    };
    
    reader.readAsArrayBuffer(file);
}

export function buscarParticularidadesPosto(codigoPosto) {
    if (!codigoPosto || dadosPlanilha.length === 0) return null;
    
    const postoBuscado = String(codigoPosto).trim();

    // Faz a varredura linha por linha na planilha carregada
    return dadosPlanilha.find(linha => {
        // Encontra a chave da coluna ignorando espaços extras (ex: 'POSTO ', 'Posto', etc)
        const chavePosto = Object.keys(linha).find(k => k.trim().toUpperCase() === 'POSTO');
        if (!chavePosto) return false;

        const valorPostoPlanilha = String(linha[chavePosto] || '').trim();
        return valorPostoPlanilha === postoBuscado;
    });
}

export function extrairValorDoTexto(texto, chave) {
    if (!texto) return null;
    const textoUpper = texto.toUpperCase();
    if (!textoUpper.includes(chave)) return null;
    
    // Procura por números após a palavra chave (Ex: VT R$ 18,50 ou VT 18.50)
    const regex = new RegExp(chave + '\\s*(?:R\\$\\s*)?([0-9.,]+)', 'i');
    const match = textoUpper.match(regex);
    
    if (match && match[1]) {
        let valorLimpo = match[1].replace('.', '').replace(',', '.');
        return parseFloat(valorLimpo) || null;
    }
    return null;
}