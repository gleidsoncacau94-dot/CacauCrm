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
    document.getElementById('tag').value = '';
    document.getElementById('data-retorno').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('notas').value = '';
}

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
    const telefone = document.getElementById('telefone').value.replace(/\D/g, '');
    const tag = document.getElementById('tag').value;
    const dataRetorno = document.getElementById('data-retorno').value;
    const valorInput = document.getElementById('valor').value;
    const notasTexto = document.getElementById('notas').value.trim();

    if (!nome) return alert('Digite ao menos o nome do cliente!');  

    const valorNumerico = parseFloat(valorInput.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;  

    const dataAtual = new Date().toLocaleDateString('pt-BR', {  
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'  
    });  

    let historicoInicial = [];
    if (notasTexto !== "") {
        historicoInicial.push({
            data: dataAtual,
            texto: notasTexto
        });
    }

    const novoLead = {  
        id: Date.now().toString(),  
        nome,  
        telefone,   
        tag,
        dataRetorno,
        valor: valorNumerico,  
        historico: historicoInicial,  
        etapa: 'contato',  
        data: dataAtual,
        timestampCriacao: Date.now(),
        timestampFechamento: null
    };  

    leads.push(novoLead);  
    atualizarCRM();  
    fecharModal();
}

function adicionarNota(id) {
    const novaNotaTexto = prompt("Digite a nova anotação / histórico:");
    if (!novaNotaTexto || novaNotaTexto.trim() === "") return;

    const dataAtual = new Date().toLocaleDateString('pt-BR', {  
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'  
    });

    leads = leads.map(lead => {
        if (lead.id === id) {
            if (!lead.historico) lead.historico = [];
            lead.historico.unshift({
                data: dataAtual,
                texto: novaNotaTexto.trim()
            });
        }
        return lead;
    });

    atualizarCRM();
}

