

async function alterarSenha() {

    const senhaAtual = $('senhaAtual').value;
    const novaSenha = $('novaSenha').value;
    const confirmarSenha = $('confirmarSenha').value;

    if (!senhaAtual) {
        alert("Digite sua senha atual.");
        return;
    }

    if (!novaSenha) {
        alert("Digite a nova senha.");
        return;
    }

    if (novaSenha.length < 8) {
        alert("A nova senha deve ter pelo menos 8 caracteres.");
        return;
    }

    if (novaSenha !== confirmarSenha) {
        alert("A confirmação da nova senha não confere.");
        return;
    }

    if (senhaAtual === novaSenha) {
        alert("A nova senha deve ser diferente da senha atual.");
        return;
    }

    try {

        /*
         * 1. Descobrir o usuário logado
         */
        const usuario = await fetch(
            SUPABASE_URL + "/auth/v1/user",
            {
                method: "GET",
                headers: h(true)
            }
        );

        const dadosUsuario = await usuario.json();

        if (!usuario.ok || !dadosUsuario.email) {
            throw new Error(
                "Não foi possível identificar o usuário."
            );
        }

        const email = dadosUsuario.email;

        /*
         * 2. Confirmar a senha atual
         *
         * Fazemos um login de validação.
         */
        const validacao = await fetch(
            SUPABASE_URL + "/auth/v1/token?grant_type=password",
            {
                method: "POST",
                headers: h(false),
                body: JSON.stringify({
                    email: email,
                    password: senhaAtual
                })
            }
        );

        const resultadoValidacao = await validacao.json();

        if (!validacao.ok) {
            throw new Error(
                "A senha atual está incorreta."
            );
        }

        /*
         * 3. Alterar a senha no Authentication
         */
        const alteracao = await fetch(
            SUPABASE_URL + "/auth/v1/user",
            {
                method: "PUT",
                headers: h(true),
                body: JSON.stringify({
                    password: novaSenha
                })
            }
        );

        const resultadoAlteracao =
            await alteracao.json().catch(() => ({}));

        if (!alteracao.ok) {

            throw new Error(
                resultadoAlteracao.msg ||
                resultadoAlteracao.message ||
                "Não foi possível alterar a senha."
            );
        }

        /*
         * 4. Limpar campos
         */
        $('senhaAtual').value = "";
        $('novaSenha').value = "";
        $('confirmarSenha').value = "";

        alert(
            "✅ Senha alterada com sucesso!"
        );

    } catch (e) {

        console.error("Erro ao alterar senha:", e);

        alert(
            "❌ " + e.message
        );
    }
}



const SUPABASE_URL="https://jfwcvqqjtuqjbtapcdet.supabase.co";
const SUPABASE_KEY="sb_publishable_gC6HXuFlm59yT60YHFxM8w_CNqzSidO";
let services=[],clients=[],quotes=[],materials=[],categories=[],configs=[];
let quoteItems=[],quoteMaterialItems=[],editingQuoteId=null;
let currentUserId="";
const $=id=>document.getElementById(id), money=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}), n=v=>Number(v||0), esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])), date=v=>v?new Date(v).toLocaleDateString("pt-BR"):"";
const token=()=>localStorage.getItem("sb_access_token")||"";
const refreshToken=()=>localStorage.getItem("sb_refresh_token")||"";
const h=(auth=true)=>{const x={apikey:SUPABASE_KEY,"Content-Type":"application/json"};if(auth&&token())x.Authorization="Bearer "+token();return x};


async function carregarPerfil() {
    try {

        if (!currentUserId) {
            console.warn("Usuário ainda não identificado.");
            return;
        }

        const dados = await api(
            'profiles?select=*&id=eq.' +
            encodeURIComponent(currentUserId)
        );

        const perfil = dados && dados.length ? dados[0] : null;

        if (!perfil) {
            console.warn("Perfil não encontrado.");
            return;
        }

        $('perfilNome').value = perfil.nome || '';
        $('perfilEmail').value = perfil.email || '';
        $('perfilTelefone').value = perfil.telefone || '';
        $('perfilEmpresa').value = perfil.empresa || '';
        $('perfilCidade').value = perfil.cidade || '';

        const nomeUsuario = $('nomeUsuario');

        if (nomeUsuario) {
            nomeUsuario.textContent =
                perfil.nome || perfil.email || 'Usuário';
        }

        console.log("Perfil carregado:", perfil);

    } catch (e) {
        console.error("Erro ao carregar perfil:", e);
    }
}

async function salvarPerfil() {

    try {

        if (!currentUserId) {
            alert("Usuário não identificado.");
            return;
        }

        const dados = {
            nome: $('perfilNome').value.trim(),
            telefone: $('perfilTelefone').value.trim(),
            empresa: $('perfilEmpresa').value.trim(),
            cidade: $('perfilCidade').value.trim()
        };

        await api(
            'profiles?id=eq.' + encodeURIComponent(currentUserId),
            {
                method: 'PATCH',
                body: dados
            }
        );

        const nome = dados.nome || 'Usuário';

        $('nomeUsuario').textContent = nome;

        alert("Perfil salvo com sucesso!");

    } catch (e) {

        console.error(e);

        alert(
            "Erro ao salvar perfil:\n" +
            e.message
        );
    }
}


async function refreshSession(){
  const rt=refreshToken();
  if(!rt) return false;
  try{
    const r=await fetch(SUPABASE_URL+"/auth/v1/token?grant_type=refresh_token",{
      method:"POST",
      headers:h(false),
      body:JSON.stringify({refresh_token:rt})
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.access_token) return false;
    localStorage.setItem("sb_access_token",d.access_token);
    if(d.refresh_token) localStorage.setItem("sb_refresh_token",d.refresh_token);
    return true;
  }catch(e){ return false; }
}

async function api(path,o={},retry=true){
  const method=o.method||"GET";
  const headers=h(o.auth!==false);
  if(["POST","PATCH","PUT"].includes(method))headers.Prefer="return=representation";
  const r=await fetch(SUPABASE_URL+"/rest/v1/"+path,{
    method,headers,
    body:o.body?JSON.stringify(o.body):undefined
  });
  const t=await r.text();
  let d=null;try{d=t?JSON.parse(t):null}catch{}

  // JWT expirado: renova a sessão e repete a requisição uma única vez.
  if(r.status===401 && o.auth!==false && retry){
    const ok=await refreshSession();
    if(ok) return api(path,o,false);
    localStorage.removeItem("sb_access_token");
    localStorage.removeItem("sb_refresh_token");
    throw new Error("Sua sessão expirou. Faça login novamente.");
  }

  if(!r.ok)throw new Error(d?.message||d?.hint||t||`HTTP ${r.status}`);
  return d;
}
const STATUS_UI=[
  "Rascunho",
  "Enviado",
  "Aguardando resposta",
  "Aprovado",
  "Rejeitado",
  "Em execução",
  "Concluído",
  "Cancelado"
];

const STATUS_DB={
  "Rascunho":"Rascunho",
  "Enviado":"Pendente",
  "Aguardando resposta":"Aguardando resposta",
  "Aprovado":"Aprovado",
  "Rejeitado":"Recusado",
  "Em execução":"Em execução",
  "Concluído":"Concluído",
  "Cancelado":"Cancelado"
};

const STATUS_UI_FROM_DB={
  "Rascunho":"Rascunho",
  "Pendente":"Enviado",
  "Aguardando resposta":"Aguardando resposta",
  "Aprovado":"Aprovado",
  "Recusado":"Rejeitado",
  "Em execução":"Em execução",
  "Concluído":"Concluído",
  "Cancelado":"Cancelado"
};

const uiStatus=s=>STATUS_UI_FROM_DB[s]||s||"Rascunho";
const dbStatus=s=>STATUS_DB[s]||s||"Rascunho";
function statusBadge(s){s=uiStatus(s);const c=s==="Aprovado"?"green":s==="Enviado"?"blue":(s==="Rejeitado"||s==="Cancelado")?"red":s==="Em execução"||s==="Concluído"?"green":s==="Aguardando resposta"?"yellow":"";return `<span class="badge ${c}">${esc(s)}</span>`}
function clientName(id){return clients.find(c=>String(c.id)===String(id))?.nome||"Cliente não encontrado"}
function catName(id){return categories.find(c=>String(c.id)===String(id))?.nome||"Sem categoria"}
function wa(phone){const p=String(phone||"").replace(/\D/g,"");return p?`https://wa.me/55${p}`:""}
async function login(){try{const r=await fetch(SUPABASE_URL+"/auth/v1/token?grant_type=password",{method:"POST",headers:h(false),body:JSON.stringify({email:$('loginEmail').value.trim(),password:$('loginPassword').value})});const d=await r.json();if(!r.ok)throw Error(d.error_description||d.msg||"Falha no login");localStorage.setItem("sb_access_token",d.access_token);localStorage.setItem("sb_refresh_token",d.refresh_token||"");startApp()}catch(e){$('loginError').textContent=e.message}}
function logout(){localStorage.removeItem("sb_access_token");localStorage.removeItem("sb_refresh_token");location.reload()}
async function loadCurrentUser(){
  if(!token()) return false;
  const r=await fetch(SUPABASE_URL+"/auth/v1/user",{headers:h(true)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok||!d.id) throw new Error("Não foi possível identificar o usuário logado.");
  currentUserId=d.id;
  return true;
}
function userFilter(){
  if(!currentUserId) throw new Error("Usuário não identificado.");
  return "user_id=eq."+encodeURIComponent(currentUserId);
}

async function startApp(){
  if(!token()){
    $('login').classList.remove('hidden');
    $('app').classList.add('hidden');
    return;
  }
  $('login').classList.add('hidden');
  $('app').classList.remove('hidden');
  try{
    await loadCurrentUser();
    await carregarPerfil();
    await loadAll();
  }catch(e){
    if(String(e.message).toLowerCase().includes("sessão expirou")){
      $('app').classList.add('hidden');
      $('login').classList.remove('hidden');
      $('loginError').textContent=e.message;
    }else{
      alert("Erro ao carregar: "+e.message);
    }
  }
}
function go(v){
    document.querySelectorAll('.view')
        .forEach(x=>x.classList.remove('active'));

    $("view-"+v).classList.add('active');

    document.querySelectorAll('.nav button')
        .forEach(x=>x.classList.toggle(
            'active',
            x.dataset.view===v
        ));

    $('pageTitle').textContent = {
        dashboard:'Dashboard',
        novo:'Novo orçamento',
        clientes:'Clientes',
        orcamentos:'Orçamentos',
        servicos:'Serviços',
        materiais:'Materiais',
        categorias:'Categorias',
        configuracoes:'Configurações'
    }[v];

    if(v==='dashboard') renderDashboard();
    if(v==='clientes') renderClients();
    if(v==='orcamentos') renderQuotes();
    if(v==='servicos') renderAdminServices();
    if(v==='materiais') renderMaterials();
    if(v==='categorias') renderCategories();

    if(v==='configuracoes'){
        renderConfigs();
        carregarPerfil();
    }
}
async function loadAll(){await Promise.all([loadClients(),loadCategories(),loadServices(),loadMaterials(),loadQuotes(),loadConfigs()]);populateSelects();renderDashboard();renderServicePicker();renderQuoteMaterialPicker();newQuote()}
async function loadClients(){clients=await api('clientes?select=*&'+userFilter()+'&order=nome.asc')||[]}
async function loadCategories(){categories=await api('categorias?select=*&'+userFilter()+'&order=ordem.asc,nome.asc')||[]}
async function loadServices(){services=await api('servicos?select=*&'+userFilter()+'&order=nome.asc')||[]}
async function loadMaterials(){materials=await api('materiais?select=*&'+userFilter()+'&order=nome.asc')||[]}
async function loadQuotes(){quotes=(await api('orcamentos?select=*&'+userFilter()+'&order=criado_em.desc')||[]).map(q=>({...q,status:uiStatus(q.status)}))}
async function loadConfigs(){configs=await api('configuracoes?select=*&'+userFilter()+'&order=chave.asc')||[]}
function populateSelects(){const co='<option value="">Selecione...</option>'+clients.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join('');$('qCliente').innerHTML=co;$('quoteFilterClient').innerHTML='<option value="">Todos os clientes</option>'+clients.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join('');const ca='<option value="">Todas as categorias</option>'+categories.filter(c=>c.ativo!==false).map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join('');$('servicePickCat').innerHTML=ca;$('serviceFilterCat').innerHTML=ca}
function renderDashboard(){$('statQuotes').textContent=quotes.length;$('statApproved').textContent=quotes.filter(q=>uiStatus(q.status)==='Aprovado').length;$('statValue').textContent=money(quotes.reduce((a,q)=>a+n(q.total),0));$('statClients').textContent=clients.length;$('recentBody').innerHTML=quotes.slice(0,10).map(q=>`<tr><td>${q.numero}</td><td>${esc(clientName(q.cliente_id))}</td><td>${statusBadge(q.status)}</td><td>${money(q.total)}</td><td>${date(q.criado_em)}</td><td><button class="btn small" onclick="editQuote(${q.id})">Abrir</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty">Nenhum orçamento.</td></tr>'}
function renderClients(){const q=($('clientSearch')?.value||'').toLowerCase();const rows=clients.filter(c=>`${c.nome} ${c.telefone||''} ${c.email||''}`.toLowerCase().includes(q));$('clientsBody').innerHTML=rows.map(c=>{const a=[c.endereco,c.numero,c.bairro,c.cidade,c.estado].filter(Boolean).join(', ');return `<tr><td><b>${esc(c.nome)}</b></td><td>${esc(c.telefone)}</td><td>${wa(c.telefone)?`<a class="btn small" target="_blank" href="${wa(c.telefone)}">WhatsApp</a>`:'—'}</td><td>${esc(c.email)}</td><td>${esc(a)}</td><td class="actions"><button class="btn small" onclick="openClient(${c.id})">Editar</button><button class="btn small" onclick="clientHistory(${c.id})">Histórico</button><button class="btn small danger" onclick="deleteClient(${c.id})">Excluir</button></td></tr>`}).join('')||'<tr><td colspan="6" class="empty">Nenhum cliente.</td></tr>'}
function openClient(id=null){const c=id?clients.find(x=>x.id==id):{};$('modalTitle').textContent=id?'Editar cliente':'Cadastrar cliente';$('modalBody').innerHTML=`<div class="grid grid-2"><div class="field"><label>Nome</label><input id="cNome" value="${esc(c.nome)}"></div><div class="field"><label>Telefone / WhatsApp</label><input id="cTel" value="${esc(c.telefone)}"></div><div class="field"><label>E-mail</label><input id="cEmail" value="${esc(c.email)}"></div><div class="field"><label>CEP</label><input id="cCep" value="${esc(c.cep)}"></div><div class="field"><label>Endereço</label><input id="cEnd" value="${esc(c.endereco)}"></div><div class="field"><label>Número</label><input id="cNum" value="${esc(c.numero)}"></div><div class="field"><label>Complemento</label><input id="cComp" value="${esc(c.complemento)}"></div><div class="field"><label>Bairro</label><input id="cBairro" value="${esc(c.bairro)}"></div><div class="field"><label>Cidade</label><input id="cCidade" value="${esc(c.cidade)}"></div><div class="field"><label>Estado</label><input id="cEstado" value="${esc(c.estado)}"></div></div><div class="field"><label>Observações</label><textarea id="cObs" rows="4">${esc(c.observacoes)}</textarea></div><button class="btn primary" onclick="saveClient(${id||'null'})">Salvar</button>`;openModal()}
async function saveClient(id){const body={user_id:currentUserId,nome:$('cNome').value.trim(),telefone:$('cTel').value.trim(),email:$('cEmail').value.trim(),endereco:$('cEnd').value.trim(),numero:$('cNum').value.trim(),complemento:$('cComp').value.trim(),bairro:$('cBairro').value.trim(),cidade:$('cCidade').value.trim(),estado:$('cEstado').value.trim(),cep:$('cCep').value.trim(),observacoes:$('cObs').value.trim(),atualizado_em:new Date().toISOString()};if(!body.nome)return alert('Informe o nome.');try{if(id)await api('clientes?id=eq.'+id+'&'+userFilter(),{method:'PATCH',body});else await api('clientes',{method:'POST',body});closeModal();await loadClients();populateSelects();renderClients();renderDashboard()}catch(e){alert(e.message)}}
async function deleteClient(id){if(!confirm('Excluir este cliente?'))return;try{await api('clientes?id=eq.'+id+'&'+userFilter(),{method:'DELETE'});await loadClients();populateSelects();renderClients();renderDashboard()}catch(e){alert('Não foi possível excluir. Verifique se há orçamentos vinculados.')}}
async function clientHistory(id){const rows=quotes.filter(q=>String(q.cliente_id)===String(id));$('modalTitle').textContent='Histórico — '+clientName(id);$('modalBody').innerHTML=`<div class="table-wrap"><table class="table"><thead><tr><th>Nº</th><th>Status</th><th>Total</th><th>Data</th><th></th></tr></thead><tbody>${rows.map(q=>`<tr><td>${q.numero}</td><td>${statusBadge(q.status)}</td><td>${money(q.total)}</td><td>${date(q.criado_em)}</td><td><button class="btn small" onclick="closeModal();editQuote(${q.id})">Abrir</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty">Nenhum orçamento.</td></tr>'}</tbody></table></div>`;openModal()}
function renderCategories(){$('categoriesBody').innerHTML=categories.map(c=>`<tr><td><b>${esc(c.nome)}</b></td><td>${esc(c.icone||'')}</td><td>${esc(c.cor||'')}</td><td>${c.ordem??0}</td><td>${c.ativo?'<span class="badge green">Ativa</span>':'<span class="badge">Inativa</span>'}</td><td class="actions"><button class="btn small" onclick="openCategory(${c.id})">Editar</button><button class="btn small" onclick="toggleCategory(${c.id},${!c.ativo})">${c.ativo?'Desativar':'Ativar'}</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty">Nenhuma categoria.</td></tr>'}
function openCategory(id=null){const c=id?categories.find(x=>x.id==id):{};$('modalTitle').textContent=id?'Editar categoria':'Criar categoria';$('modalBody').innerHTML=`<div class="grid grid-2"><div class="field"><label>Nome</label><input id="catNome" value="${esc(c.nome)}"></div><div class="field"><label>Ícone</label><input id="catIcone" value="${esc(c.icone)}"></div><div class="field"><label>Cor</label><input id="catCor" value="${esc(c.cor||'#1769e0')}"></div><div class="field"><label>Ordem</label><input id="catOrdem" type="number" value="${c.ordem??0}"></div></div><label><input id="catAtivo" type="checkbox" ${c.ativo!==false?'checked':''}> Ativa</label><br><br><button class="btn primary" onclick="saveCategory(${id||'null'})">Salvar</button>`;openModal()}
async function saveCategory(id){const body={user_id:currentUserId,nome:$('catNome').value.trim(),icone:$('catIcone').value.trim(),cor:$('catCor').value.trim(),ordem:n($('catOrdem').value),ativo:$('catAtivo').checked};try{if(id)await api('categorias?id=eq.'+id+'&'+userFilter(),{method:'PATCH',body});else await api('categorias',{method:'POST',body});closeModal();await loadCategories();populateSelects();renderCategories();renderServicePicker();renderAdminServices()}catch(e){alert(e.message)}}
async function toggleCategory(id,ativo){try{await api('categorias?id=eq.'+id+'&'+userFilter(),{method:'PATCH',body:{ativo}});await loadCategories();populateSelects();renderCategories()}catch(e){alert(e.message)}}
function renderServicePicker(){const q=($('servicePickSearch')?.value||'').toLowerCase(),cat=$('servicePickCat')?.value||'';const rows=services.filter(s=>s.ativo!==false&&(!cat||String(s.categoria_id)===cat)&&`${s.nome} ${s.descricao||''}`.toLowerCase().includes(q));$('quoteServices').innerHTML=rows.map(s=>`<div class="service-card"><div><strong>${esc(s.nome)}</strong><div class="price">${esc(catName(s.categoria_id))} · Médio ${money(s.preco_medio)} / ${esc(s.unidade)}</div></div><button class="btn primary small" onclick="addService(${s.id})">＋</button></div>`).join('')||'<div class="empty">Nenhum serviço encontrado.</div>'}
function renderQuoteServices(){renderServicePicker()}
function addService(id){const s=services.find(x=>x.id==id);if(!s)return;const x=quoteItems.find(i=>i.servico_id==id);if(x)x.quantidade++;else quoteItems.push({servico_id:s.id,nome_servico:s.nome,categoria:catName(s.categoria_id),quantidade:1,tipo_preco:'Médio',valor_unitario:n(s.preco_medio)});renderQuoteItems();calcQuote()}
function renderQuoteItems(){$('quoteItems').innerHTML=quoteItems.map((x,i)=>`<div class="quote-item"><div class="quote-item-top"><div><b>${esc(x.nome_servico)}</b><div class="muted">${esc(x.categoria||'Sem categoria')}</div></div><div class="actions"><button class="btn small" onclick="focusServiceReplacement(${i})">Trocar</button><button class="btn small danger" onclick="removeService(${i})">Excluir</button></div></div><div class="quote-controls"><span>Qtd.</span><input type="number" min=".01" step=".01" value="${x.quantidade}" onchange="serviceQty(${i},this.value)"><select onchange="servicePriceType(${i},this.value)">${['Mínimo','Médio','Máximo','Personalizado'].map(m=>`<option ${x.tipo_preco===m?'selected':''}>${m}</option>`).join('')}</select>${x.tipo_preco==='Personalizado'?`<input type="number" min="0" step=".01" value="${x.valor_unitario}" onchange="customServicePrice(${i},this.value)">`:''}<select title="Trocar serviço" onchange="replaceService(${i},this.value)"><option value="">Selecionar outro serviço...</option>${serviceOptions(x.servico_id)}</select><b style="margin-left:auto">${money(x.quantidade*x.valor_unitario)}</b></div></div>`).join('')||'<div class="empty">Adicione serviços acima.</div>'}
function serviceQty(i,v){quoteItems[i].quantidade=Math.max(.01,n(v));renderQuoteItems();calcQuote()}
function servicePriceType(i,t){const s=services.find(x=>x.id==quoteItems[i].servico_id);if(!s)return;quoteItems[i].tipo_preco=t;if(t==='Mínimo')quoteItems[i].valor_unitario=n(s.preco_minimo);if(t==='Médio')quoteItems[i].valor_unitario=n(s.preco_medio);if(t==='Máximo')quoteItems[i].valor_unitario=n(s.preco_maximo);renderQuoteItems();calcQuote()}
function serviceOptions(selectedId){const groups=categories.filter(c=>c.ativo!==false).map(c=>{const ss=services.filter(s=>s.ativo!==false&&String(s.categoria_id)===String(c.id));if(!ss.length)return '';return `<optgroup label="${esc(c.nome)}">${ss.map(s=>`<option value="${s.id}" ${String(s.id)===String(selectedId)?'selected':''}>${esc(s.nome)} — ${money(s.preco_medio)}</option>`).join('')}</optgroup>`}).join('');const unc=services.filter(s=>s.ativo!==false&&!categories.some(c=>String(c.id)===String(s.categoria_id)));return groups+(unc.length?`<optgroup label="Sem categoria">${unc.map(s=>`<option value="${s.id}" ${String(s.id)===String(selectedId)?'selected':''}>${esc(s.nome)} — ${money(s.preco_medio)}</option>`).join('')}</optgroup>`:'')}
function replaceService(i,id){if(!id)return;const s=services.find(x=>String(x.id)===String(id));if(!s)return;const item=quoteItems[i];item.servico_id=s.id;item.nome_servico=s.nome;item.categoria=catName(s.categoria_id);if(item.tipo_preco==='Mínimo')item.valor_unitario=n(s.preco_minimo);else if(item.tipo_preco==='Máximo')item.valor_unitario=n(s.preco_maximo);else if(item.tipo_preco==='Personalizado')item.valor_unitario=n(item.valor_unitario);else {item.tipo_preco='Médio';item.valor_unitario=n(s.preco_medio)}renderQuoteItems();calcQuote()}
function focusServiceReplacement(i){const el=document.querySelector(`#quoteItems .quote-item:nth-child(${i+1}) select[title="Trocar serviço"]`);if(el){el.focus();el.click()}}
function customServicePrice(i,v){quoteItems[i].valor_unitario=Math.max(0,n(v));renderQuoteItems();calcQuote()}
function removeService(i){quoteItems.splice(i,1);renderQuoteItems();calcQuote()}
function renderAdminServices(){const q=($('serviceSearch')?.value||'').toLowerCase(),cat=$('serviceFilterCat')?.value||'';const rows=services.filter(s=>(!cat||String(s.categoria_id)===cat)&&`${s.nome} ${s.descricao||''}`.toLowerCase().includes(q));$('servicesBody').innerHTML=rows.map(s=>`<tr><td><b>${esc(s.nome)}</b></td><td>${esc(catName(s.categoria_id))}</td><td>${money(s.preco_minimo)}</td><td>${money(s.preco_medio)}</td><td>${money(s.preco_maximo)}</td><td>${esc(s.unidade)}</td><td>${s.ativo?'<span class="badge green">Ativo</span>':'<span class="badge">Inativo</span>'}</td><td class="actions"><button class="btn small" onclick="openService(${s.id})">Editar</button><button class="btn small" onclick="toggleService(${s.id},${!s.ativo})">${s.ativo?'Desativar':'Ativar'}</button></td></tr>`).join('')||'<tr><td colspan="8" class="empty">Nenhum serviço.</td></tr>'}
function openService(id=null){const s=id?services.find(x=>x.id==id):{};$('modalTitle').textContent=id?'Editar serviço':'Adicionar serviço';$('modalBody').innerHTML=`<div class="grid grid-2"><div class="field"><label>Nome</label><input id="sNome" value="${esc(s.nome)}"></div><div class="field"><label>Categoria</label><select id="sCat">${categories.filter(c=>c.ativo!==false).map(c=>`<option value="${c.id}" ${String(c.id)===String(s.categoria_id)?'selected':''}>${esc(c.nome)}</option>`).join('')}</select></div><div class="field"><label>Descrição</label><input id="sDesc" value="${esc(s.descricao)}"></div><div class="field"><label>Unidade</label><input id="sUn" value="${esc(s.unidade||'unidade')}"></div><div class="field"><label>Preço mínimo</label><input id="sMin" type="number" step=".01" value="${s.preco_minimo??0}"></div><div class="field"><label>Preço médio</label><input id="sMed" type="number" step=".01" value="${s.preco_medio??0}"></div><div class="field"><label>Preço máximo</label><input id="sMax" type="number" step=".01" value="${s.preco_maximo??0}"></div></div><label><input id="sAtivo" type="checkbox" ${s.ativo!==false?'checked':''}> Ativo</label><br><br><button class="btn primary" onclick="saveService(${id||'null'})">Salvar</button>`;openModal()}
async function saveService(id){const body={user_id:currentUserId,categoria_id:$('sCat').value?Number($('sCat').value):null,nome:$('sNome').value.trim(),descricao:$('sDesc').value.trim(),preco_minimo:n($('sMin').value),preco_medio:n($('sMed').value),preco_maximo:n($('sMax').value),unidade:$('sUn').value.trim(),ativo:$('sAtivo').checked,atualizado_em:new Date().toISOString()};try{if(id)await api('servicos?id=eq.'+id+'&'+userFilter(),{method:'PATCH',body});else await api('servicos',{method:'POST',body});closeModal();await loadServices();renderServicePicker();renderAdminServices()}catch(e){alert(e.message)}}
async function toggleService(id,ativo){try{await api('servicos?id=eq.'+id+'&'+userFilter(),{method:'PATCH',body:{ativo,atualizado_em:new Date().toISOString()}});await loadServices();renderServicePicker();renderAdminServices()}catch(e){alert(e.message)}}
function renderMaterials(){const q=($('materialSearch')?.value||'').toLowerCase();const rows=materials.filter(m=>`${m.nome} ${m.descricao||''}`.toLowerCase().includes(q));$('materialsBody').innerHTML=rows.map(m=>`<tr><td><b>${esc(m.nome)}</b></td><td>${esc(m.unidade)}</td><td>${money(m.custo)}</td><td>${money(m.preco_venda)}</td><td>${n(m.estoque)}</td><td>${m.ativo?'<span class="badge green">Ativo</span>':'<span class="badge">Inativo</span>'}</td><td class="actions"><button class="btn small" onclick="openMaterial(${m.id})">Editar</button><button class="btn small" onclick="toggleMaterial(${m.id},${!m.ativo})">${m.ativo?'Desativar':'Ativar'}</button></td></tr>`).join('')||'<tr><td colspan="7" class="empty">Nenhum material.</td></tr>'}
function openMaterial(id=null){const m=id?materials.find(x=>x.id==id):{};$('modalTitle').textContent=id?'Editar material':'Adicionar material';$('modalBody').innerHTML=`<div class="grid grid-2"><div class="field"><label>Nome</label><input id="mNome" value="${esc(m.nome)}"></div><div class="field"><label>Unidade</label><input id="mUn" value="${esc(m.unidade||'unidade')}"></div><div class="field"><label>Custo</label><input id="mCusto" type="number" step=".01" value="${m.custo??0}"></div><div class="field"><label>Preço de venda</label><input id="mVenda" type="number" step=".01" value="${m.preco_venda??0}"></div><div class="field"><label>Estoque</label><input id="mEstoque" type="number" step=".001" value="${m.estoque??0}"></div></div><div class="field"><label>Descrição</label><textarea id="mDesc">${esc(m.descricao)}</textarea></div><label><input id="mAtivo" type="checkbox" ${m.ativo!==false?'checked':''}> Ativo</label><br><br><button class="btn primary" onclick="saveMaterial(${id||'null'})">Salvar</button>`;openModal()}
async function saveMaterial(id){const body={user_id:currentUserId,nome:$('mNome').value.trim(),descricao:$('mDesc').value.trim(),unidade:$('mUn').value.trim(),custo:n($('mCusto').value),preco_venda:n($('mVenda').value),estoque:n($('mEstoque').value),ativo:$('mAtivo').checked,atualizado_em:new Date().toISOString()};try{if(id)await api('materiais?id=eq.'+id+'&'+userFilter(),{method:'PATCH',body});else await api('materiais',{method:'POST',body});closeModal();await loadMaterials();renderMaterials();renderQuoteMaterialPicker()}catch(e){alert(e.message)}}
async function toggleMaterial(id,ativo){try{await api('materiais?id=eq.'+id+'&'+userFilter(),{method:'PATCH',body:{ativo,atualizado_em:new Date().toISOString()}});await loadMaterials();renderMaterials();renderQuoteMaterialPicker()}catch(e){alert(e.message)}}
function renderQuoteMaterialPicker(){const q=($('materialQuoteSearch')?.value||'').toLowerCase();const rows=materials.filter(m=>m.ativo!==false&&`${m.nome} ${m.descricao||''}`.toLowerCase().includes(q));$('quoteMaterialPicker').innerHTML=rows.map(m=>`<div class="service-card"><div><strong>${esc(m.nome)}</strong><div class="price">${money(m.preco_venda)} / ${esc(m.unidade)} · Estoque ${n(m.estoque)}</div></div><button class="btn primary small" onclick="addMaterial(${m.id})">＋</button></div>`).join('')||'<div class="empty">Nenhum material encontrado.</div>'}
function addMaterial(id){const m=materials.find(x=>x.id==id);if(!m)return;const x=quoteMaterialItems.find(i=>i.material_id==id);if(x)x.quantidade++;else quoteMaterialItems.push({material_id:m.id,nome_material:m.nome,quantidade:1,valor_unitario:n(m.preco_venda)});renderQuoteMaterialItems();calcQuote()}
function renderQuoteMaterialItems(){$('quoteMaterialItems').innerHTML=quoteMaterialItems.map((x,i)=>`<div class="quote-item"><div class="quote-item-top"><div><b>${esc(x.nome_material)}</b></div><button class="btn small danger" onclick="removeMaterial(${i})">Remover</button></div><div class="quote-controls"><span>Qtd.</span><input type="number" min=".01" step=".01" value="${x.quantidade}" onchange="materialQty(${i},this.value)"><input type="number" min="0" step=".01" value="${x.valor_unitario}" onchange="materialPrice(${i},this.value)"><b style="margin-left:auto">${money(x.quantidade*x.valor_unitario)}</b></div></div>`).join('')||'<div class="empty">Nenhum material adicionado.</div>'}
function materialQty(i,v){quoteMaterialItems[i].quantidade=Math.max(.01,n(v));renderQuoteMaterialItems();calcQuote()}
function materialPrice(i,v){quoteMaterialItems[i].valor_unitario=Math.max(0,n(v));renderQuoteMaterialItems();calcQuote()}
function removeMaterial(i){quoteMaterialItems.splice(i,1);renderQuoteMaterialItems();calcQuote()}
function newQuote(){editingQuoteId=null;quoteItems=[];quoteMaterialItems=[];$('quoteTitle').textContent='Novo orçamento';$('qCliente').value='';$('qStatus').value='Rascunho';$('qMateriais').value=0;$('qDeslocamento').value=0;$('qDesconto').value=0;$('qAcrescimo').value=0;$('qPagamento').value='PIX';$('qPrazo').value='';$('qGarantia').value='';$('qObs').value='';updateClientFields();renderQuoteItems();renderQuoteMaterialItems();calcQuote()}
async function editQuote(id){const q=quotes.find(x=>x.id==id);if(!q)return;const [it,ma]=await Promise.all([api('orcamento_itens?orcamento_id=eq.'+id+'&'+userFilter()+'&select=*&order=id.asc'),api('orcamento_materiais?orcamento_id=eq.'+id+'&'+userFilter()+'&select=*&order=id.asc')]);editingQuoteId=id;quoteItems=(it||[]).map(x=>({servico_id:x.servico_id,nome_servico:x.nome_servico,categoria:x.categoria,quantidade:n(x.quantidade),tipo_preco:x.tipo_preco,valor_unitario:n(x.valor_unitario)}));quoteMaterialItems=(ma||[]).map(x=>({material_id:x.material_id,nome_material:x.nome_material,quantidade:n(x.quantidade),valor_unitario:n(x.valor_unitario)}));$('quoteTitle').textContent='Editar orçamento Nº '+q.numero;$('qCliente').value=q.cliente_id||'';$('qStatus').value=uiStatus(q.status);$('qMateriais').value=q.materiais||0;$('qDeslocamento').value=q.deslocamento||0;$('qDesconto').value=q.desconto||0;$('qAcrescimo').value=q.acrescimo||0;$('qPagamento').value=q.forma_pagamento||'PIX';$('qPrazo').value=q.prazo_execucao||'';$('qGarantia').value=q.garantia||'';$('qObs').value=q.observacoes||'';updateClientFields();renderQuoteItems();renderQuoteMaterialItems();calcQuote();go('novo')}
async function saveQuote(){if(!$('qCliente').value)return alert('Selecione um cliente.');if(!quoteItems.length&&!quoteMaterialItems.length)return alert('Adicione pelo menos um serviço ou material.');const labor=quoteItems.reduce((a,x)=>a+n(x.quantidade)*n(x.valor_unitario),0),mat=quoteMaterialItems.reduce((a,x)=>a+n(x.quantidade)*n(x.valor_unitario),0),travel=n($('qDeslocamento').value),disc=n($('qDesconto').value),inc=n($('qAcrescimo').value),total=Math.max(0,labor+mat+travel+inc-disc);const body={user_id:currentUserId,cliente_id:Number($('qCliente').value),mao_de_obra:labor,materiais:mat,deslocamento:travel,desconto:disc,acrescimo:inc,total,forma_pagamento:$('qPagamento').value,prazo_execucao:$('qPrazo').value.trim(),garantia:$('qGarantia').value.trim(),observacoes:$('qObs').value.trim(),status:dbStatus($('qStatus').value),atualizado_em:new Date().toISOString()};try{let saved;if(editingQuoteId){saved=(await api('orcamentos?id=eq.'+editingQuoteId+'&'+userFilter(),{method:'PATCH',body}))[0];await api('orcamento_itens?orcamento_id=eq.'+editingQuoteId+'&'+userFilter(),{method:'DELETE'});await api('orcamento_materiais?orcamento_id=eq.'+editingQuoteId+'&'+userFilter(),{method:'DELETE'})}else saved=(await api('orcamentos',{method:'POST',body}))[0];if(!saved||!saved.id)throw new Error('O Supabase não retornou o orçamento salvo. Verifique as permissões RLS e a resposta da tabela orcamentos.');for(const x of quoteItems)await api('orcamento_itens',{method:'POST',body:{user_id:currentUserId,orcamento_id:saved.id,servico_id:x.servico_id,nome_servico:x.nome_servico,categoria:x.categoria,quantidade:x.quantidade,tipo_preco:x.tipo_preco,valor_unitario:x.valor_unitario,subtotal:n(x.quantidade)*n(x.valor_unitario)}});for(const x of quoteMaterialItems)await api('orcamento_materiais',{method:'POST',body:{user_id:currentUserId,orcamento_id:saved.id,material_id:x.material_id,nome_material:x.nome_material,quantidade:x.quantidade,valor_unitario:x.valor_unitario,subtotal:n(x.quantidade)*n(x.valor_unitario)}});alert('Orçamento salvo. Nº '+saved.numero);await loadQuotes();renderDashboard();go('orcamentos')}catch(e){alert('Erro ao salvar: '+e.message)}}
function calcQuote(){const labor=quoteItems.reduce((a,x)=>a+n(x.quantidade)*n(x.valor_unitario),0),mat=quoteMaterialItems.reduce((a,x)=>a+n(x.quantidade)*n(x.valor_unitario),0),travel=n($('qDeslocamento').value),disc=n($('qDesconto').value),inc=n($('qAcrescimo').value),total=Math.max(0,labor+mat+travel+inc-disc);$('qMao').textContent=money(labor);$('qMatTotal').textContent=money(mat);$('qDeslTotal').textContent=money(travel);$('qDescTotal').textContent=money(disc);$('qAcrTotal').textContent=money(inc);$('qTotal').textContent=money(total);$('qMateriais').value=mat;return {labor,mat,travel,disc,inc,total}}
function updateClientFields(){const c=clients.find(x=>String(x.id)===String($('qCliente').value));$('qTelefone').value=c?.telefone||'';$('qEndereco').value=c?[c.endereco,c.numero,c.bairro,c.cidade,c.estado].filter(Boolean).join(', '):''}
function renderQuotes(){const s=($('quoteSearch')?.value||'').toLowerCase(),st=$('quoteFilterStatus')?.value||'',cl=$('quoteFilterClient')?.value||'';const rows=quotes.filter(q=>(!st||q.status===st)&&(!cl||String(q.cliente_id)===cl)&&`${q.numero} ${clientName(q.cliente_id)} ${q.status}`.toLowerCase().includes(s));$('quotesBody').innerHTML=rows.map(q=>`<tr><td>${q.numero}</td><td>${esc(clientName(q.cliente_id))}</td><td><select class="status-inline" onchange="changeQuoteStatus(${q.id},this.value)"><option ${q.status==='Rascunho'?'selected':''}>Rascunho</option><option ${q.status==='Enviado'?'selected':''}>Enviado</option><option ${q.status==='Aguardando resposta'?'selected':''}>Aguardando resposta</option><option ${q.status==='Aprovado'?'selected':''}>Aprovado</option><option ${q.status==='Rejeitado'?'selected':''}>Rejeitado</option><option ${q.status==='Em execução'?'selected':''}>Em execução</option><option ${q.status==='Concluído'?'selected':''}>Concluído</option><option ${q.status==='Cancelado'?'selected':''}>Cancelado</option></select></td><td>${money(q.mao_de_obra)}</td><td>${money(q.materiais)}</td><td><b>${money(q.total)}</b></td><td>${date(q.criado_em)}</td><td class="actions"><button class="btn small" onclick="editQuote(${q.id})">Abrir</button><button class="btn small" onclick="duplicateQuote(${q.id})">Duplicar</button><button class="btn small" onclick="printSavedQuote(${q.id})">PDF</button><button class="btn small danger" onclick="deleteQuote(${q.id})">Excluir</button></td></tr>`).join('')||'<tr><td colspan="8" class="empty">Nenhum orçamento.</td></tr>'}
async function changeQuoteStatus(id,status){
  const q=quotes.find(x=>String(x.id)===String(id));if(!q)return;
  const previous=q.status;q.status=status;renderQuotes();
  try{
    await api('orcamentos?id=eq.'+id+'&'+userFilter(),{method:'PATCH',body:{status:dbStatus(status),atualizado_em:new Date().toISOString()}});
    renderDashboard();
  }catch(e){
    q.status=previous;renderQuotes();
    alert('Não foi possível alterar o status: '+e.message);
  }
}
async function duplicateQuote(id){await editQuote(id);editingQuoteId=null;$('quoteTitle').textContent='Novo orçamento — cópia';$('qStatus').value='Rascunho'}
async function deleteQuote(id){if(!confirm('Excluir este orçamento e seus itens?'))return;try{await api('orcamento_itens?orcamento_id=eq.'+id+'&'+userFilter(),{method:'DELETE'});await api('orcamento_materiais?orcamento_id=eq.'+id+'&'+userFilter(),{method:'DELETE'});await api('orcamentos?id=eq.'+id+'&'+userFilter(),{method:'DELETE'});await loadQuotes();renderQuotes();renderDashboard()}catch(e){alert(e.message)}}
function renderConfigs(){$('configList').innerHTML=configs.map((c,i)=>`<div class="field"><label>${esc(c.chave)}</label><input data-cfg="${i}" value="${esc(c.valor||'')}"></div>`).join('')||'<p class="muted">Nenhuma configuração.</p>'}
async function saveConfigs(){try{for(let i=0;i<configs.length;i++){const e=document.querySelector(`[data-cfg="${i}"]`);await api('configuracoes?id=eq.'+configs[i].id+'&'+userFilter(),{method:'PATCH',body:{valor:e.value,atualizado_em:new Date().toISOString()}})}await loadConfigs();renderConfigs();alert('Configurações salvas.')}catch(e){alert(e.message)}}
function openModal(){$('modal').classList.add('show')}function closeModal(){$('modal').classList.remove('show')}
function printCurrentQuote(){const q={numero:editingQuoteId?(quotes.find(x=>x.id===editingQuoteId)?.numero||''): 'Novo',cliente_id:Number($('qCliente').value),status:$('qStatus').value,mao_de_obra:quoteItems.reduce((a,x)=>a+n(x.quantidade)*n(x.valor_unitario),0),materiais:quoteMaterialItems.reduce((a,x)=>a+n(x.quantidade)*n(x.valor_unitario),0),deslocamento:n($('qDeslocamento').value),desconto:n($('qDesconto').value),acrescimo:n($('qAcrescimo').value),forma_pagamento:$('qPagamento').value,prazo_execucao:$('qPrazo').value,garantia:$('qGarantia').value,observacoes:$('qObs').value};q.total=Math.max(0,q.mao_de_obra+q.materiais+q.deslocamento+q.acrescimo-q.desconto);printDoc(q,quoteItems.map(x=>({...x,subtotal:n(x.quantidade)*n(x.valor_unitario)})),quoteMaterialItems.map(x=>({...x,subtotal:n(x.quantidade)*n(x.valor_unitario)})))}
async function printSavedQuote(id){const q=quotes.find(x=>x.id==id);const [it,ma]=await Promise.all([api('orcamento_itens?orcamento_id=eq.'+id+'&'+userFilter()+'&select=*'),api('orcamento_materiais?orcamento_id=eq.'+id+'&'+userFilter()+'&select=*')]);printDoc(q,it||[],ma||[])}
function printDoc(q,it,ma){const c=clients.find(x=>String(x.id)===String(q.cliente_id))||{};const rows=it.map(x=>`<tr><td>${esc(x.nome_servico)}</td><td>${x.quantidade}</td><td>${esc(x.tipo_preco||'')}</td><td>${money(x.valor_unitario)}</td><td>${money(x.subtotal??n(x.quantidade)*n(x.valor_unitario))}</td></tr>`).join('');const mr=ma.map(x=>`<tr><td>${esc(x.nome_material)}</td><td>${x.quantidade}</td><td>${money(x.valor_unitario)}</td><td>${money(x.subtotal??n(x.quantidade)*n(x.valor_unitario))}</td></tr>`).join('');const w=window.open('','_blank');w.document.write(`<html><head><meta charset="utf-8"><title>Orçamento ${esc(q.numero)}</title><style>body{font-family:Arial;padding:35px;color:#172033;max-width:1000px;margin:auto}table{width:100%;border-collapse:collapse;margin:12px 0 22px}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;font-size:12px}.box{background:#f5f7fb;padding:14px;border-radius:8px;margin:15px 0}.total{text-align:right;font-size:24px;font-weight:bold;margin-top:20px}</style></head><body><h1>⚡ ORÇAMENTO DE SERVIÇOS ELÉTRICOS</h1><div class="box"><b>Nº:</b> ${esc(q.numero)}<br><b>Cliente:</b> ${esc(c.nome||clientName(q.cliente_id))}<br><b>Telefone:</b> ${esc(c.telefone||'')}<br><b>Endereço:</b> ${esc([c.endereco,c.numero,c.bairro,c.cidade,c.estado].filter(Boolean).join(', '))}<br><b>Status:</b> ${esc(q.status)}</div><h2>Serviços</h2><table><thead><tr><th>Serviço</th><th>Qtd.</th><th>Preço</th><th>Unitário</th><th>Subtotal</th></tr></thead><tbody>${rows||'<tr><td colspan="5">Nenhum serviço</td></tr>'}</tbody></table><h2>Materiais</h2><table><thead><tr><th>Material</th><th>Qtd.</th><th>Unitário</th><th>Subtotal</th></tr></thead><tbody>${mr||'<tr><td colspan="4">Nenhum material</td></tr>'}</tbody></table><div class="box">Mão de obra: ${money(q.mao_de_obra)}<br>Materiais: ${money(q.materiais)}<br>Deslocamento: ${money(q.deslocamento)}<br>Desconto: ${money(q.desconto)}<br>Acréscimo: ${money(q.acrescimo)}</div><div class="total">TOTAL: ${money(q.total)}</div><div class="box"><b>Pagamento:</b> ${esc(q.forma_pagamento||'')}<br><b>Prazo:</b> ${esc(q.prazo_execucao||'')}<br><b>Garantia:</b> ${esc(q.garantia||'')}<br><b>Observações:</b><br>${esc(q.observacoes||'').replace(/\n/g,'<br>')}</div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close()}
if(token())startApp();else $('login').classList.remove('hidden');
