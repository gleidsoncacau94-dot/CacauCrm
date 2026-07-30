let leads = JSON.parse(localStorage.getItem('crm_leads')) || [];
let metaContratos = parseInt(localStorage.getItem('crm_meta_contratos')) || 0;

let colunasExpandidas = { contato: false, proposta: false, fechado: false };
let gavetaAberta = false;

function abrirModal(id = null) {
    const modal = document.getElementById('modal');
    const titulo = document.getElementById('modal-titulo');
    const inputIdEdit = document.getElementById('lead-id-edit');

    if (id) {
        // MODO EDIÇÃO
        titulo.innerText = "Editar Lead";
        const lead = leads.find(l => l.id === id);
        document.getElementById('nome').value = lead.nome;
        document.getElementById('telefone').value = lead.telefone;
        document.getElementById('tag').value = lead.tag || '';
        document.getElementById('data-retorno').value = lead.dataRetorno || '';
        document.getElementById('valor').value = lead.valor.toFixed(2).replace('.', ',');
        document.getElementById('notas').value = ""; 
        document.getElementById('notas').placeholder = "Adicionar nova anotação ao histórico...";
        inputIdEdit.value = id;
    } else {
        // MODO CRIAÇÃO
        titulo.innerText = "Cadastrar Novo Lead";
        limparCampos();
        inputIdEdit.value = "";
        document.getElementById('notas').placeholder = "Primeira anotação...";
    }
    
    modal.style.display = 'flex';
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
    document.getElementById('lead-id-edit').value = '';
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
    const idEdicao = document.getElementById('lead-id-edit').value;
    const nome = document.getElementById('nome').value;
    const telefone = document.getElementById('telefone').value.replace(/\D/g, '');
    const tag = document.getElementById('tag').value;
    const dataRetorno = document.getElementById('data-retorno').value;
    const valorInput = document.getElementById('valor').value;
    const notasTexto = document.getElementById('notas').value.trim();

    if (!nome) return alert('Digite ao menos o nome do cliente!');  

    const valorNumerico = parseFloat(valorInput.replace(/\./g, '').replace(',', '.')) || 0;  

    const dataAtual = new Date().toLocaleDateString('pt-BR', {  
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'  
    });  

    if (idEdicao) {
        leads = leads.map(lead => {
            if (lead.id === idEdicao) {
                if (notasTexto !== "") {
                    if (!lead.historico) lead.historico = [];
                    lead.historico.unshift({ data: dataAtual, texto: notasTexto });
                }
                return { ...lead, nome, telefone, tag, dataRetorno, valor: valorNumerico };
            }
            return lead;
        });
    } else {
        let historicoInicial = [];
        if (notasTexto !== "") {
            historicoInicial.push({ data: dataAtual, texto: notasTexto });
        }

        const novoLead = {  
            id: Date.now().toString(),  
            nome, telefone, tag, dataRetorno, valor: valorNumerico,  
            historico: historicoInicial, etapa: 'contato', data: dataAtual,
            timestampCriacao: Date.now(), timestampMudancaEtapa: Date.now(), timestampFechamento: null
        };  
        leads.push(novoLead);  
    }

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

    leads = leads.map(lead => {
        if (lead.etapa !== 'fechado' && lead.etapa !== 'sem-resposta') {
            const baseTempo = lead.timestampMudancaEtapa || lead.timestampCriacao || parseInt(lead.id);
            if ((agora - baseTempo) > limiteDiasEmMs) {
                return { ...lead, etapa: 'sem-resposta' };
            }
        }
        return lead;
    });

    localStorage.setItem('crm_leads', JSON.stringify(leads));
    buscarLeads();
}

function alternarVerMais(etapa) {
    colunasExpandidas[etapa] = !colunasExpandidas[etapa];
    buscarLeads();
}

function alternarGavetaSemResposta() {
    gavetaAberta = !gavetaAberta;
    const secao = document.getElementById('secao-gaveta');
    secao.style.display = gavetaAberta ? 'block' : 'none';
    buscarLeads();
}