function atualizarCRM() {
    const agora = Date.now();
    const limiteDiasEmMs = 5 * 24 * 60 * 60 * 1000;

    leads = leads.filter(lead => {
        if (lead.etapa === 'fechado') return true; 
        const idadeDoLead = agora - parseInt(lead.id);
        return idadeDoLead <= limiteDiasEmMs;
    });

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
    
    const tagFiltroInput = document.getElementById('filtro-tag-topo');
    const termoTag = tagFiltroInput ? tagFiltroInput.value : '';

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

    let totalLeadsHistorico = leads.length;
    let totalFechadosContagem = 0;
    let somaDiasFechamento = 0;

    document.querySelectorAll('.aviso-oculto').forEach(el => el.remove());  

    leads.forEach(lead => {  
        if (lead.etapa === 'fechado') {
            totalFechadosContagem++;

            let tCriacao = lead.timestampCriacao || parseInt(lead.id);
            let tFechamento = lead.timestampFechamento || Date.now();
            let diasAteFechar = (tFechamento - tCriacao) / (1000 * 60 * 60 * 24);
            somaDiasFechamento += Math.max(0, diasAteFechar);
        }

        const correspondeNome = lead.nome.toLowerCase().includes(termo);  
        
        let correspondeNotas = false;
        if (lead.historico && Array.isArray(lead.historico)) {
            correspondeNotas = lead.historico.some(n => n.texto.toLowerCase().includes(termo));
        } else if (lead.notas) {
            correspondeNotas = lead.notas.toLowerCase().includes(termo);
        }

        const correspondeTag = termoTag === '' || lead.tag === termoTag;

        if ((correspondeNome || correspondeNotas) && correspondeTag) {  
            etapasComMatch[lead.etapa] = true;  
            contadores[lead.etapa] += 1;  

            if (contadores[lead.etapa] > 4 && !colunasExpandidas[lead.etapa] && termo.length === 0 && termoTag === '') {  
                return;   
            }  

            const card = document.createElement('div');  
            card.className = "drag-card";  
            
            card.setAttribute('draggable', 'true');
            card.ondragstart = (e) => e.dataTransfer.setData('text/plain', lead.id);

            let corSla = "transparent";
            let diasDecorridos = 0;

            if (lead.etapa !== 'fechado') {
                diasDecorridos = (Date.now() - parseInt(lead.id)) / (1000 * 60 * 60 * 24); 
                
                if (diasDecorridos < 2) { corSla = "#22c55e"; } 
                else if (diasDecorridos >= 2 && diasDecorridos < 4) { corSla = "#f97316"; } 
                else { corSla = "#ef4444"; }
            } else {
                corSla = "#34d399";
            }
            
            card.style.borderLeft = `5px solid ${corSla}`;
              
            const valorFormatado = lead.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });  

            let botaoWhatsHTML = '';  
            if (lead.telefone) {  
                botaoWhatsHTML = `<button onclick="dispararWhatsapp('${lead.telefone}', '${lead.nome}')" class="btn-whatsapp">💬 WhatsApp</button>`;  
            }  

            let infoTempo = '';
            if (lead.etapa !== 'fechado' && diasDecorridos > 0) {
                let diasArredondados = Math.floor(diasDecorridos);
                infoTempo = `<span style="font-size: 11px; color: ${corSla}; font-weight: bold; margin-left: auto;">${diasArredondados > 0 ? diasArredondados + ' dias no funil' : 'Entrou hoje'}</span>`;
            }

            let badgeTag = '';
            if (lead.tag) {
                let classeTag = '';
                if(lead.tag === 'Indicação') classeTag = 'tag-indicacao';
                if(lead.tag === 'Cliente Ligação') classeTag = 'tag-ligacao';
                if(lead.tag === 'Cliente WhatsApp') classeTag = 'tag-whatsapp';
                if(lead.tag === 'Vai pensar com terceiros') classeTag = 'tag-terceiros';
                badgeTag = `<div class="tag-badge ${classeTag}">${lead.tag}</div>`;
            }

            let badgeDataRetorno = '';
            if (lead.dataRetorno && lead.etapa !== 'fechado') {
                const dataSplit = lead.dataRetorno.split('-');
                const dataFormatada = `${dataSplit[2]}/${dataSplit[1]}/${dataSplit[0]}`; 
                
                const dataObj = new Date(lead.dataRetorno + "T00:00:00");
                const hoje = new Date();
                hoje.setHours(0,0,0,0);

                let icone = "📅";
                let classeData = "";

                if (dataObj < hoje) {
                    icone = "🚨";
                    classeData = "data-atrasada";
                } else if (dataObj.getTime() === hoje.getTime()) {
                    icone = "🔔";
                    classeData = "data-atrasada";
                }

                badgeDataRetorno = `<div class="data-retorno ${classeData}">${icone} Retorno: ${dataFormatada}</div>`;
            }

            let htmlHistorico = '';
            let listaNotas = lead.historico || [];
            
            if (listaNotas.length === 0 && lead.notas) {
                listaNotas = [{ data: lead.data || 'N/A', texto: lead.notas }];
            }

            if (listaNotas.length > 0) {
                htmlHistorico += `<div class="historico-container">`;
                listaNotas.forEach(nota => {
                    htmlHistorico += `
                        <div class="nota-item">
                            <span class="nota-data">${nota.data}:</span>
                            <span>${nota.texto}</span>
                        </div>
                    `;
                });
                htmlHistorico += `</div>`;
            } else {
                htmlHistorico = `<p class="historico-container" style="color: #64748b; font-size: 11px; text-align: center;">Sem anotações</p>`;
            }

            card.innerHTML = `  
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">  
                    <div>
                        ${badgeTag}
                        <h4 style="font-weight: bold; margin: 0;">${lead.nome}</h4>  
                    </div>
                    ${botaoWhatsHTML}  
                </div>  
                <div style="display: flex; align-items: center; margin-top: 4px;">
                    <p class="valor" style="margin: 0;">${valorFormatado}</p>  
                    ${infoTempo}
                </div>
                ${badgeDataRetorno}
                
                ${htmlHistorico}

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <button onclick="adicionarNota('${lead.id}')" style="color: #34d399; background: none; border: none; font-size: 11px; font-weight: 600; cursor: pointer; padding: 0;">+ Adicionar Nota</button>
                    <span style="font-size: 10px; color: #64748b; font-style: italic;">Cadastrado: ${lead.data || 'N/A'}</span>
                </div>

                <div class="card-acoes" style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #475569; display: flex; justify-content: space-between;">  
                    <button onclick="mudarEtapa('${lead.id}')" style="color: #818cf8; text-decoration: underline; font-weight: 500; background: none; border: none; font-size: 12px; cursor: pointer;">Mover Etapa ➜</button>  
                    <button onclick="excluirLead('${lead.id}')" style="color: #f87171; text-decoration: underline; background: none; border: none; font-size: 12px; cursor: pointer;">Excluir</button>  
                </div>  
            `;  

            document.getElementById(`col-${lead.etapa}`).appendChild(card);  
        }  
    });  

    let taxaConversao = totalLeadsHistorico > 0 ? (totalFechadosContagem / totalLeadsHistorico) * 100 : 0;
    let tempoMedio = totalFechadosContagem > 0 ? somaDiasFechamento / totalFechadosContagem : 0;

    document.getElementById('dash-conversao').innerText = `${taxaConversao.toFixed(1)}%`;
    document.getElementById('dash-tempo').innerText = `${Math.round(tempoMedio)} dias`;

    Object.keys(contadores).forEach(etapa => {  
        const containerCards = document.getElementById(`col-${etapa}`);  
          
        if (colunasExpandidas[etapa]) {  
            containerCards.style.overflowY = "auto";  
        } else {  
            containerCards.style.overflowY = "hidden";  
        }  

        if (contadores[etapa] > 4 && termo.length === 0 && termoTag === '') {  
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
        if (termo.length > 0 || termoTag !== '') {  
            colunasFisicas[etapa].style.setProperty('display', etapasComMatch[etapa] ? 'block' : 'none', 'important');  
        } else {  
            colunasFisicas[etapa].style.setProperty('display', 'block', 'important');  
        }  
    });
}

