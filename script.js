let leads = JSON.parse(localStorage.getItem('crm_leads')) || [];
let metaContratos = parseInt(localStorage.getItem('crm_meta_contratos')) || 0;

let colunasExpandidas = { contato: false, proposta: false, fechado: false };
let gavetaAberta = false;

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

    const valorNumerico = parseFloat(valorInput.replace(/[^\d,.-]/g, '').replace(',', '.')) ||  0;  

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
        id: