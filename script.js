let leads = JSON.parse(localStorage.getItem('crm_leads')) || [];

function abrirModal() { 
    document.getElementById('modal').style.display = 'flex'; 
}

function fecharModal() { 
    document.getElementById('modal').style.display = 'none'; 
    limparCampos(); 
}

function limparCampos() {
    document.getElementById('nome').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('notas').value = '';
}

function salvarLead() {
    const nome = document.getElementById('nome').value;
    const valor = document.getElementById('valor').value;
    const notas = document.getElementById('notas').value;

    if (!nome) return alert('Digite ao menos o nome do cliente!');

    const dataAtual = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const novoLead = {
        id: Date.now().toString(),
        nome,
        valor: valor || '0',
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

function buscarLeads() {
    const buscaInput = document.getElementById('busca');
    const termo = buscaInput ? buscaInput.value.toLowerCase() : '';
    
    // Limpa os containers antes de renderizar
    document.getElementById('col-contato').innerHTML = '';
    document.getElementById('col-proposta').innerHTML = '';
    document.getElementById('col-fechado').innerHTML = '';

    // Mapeia os elementos das colunas completas para controle de visibilidade
    const colunasFisicas = {
        contato: document.getElementById('col-contato').parentElement,
        proposta: document.getElementById('col-proposta').parentElement,
        fechado: document.getElementById('col-fechado').parentElement
    };

    // Guarda quais etapas possuem clientes correspondentes à busca
    let etapasComMatch = { contato: false, proposta: false, fechado: false };

    leads.forEach(lead => {
        const correspondeNome = lead.nome.toLowerCase().includes(termo);
        const correspondeNotas = lead.notas && lead.notas.toLowerCase().includes(termo);

        if (correspondeNome || correspondeNotas) {
            etapasComMatch[lead.etapa] = true; // Marca que essa etapa tem o cliente buscado

            const card = document.createElement('div');
            card.className = "drag-card";
            
            card.innerHTML = `
                <h4 style="font-weight: bold; margin-top: 0; margin-bottom: 6px; font-size: 16px; color: #fff;">${lead.nome}</h4>
                <p class="valor" style="margin: 0; font-size: 14px; font-weight: 600; color: #4ade80;">R$ ${lead.valor}</p>
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

    // SISTEMA DE BUSCA ULTRA INTELIGENTE: Esconde as colunas vazias se houver um termo digitado
    Object.keys(colunasFisicas).forEach(etapa => {
        if (termo.length > 0) {
            // Se tem texto digitado na busca, só mostra a coluna que tem o cliente encontrado
            if (etapasComMatch[etapa]) {
                colunasFisicas[etapa].style.display = 'block';
            } else {
                colunasFisicas[etapa].style.display = 'none';
            }
        } else {
            // Se a busca estiver vazia, exibe todas as colunas normalmente
            colunasFisicas[etapa].style.display = 'block';
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
