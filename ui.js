import { identificarTransporte } from './transportes.js';
import { parseMoneyToNumber } from './utils.js';

export function createPassagemCard(id, onUpdate, onRemove) {
    const card = document.createElement('div');
    card.className = 'passagem-card';
    card.dataset.id = id;

    card.innerHTML = `
        <div class="passagem-header">
            <strong>Passagem #${id}</strong>
            <span class="tipo-badge" id="badge-${id}">Aguardando valor...</span>
        </div>
        <div class="form-group">
            <label>Valor (R$)</label>
            <input type="text" placeholder="Ex: 5,30" class="input-valor" id="valor-${id}">
        </div>
        <div class="form-group custom-config" id="custom-${id}" style="display: none;">
            <label>
                <input type="checkbox" id="desc-domingo-${id}"> 
                Descontar domingos (Transporte personalizado)
            </label>
        </div>
        <button type="button" class="btn btn-danger btn-remove">Remover passagem</button>
    `;

    const inputValor = card.querySelector('.input-valor');
    const badge = card.querySelector('.tipo-badge');
    const customConfig = card.querySelector('.custom-config');
    const checkDescDomingo = card.querySelector(`#desc-domingo-${id}`);

    inputValor.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^0-9,]/g, '');
        e.target.value = val;
        
        const num = parseMoneyToNumber(val);
        const transporte = identificarTransporte(num);
        
        badge.textContent = transporte.nome;
        
        if (transporte.isCustom && num > 0) {
            customConfig.style.display = 'block';
        } else {
            customConfig.style.display = 'none';
            checkDescDomingo.checked = transporte.descontoDomingo;
        }
        onUpdate();
    });

    checkDescDomingo.addEventListener('change', onUpdate);

    card.querySelector('.btn-remove').addEventListener('click', () => {
        card.remove();
        onRemove();
    });

    return card;
}