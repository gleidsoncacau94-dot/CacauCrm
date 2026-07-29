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
    buscarLeads(); // Chama a função de busca para renderizar os cartões filtrados ou todos
}

function buscarLeads() {
    const buscaInput = document.getElementById('busca');
    const termo = buscaInput ? buscaInput.value.toLowerCase() : '';
    
    document.getElementById('col-contato').innerHTML = '';
    document.getElementById('col-proposta').innerHTML = '';
    document.getElementById('col-fechado').innerHTML = '';

    leads.forEach(lead => {
        const correspondeNome = lead.nome.toLowerCase().includes(termo);
        const correspondeNotas = lead.notas && lead.notas.toLowerCase().includes(termo);

        if (correspondeNome || correspondeNotas) {
            const card = document.createElement('div');
            card.className = "bg-gray-700 p-4 rounded-lg border border-gray-600 shadow-md drag-card";
            card.draggable = true;
            card.ondragstart = (e) => e.dataTransfer.setData('text/plain', lead.id);
            
            card.innerHTML = `
                <h4 class="font-bold text-white text-base">${lead.nome}</h4>
                <p class="text-sm text-green-400 font-medium mt-1">R$ ${lead.valor}</p>
                <p class="text-xs text-gray-400 mt-2 bg-gray-800 p-2 rounded">${lead.notas || 'Sem anotações'}</p>
                <div class="mt-3 flex justify-between items-center border-t border-gray-600 pt-2">
                    <button onclick="mudarEtapa('${lead.id}')" class="text-xs text-indigo-400 hover:underline cursor-pointer">Mover Etapa</button>
                    <button onclick="excluirLead('${lead.id}')" class="text-xs text-red-400 hover:underline cursor-pointer">Excluir</button>
                </div>
            `;

            document.getElementById(`col-${lead.etapa}`).appendChild(card);
        }
    });
}

// Função auxiliar para celulares (onde arrastar com o dedo é difícil)
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

// Inicializa a tela
setTimeout(atualizarCRM, 500);
