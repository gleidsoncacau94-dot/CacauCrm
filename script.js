let leads = JSON.parse(localStorage.getItem('crm_leads')) || [];

function abrirModal() { document.getElementById('modal').classList.remove('hidden'); }
function fecharModal() { document.getElementById('modal').classList.add('hidden'); limparCampos(); }

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

    const novoLead = {
        id: Date.now().toString(),
        nome,
        valor: valor || '0',
        notas,
        etapa: 'contato'
    };

    leads.push(novoLead);
    atualizarCRM();
    fecharModal();
}

function atualizarCRM() {
    localStorage.setItem('crm_leads', JSON.stringify(leads));
    
    document.getElementById('col-contato').innerHTML = '';
    document.getElementById('col-proposta').innerHTML = '';
    document.getElementById('col-fechado').innerHTML = '';

    leads.forEach(lead => {
        const card = document.createElement('div');
        card.className = "bg-gray-700 p-4 rounded-lg border border-gray-600 shadow-md drag-card";
        card.draggable = true;
        card.ondragstart = (e) => e.dataTransfer.setData('text/plain', lead.id);
        
        card.innerHTML = `
            <h4 class="font-bold text-white">${lead.nome}</h4>
            <p class="text-sm text-green-400 font-medium">R$ ${lead.valor}</p>
            <p class="text-xs text-gray-400 mt-1">${lead.notas}</p>
            <button onclick="excluirLead('${lead.id}')" class="text-xs text-red-400 mt-2 block hover:underline">Excluir</button>
        `;

        document.getElementById(`col-${lead.etapa}`).appendChild(card);
    });
}

function permitirSoltar(e) { e.preventDefault(); }
function soltar(e, novaEtapa) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    leads = leads.map(lead => lead.id === id ? { ...lead, etapa: novaEtapa } : lead);
    atualizarCRM();
}

function excluirLead(id) {
    leads = leads.filter(lead => lead.id !== id);
    atualizarCRM();
}

// Inicializa a tela com os dados salvos
atualizarCRM();
