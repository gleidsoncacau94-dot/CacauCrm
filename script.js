let leads = JSON.parse(localStorage.getItem('crm_leads')) || [];
let metaContratos = parseInt(localStorage.getItem('crm_meta_contratos')) || 0;

let colunasExpandidas = { contato: false, proposta: false, fechado: false };

function abrirModal() { 
    document.getElementById('modal').style.display = 'flex'; 
}

function fecharModal() { 
    document.getElementById('modal').style.display = 'none'; 
    limparCampos(); 
}

function limparCampos() {
    document.getElementById('nome').value = '';
    document.getElementById('telefone').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('notas').value = '';
}

function configuringMeta() { /* mantida assinatura por compatibilidade */ configurarMeta(); }
function configurarMeta() {
    const novaMeta = prompt("Quantos contratos/vidas você quer fechar este mês? (Digite apenas o número):", metaContratos);
    if (novaMeta !== null) {
        metaContratos = parseInt(novaMeta) || 0;
        localStorage.setItem('crm_meta_contratos', metaContratos);
        atualizarCRM();
    }
}

function salvarLead() {
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value.replace(/\D/g, ''); // Remove letras e parênteses do telefone
    const valorInput = document.getElementById('valor').value;
    const notas = document.getElementById('notas').value;

    if (!nome) return alert('Digite ao menos o nome do cliente!');

    const valorNumerico = parseFloat(valorInput.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

    const dataAtual = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const novoLead = {
        id: Date.now().toString(),
        nome,
        telefone, // Salva o número limpo
        valor: valorNumerico,
        notas,
        etapa: 'contato',
        data: dataAtual
    };

    leads.push(novoLead);
    atualizarCRM();
    fecharModal();
}

function atualizarCRM() {
    localStorage.setItem('crm_leads', JSON.stringify(leads));
    buscarLeads();
}

function alternarVerMais(etapa) {
    colunasExpandidas[etapa] = !colunasExpandidas[etapa];
    buscarLeads();
}

function buscarLeads() {
    const buscaInput = document.getElementById('busca');
    const termo = buscaInput ? buscaInput.value.toLowerCase() : '';
    
    document.getElementById('col-contato').innerHTML = '';
    document.getElementById('col-proposta').innerHTML = '';
    document.getElementById('col-fechado').innerHTML = '';

    const colunasFisicas = {
        contato: document.getElementById('col-contato').parentElement,
        proposta: document.getElementById('col-proposta').parentElement,
        fechado: document.getElementById('col-fechado').parentElement
    };

    let contadores = { contato: 0, proposta: 0, fechado: 0 };
    let etapasComMatch = { contato: false, proposta: false, fechado: false };

    document.querySelectorAll('.aviso-oculto').forEach(el => el.remove());

    leads.forEach(lead => {
        const correspondeNome = lead.nome.toLowerCase().includes(termo);
        const correspondeNotas = lead.notas && lead.notas.toLowerCase().includes(termo);

        if (correspondeNome || correspondeNotas) {
            etapasComMatch[lead.etapa] = true;
            contadores[lead.etapa] += 1;

            if (contadores[lead.etapa] > 4 && !colunasExpandidas[lead.etapa] && termo.length === 0) {
                return; 
            }

            const card = document.createElement('div');
            card.className = "drag-card";
            
            const valorFormatado = lead.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            // Monta o link do WhatsApp se o telefone existir
            let botaoWhatsHTML = '';
            if (lead.telefone) {
                // Mensagem personalizada automática
                const mensagem = encodeURIComponent(`Olá ${lead.nome}, tudo bem? Aqui é o Gleidson do CacauCrm.`);
                botaoWhatsHTML = `<a href="https://wa.me{lead.telefone}?text=${mensagem}" target="_blank" class="btn-whatsapp">💬 WhatsApp</a>`;
            }

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    <h4 style="font-weight: bold; margin: 0;">${lead.nome}</h4>
                    ${botaoWhatsHTML}
                </div>
                <p class="valor" style="margin-top: 4px;">${valorFormatado}</p>
                <p class="notas">${lead.notas || 'Sem anotações'}</p>
                <span style="font-size: 11px; color: #64748b; display: block; margin-top: 10px; font-style: italic;">📅 Cadastrado em: ${lead.data || 'N/A'}</span>
                <div class="card-acoes" style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #475569; display: flex; justify-content: space-between;">
                    <button onclick="mudarEtapa('${lead.id}')" style="color: #818cf8; text-decoration: underline; font-weight: 500; background: none; border: none; font-size: 12px; cursor: pointer;">Mover Etapa ➜</button>
                    <button onclick="excluirLead('${lead.id}')" style="color: #f87171; text-decoration: underline; background: none; border: none; font-size: 12px; cursor: pointer;">Excluir</button>
                </div>
            `;

            document.getElementById(`col-${lead.etapa}`).appendChild(card);
        }
    });

    Object.keys(contadores).forEach(etapa => {
        const containerCards = document.getElementById(`col-${etapa}`);
        
        if (colunasExpandidas[etapa]) {
            containerCards.style.overflowY = "auto";
        } else {
            containerCards.style.overflowY = "hidden";
        }

        if (contadores[etapa] > 4 && termo.length === 0) {
            const botaoVerMais = document.createElement('button');
            botaoVerMais.className = "aviso-oculto";
            botaoVerMais.style.width = "100%";
            botaoVerMais.style.cursor = "pointer";
            
            if (colunasExpandidas[etapa]) {
                botaoVerMais.innerText = `▲ Recolher lista (Mostrando todos)`;
                botaoVerMais.style.backgroundColor = "#334155";
            } else {
                botaoVerMais.innerText = `🔽 Ver Mais (+${contadores[etapa] - 4} ocultos)`;
            }
            
            botaoVerMais.onclick = () => alternarVerMais(etapa);
            containerCards.parentElement.appendChild(botaoVerMais);
        }
    });

    document.getElementById('titulo-contato').innerText = `📌 Contato Inicial (${contadores.contato})`;
    document.getElementById('titulo-proposta').innerText = `📄 Proposta Enviada (${contadores.proposta})`;
    document.getElementById('titulo-fechado').innerText = `🎉 Contrato Fechado (${contadores.fechado})`;

    document.getElementById('faturamento-fechado').innerText = contadores.fechado;
    document.getElementById('valor-meta').innerText = metaContratos;
    
    let porcentagemMeta = metaContratos > 0 ? (contadores.fechado / metaContratos) * 100 : 0;
    if (porcentagemMeta > 100) porcentagemMeta = 100;
    document.getElementById('barra-meta-progresso').style.width = `${porcentagemMeta}%`;

    Object.keys(colunasFisicas).forEach(etapa => {
        if (termo.length > 0) {
            colunasFisicas[etapa].style.setProperty('display', etapasComMatch[etapa] ? 'block' : 'none', 'important');
        } else {
            colunasFisicas[etapa].style.setProperty('display', 'block', 'important');
        }
    });
}

function mudarEtapa(id) {
    leads = leads.map(lead => {
        if (lead.id === id) {
            if (lead.etapa === 'contato') lead.etapa = 'proposta';
            else if (lead.etapa === 'proposta') lead.etapa = 'fechado';
            else lead.etapa = 'contato';
        }
        return lead;
    });
    atualizarCRM();
}

function permitirSoltar(e) { e.preventDefault(); }
function soltar(e, novaEtapa) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    leads = leads.map(lead => lead.id === id ? { ...lead, etapa: novaEtapa } : lead);
    atualizarCRM();
}

function excluirLead(id) {
    if(confirm("Tem certeza que deseja excluir este cliente?")) {
        leads = leads.filter(lead => lead.id !== id);
        atualizarCRM();
    }
}

setTimeout(atualizarCRM, 300);