function buscarLeads() {
    const buscaInput = document.getElementById('busca');
    const termo = buscaInput ? buscaInput.value.toLowerCase() : '';
    
    const tagFiltroInput = document.getElementById('filtro-tag-topo');
    const termoTag = tagFiltroInput ? tagFiltroInput.value : '';

    const mesFiltroInput = document.getElementById('filtro-mes');
    const mesFiltroValor = mesFiltroInput ? mesFiltroInput.value : ''; 
    let mesFiltroFormatado = '';
    if (mesFiltroValor) {
        const [ano, mes] = mesFiltroValor.split('-');
        mesFiltroFormatado = `${mes}/${ano}`; 
    }

    document.getElementById('col-contato').innerHTML = '';  
    document.getElementById('col-proposta').innerHTML = '';  
    document.getElementById('col-fechado').innerHTML = '';  
    document.getElementById('col-sem-resposta').innerHTML = '';

    const colunasFisicas = {  
        contato: document.getElementById('col-contato').parentElement,  
        proposta: document.getElementById('col-proposta').parentElement,  
        fechado: document.getElementById('col-fechado').parentElement  
    };  

    let contadores = { contato: 0, proposta: 0, fechado: 0, 'sem-resposta': 0 };  
    let etapasComMatch = { contato: false, proposta: false, fechado: false };  

    let totalLeadsHistorico = 0;
    let totalFechadosContagem = 0;
    let somaDiasFechamento = 0;

    document.querySelectorAll('.aviso-oculto').forEach(el => el.remove());  

    leads.forEach(lead => {  
        if (mesFiltroFormatado && lead.data) {
            const dataQuebrada = lead.data.split(',')[0].split('/'); 
            const mesAnoLead = `${dataQuebrada[1]}/${dataQuebrada[2]}`;
            if (mesAnoLead !== mesFiltroFormatado) return; 
        }

        totalLeadsHistorico++;

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
        }

        const correspondeTag = termoTag === '' || lead.tag === termoTag;

        if ((correspondeNome || correspondeNotas) && correspondeTag) {  
            if (lead.etapa !== 'sem-resposta') {
                etapasComMatch[lead.etapa] = true;  
            }
            contadores[lead.etapa] += 1;  

            if (lead.etapa !== 'sem-resposta') {
                if (contadores[lead.etapa] > 4 && !colunasExpandidas[lead.etapa] && termo.length === 0 && termoTag === '') {  
                    return;   
                }  
            }

            const card = document.createElement('div');  
            card.className = "drag-card";  
            
            card.setAttribute('draggable', 'true');
            card.ondragstart = (e) => e.dataTransfer.setData('text/plain', lead.id);

            let corSla = "transparent";
            let diasNaEtapa = 0;
            let estaParado = false;

            if (lead.etapa !== 'fechado' && lead.etapa !== 'sem-resposta') {
                let baseTempo = lead.timestampMudancaEtapa || lead.timestampCriacao || parseInt(lead.id);
                let dianNaEtapaCalculo = (Date.now() - baseTempo) / (1000 * 60 * 60 * 24);
                diasNaEtapa = Math.floor(dianNaEtapaCalculo);

                if (diasNaEtapa >= 2) {
                    estaParado = true;
                    card.classList.add('alerta-sla');
                    corSla = "#ef4444";
                } else {
                    corSla = "#22c55e";
                }
            } else if (lead.etapa === 'sem-resposta') {
                corSla = "#f87171";
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
            if (lead.etapa !== 'fechado' && lead.etapa !== 'sem-resposta') {
                if (estaParado) {
                    infoTempo = `<span style="font-size: 11px; color: #ef4444; font-weight: bold; margin-left: auto;">⚠️ Parado há ${diasNaEtapa} dias</span>`;
                } else {
                    infoTempo = `<span style="font-size: 11px; color: #22c55e; font-weight: bold; margin-left: auto;">${diasNaEtapa > 0 ? diasNaEtapa + ' dias na etapa' : 'Entrou hoje'}</span>`;
                }
            } else if (lead.etapa === 'sem-resposta') {
                infoTempo = `<span style="font-size: 11px; color: #f87171; font-weight: bold; margin-left: auto;">📭 Sem Resposta (+5 dias)</span>`;
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

            let botaoMoverEspecial = lead.etapa === 'sem-resposta' 
                ? `<button onclick="restaurarDaGaveta('${lead.id}')" style="color: #34d399; text-decoration: underline; font-weight: bold; background: none; border: none; font-size: 12px; cursor: pointer;">📂 Voltar p/ Contato</button>`
                : `<button onclick="mudarEtapa('${lead.id}')" style="color: #818cf8; text-decoration: underline; font-weight: 500; background: none; border: none; font-size: 12px; cursor: pointer;">Mover Etapa ➜</button>`;

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
                    <div style="display: flex; gap: 10px;">
                        <button onclick="adicionarNota('${lead.id}')" style="color: #34d399; background: none; border: none; font-size: 11px; font-weight: 600; cursor: pointer; padding: 0;">+ Nota</button>
                        <button onclick="abrirModal('${lead.id}')" style="color: #fbbf24; background: none; border: none; font-size: 11px; font-weight: 600; cursor: pointer; padding: 0;">✏️ Editar</button>
                    </div>
                    <span style="font-size: 10px; color: #64748b; font-style: italic;">Criado: ${lead.data ? lead.data.split(',')[0] : 'N/A'}</span>
                </div>

                <div class="card-acoes" style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #475569; display: flex; justify-content: space-between;">  
                    ${botaoMoverEspecial}  
                    <button onclick="excluirLead('${lead.id}')" style="color: #f87171; text-decoration: underline; background: none; border: none; font-size: 12px; cursor: pointer;">Excluir</button>  
                </div>  
            `;  

            if (lead.etapa === 'sem-resposta') {
                document.getElementById('col-sem-resposta').appendChild(card);
            } else {
                document.getElementById(`col-${lead.etapa}`).appendChild(card);  
            }
        }  
    });  

    let taxaConversao = totalLeadsHistorico > 0 ? (totalFechadosContagem / totalLeadsHistorico) * 100 : 0;
    let tempoMedio = totalFechadosContagem > 0 ? somaDiasFechamento / totalFechadosContagem : 0;

    document.getElementById('dash-conversao').innerText = `${taxaConversao.toFixed(1)}%`;
    document.getElementById('dash-tempo').innerText = `${Math.round(tempoMedio)} dias`;
    document.getElementById('btn-gaveta-toggle').innerText = `📭 Sem Resposta (${contadores['sem-resposta']})`;

    Object.keys(colunasFisicas).forEach(etapa => {  
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

function restaurarDaGaveta(id) {
    leads = leads.map(lead => {
        if (lead.id === id) {
            return { ...lead, etapa: 'contato', timestampMudancaEtapa: Date.now() };
        }
        return lead;
    });
    atualizarCRM();
}

function mudarEtapa(id) {
    leads = leads.map(lead => {
        if (lead.id === id) {
            let novaEtapa = lead.etapa;
            if (lead.etapa === 'contato') novaEtapa = 'proposta';
            else if (lead.etapa === 'proposta') novaEtapa = 'fechado';
            else novaEtapa = 'contato';

            return {
                ...lead,
                etapa: novaEtapa,
                timestampMudancaEtapa: Date.now(),
                timestampFechamento: novaEtapa === 'fechado' ? Date.now() : null
            };
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
            return {
                ...lead,
                etapa: novaEtapa,
                timestampMudancaEtapa: Date.now(),
                timestampFechamento: novaEtapa === 'fechado' ? Date.now() : null
            };
        }
        return lead;
    });
    atualizarCRM();
}

function excluirLead(id) {
    if(confirm("Tem