function mudarEtapa(id) {
    leads = leads.map(lead => {
        if (lead.id === id) {
            if (lead.etapa === 'contato') {
                lead.etapa = 'proposta';
            } else if (lead.etapa === 'proposta') {
                lead.etapa = 'fechado';
                lead.timestampFechamento = Date.now();
            } else {
                lead.etapa = 'contato';
                lead.timestampFechamento = null;
            }
        }
        return lead;
    });
    atualizarCRM();
}

function permitirSoltar(e) { e.preventDefault(); }

function soltar(e, novaEtapa) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    leads = leads.map(lead => {
        if (lead.id === id) {
            let atualizado = { ...lead, etapa: novaEtapa };
            if (novaEtapa === 'fechado' && lead.etapa !== 'fechado') {
                atualizado.timestampFechamento = Date.now();
            } else if (novaEtapa !== 'fechado') {
                atualizado.timestampFechamento = null;
            }
            return atualizado;
        }
        return lead;
    });
    atualizarCRM();
}

function excluirLead(id) {
    if(confirm("Tem certeza que deseja excluir este cliente?")) {
        leads = leads.filter(lead => lead.id !== id);
        atualizarCRM();
    }
}

function exportarBackup() {
    const backupDados = {
        leads: leads,
        metaContratos: metaContratos,
        dataBackup: new Date().toLocaleString('pt-BR')
    };

    const blob = new Blob([JSON.stringify(backupDados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `CacauCRM_Backup_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function importarBackup() {
    document.getElementById('input-importar').click();
}

function processarImportacao(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            if (backup.leads !== undefined) {
                if(confirm("Atenção: Isso vai substituir os clientes atuais da tela pelos do backup. Deseja continuar?")) {
                    leads = backup.leads;
                    metaContratos = backup.metaContratos || 0;
                    localStorage.setItem('crm_leads', JSON.stringify(leads));
                    localStorage.setItem('crm_meta_contratos', metaContratos);
                    atualizarCRM();
                    alert("✅ Backup restaurado com sucesso!");
                }
            } else { alert("❌ Arquivo de backup inválido. Tente outro arquivo."); }
        } catch (erro) { alert("❌ Ocorreu um erro ao ler o arquivo."); }
        event.target.value = '';
    };
    leitor.readAsText(arquivo);
}

setTimeout(atualizarCRM, 300);
