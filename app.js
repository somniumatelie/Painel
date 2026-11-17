// Painel Somnium Ateliê: telas e regras. Recebe um "store" (Firebase ou de teste).
export function boot(store) {
  'use strict';
  const COLS = ['pecas', 'pedidos', 'clientes', 'insumos', 'vendas', 'agenda', 'ajustes'];
  const S = { user: null, cfg: null, view: 'inicio', sub: null, draft: null, filtro: 'Todos', busca: '', dia: iso(new Date()), semana: 0, msg: '', ready: {} };
  COLS.forEach(c => S[c] = []);
  const DEF_TAB = [{"m": 30, "n": "Barra de calça", "v": "20"}, {"m": 35, "n": "Barra italiana", "v": "25"}, {"m": 20, "n": "Barra de malha", "v": "15"}, {"m": 30, "n": "Ajuste de blusa", "v": "20"}, {"m": 35, "n": "Ajuste de blusa com manga", "v": "25"}, {"m": 30, "n": "Ajuste de cintura", "v": "15"}, {"m": 30, "n": "Ajuste de pernas", "v": "15"}, {"m": 40, "n": "Ajuste de vestido de festa", "v": "25"}, {"m": 45, "n": "Ajuste de blazer", "v": "30"}, {"m": 25, "n": "Encurtar blusa ou vestido", "v": "15"}, {"m": 40, "n": "Encurtar manga de camisa", "v": "25"}, {"m": 20, "n": "Encurtar manga de malha", "v": "15"}, {"m": 20, "n": "Encurtar alça", "v": "15"}, {"m": 30, "n": "Zíper de calça ou saia", "v": "15"}, {"m": 35, "n": "Zíper de vestido", "v": "20"}, {"m": 40, "n": "Zíper de jaqueta", "v": "20"}, {"m": 5, "n": "Botão ou casa", "v": "2"}, {"m": 15, "n": "Cerzido", "v": "10"}, {"m": 40, "n": "Colarinho", "v": "25"}];
  const DEF_CFG = { hora: 30, ind: 5, margem: 50, taxa: 0, arred: true, urg: 30, pix: '', cont: '@somniumatelie', nota: 1, tab: DEF_TAB };
  const COLECOES = ['Coleção Initium', 'Coleção Quotidie', 'Coleção Funis'];
  const TIPOS = ['Corda', 'Roupa', 'Acessório'];
  const STATUS = ['Aguardando', 'Cortando', 'Em costura', 'Aguardando prova', 'Pronto', 'Entregue'];
  const MEDIDAS = [['busto', 'Busto'], ['cintura', 'Cintura'], ['quadril', 'Quadril'], ['ombro', 'Ombro'], ['corpo', 'Corpo'], ['manga', 'Manga'], ['entrepernas', 'Entrepernas'], ['altura', 'Altura']];
  const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const DIAS_LONGO = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const HORAS = ['19:00', '20:00', '21:00'];

  // ---------- utilidades ----------
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parseIso(s) { const p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function num(v) { if (typeof v === 'number') return isFinite(v) ? v : 0; const n = parseFloat(String(v == null ? '' : v).replace(/\./g, '').replace(',', '.')); return isFinite(n) ? n : 0; }
  function numRaw(v) { if (typeof v === 'number') return isFinite(v) ? v : 0; const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : 0; }
  function money(v) { return 'R$ ' + (Math.round((v + 1e-9) * 100) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function getP(o, path) { return path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o); }
  function setP(o, path, v) { const k = path.split('.'); let a = o; for (let i = 0; i < k.length - 1; i++) { if (a[k[i]] == null) a[k[i]] = /^\d+$/.test(k[i + 1]) ? [] : {}; a = a[k[i]]; } a[k[k.length - 1]] = v; }
  function fmtData(s) { if (!s) return ''; const d = parseIso(s); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); }
  function cfg() { const c = Object.assign({}, DEF_CFG, S.cfg || {}); if (!Array.isArray(c.tab) || !c.tab.length) c.tab = DEF_TAB; return c; }
  const $ = s => document.querySelector(s);
  const app = $('#app');
  const ICON = {
    pedidos: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 2h6v4H9zM9 12h6M9 16h4"/>',
    agenda: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    clientes: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    pecas: '<path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
    insumos: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>',
    vendas: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    inicio: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    mais: '<path d="M5 12h.01M12 12h.01M19 12h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', back: '<path d="M15 6l-6 6 6 6"/>', cam: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    alerta: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    config: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    ajustes: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>', whats: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20l1.2-5.4A8.4 8.4 0 1 1 21 11.5z"/>', insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/>', x: '<path d="M18 6L6 18M6 6l12 12"/>'
  };
  function svg(n, s, c, w) { return '<svg viewBox="0 0 24 24" width="' + (s || 20) + '" height="' + (s || 20) + '" fill="none" stroke="' + (c || 'currentColor') + '" stroke-width="' + (w || 1.7) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>'; }

  // ---------- cálculo de preço ----------
  function calcPeca(p) {
    const c = cfg(); const taxa = Math.min(num(c.taxa), 60) / 100;
    let mat = 0; (p.mats || []).forEach(m => { mat += numRaw(m.precoUn) * numRaw(m.uso); });
    const mao = numRaw(p.horas) * num(c.hora), ind = mat * num(c.ind) / 100, emb = numRaw(p.emb);
    const custo = mat + mao + ind + emb;
    const margem = (p.margem === '' || p.margem == null) ? num(c.margem) : numRaw(p.margem);
    let sug = custo * (1 + margem / 100) / (1 - taxa);
    if (c.arred && sug > 0) { let b = Math.floor(sug) + 0.9; if (b < sug) b += 1; sug = Math.round(b * 100) / 100; }
    return { mat, mao, ind, emb, custo, sug, margem };
  }
  function ultimoPreco() { // preço por unidade da compra mais recente de cada insumo
    const m = {};
    S.insumos.slice().sort((a, b) => ((a.data || '') + String(a.criado || 0).padStart(15, '0')).localeCompare((b.data || '') + String(b.criado || 0).padStart(15, '0')))
      .forEach(i => { m[norm(i.nome)] = i; });
    return m;
  }
  function avisosPreco() {
    const ult = ultimoPreco(), out = [];
    S.pecas.forEach(p => {
      const mud = [];
      (p.mats || []).forEach(m => {
        const i = ult[norm(m.nome)];
        if (i && i.precoUn > 0 && Math.abs(i.precoUn - numRaw(m.precoUn)) > 0.005) mud.push({ nome: m.nome, de: numRaw(m.precoUn), para: i.precoUn, un: i.un });
      });
      if (mud.length) out.push({ peca: p, mud });
    });
    return out;
  }

  // ---------- fotos ----------
  function lerFoto(file) {
    return new Promise((ok, no) => {
      const r = new FileReader();
      r.onerror = () => no(new Error('leitura'));
      r.onload = () => {
        const im = new Image();
        im.onerror = () => no(new Error('imagem'));
        im.onload = () => {
          const mx = 640, k = Math.min(1, mx / Math.max(im.width, im.height));
          const cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
          cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
          ok(cv.toDataURL('image/jpeg', 0.72));
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }

  // ---------- gravação ----------
  async function salvar(col, obj) {
    const o = clone(obj); const id = o.id || store.newId(col); delete o.id; if (!o.criado) o.criado = Date.now(); o.atualizado = Date.now();
    const p = store.save(col, id, o); p.catch(() => toast('Não consegui salvar. Confira a internet.')); await Promise.race([p, new Promise(r => setTimeout(r, 600))]); return id;
  }
  function toast(t) { S.msg = t; S.toastTxt = t; S.toastAte = Date.now() + 2600; const el = $('#toast'); if (el) { el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2600); } }
  function guard(fn) { return async function () { try { await fn.apply(null, arguments); } catch (e) { toast('Não consegui salvar. Confira a internet e tente de novo.'); console.error(e); } }; }

  // ---------- peças de tela ----------
  const head = (t, sub) => '<div class="hd"><span class="sub">' + esc(sub || '') + '</span><span class="tit">' + esc(t) + '</span></div>';
  const topo = (rotulo, dest) => '<button class="back" data-act="' + (dest ? 'ir' : 'fechar') + '"' + (dest ? ' data-v="' + dest + '"' : '') + ' aria-label="Voltar">' + svg('back') + esc(rotulo) + '</button>';
  const fab = (rot, act) => '<button class="fab" data-act="' + act + '">' + svg('plus', 20, '#fff', 2) + esc(rot) + '</button>';
  const chip = (t, on, act, f, v) => '<button type="button" class="chip' + (on ? ' on' : '') + '" data-act="' + act + '" data-f="' + esc(f || '') + '" data-v="' + esc(v == null ? t : v) + '">' + esc(t) + '</button>';
  function inp(label, path, o) {
    o = o || {}; const v = getP(S.draft, path);
    const tag = o.area ? 'textarea' : 'input';
    const attrs = ' class="in' + (o.area ? ' ta' : '') + '" data-f="' + path + '"' + (o.mode ? ' inputmode="' + o.mode + '"' : '') + (o.type ? ' type="' + o.type + '"' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '');
    return '<label class="lb">' + esc(label) + (o.area ? '<textarea' + attrs + ' rows="3">' + esc(v) + '</textarea>' : '<input' + attrs + ' value="' + esc(v) + '">') + '</label>';
  }
  function sel(label, path, opts) {
    const v = getP(S.draft, path);
    return '<label class="lb">' + esc(label) + '<select class="in" data-f="' + path + '">' + opts.map(o => { const val = Array.isArray(o) ? o[0] : o, tx = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(val) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(tx) + '</option>'; }).join('') + '</select></label>';
  }
  const nav = () => {
    const it = [['inicio', 'Início'], ['pedidos', 'Pedidos'], ['agenda', 'Agenda'], ['pecas', 'Peças'], ['mais', 'Mais']];
    const ativo = ['clientes', 'insumos', 'vendas', 'config', 'ajustes'].includes(S.view) ? 'mais' : S.view;
    return '<nav class="nav">' + it.map(i => '<button data-act="ir" data-v="' + i[0] + '" class="' + (ativo === i[0] ? 'on' : '') + '">' + svg(i[0], 24, 'currentColor', i[0] === 'mais' ? 3 : 1.7) + i[1] + '</button>').join('') + '</nav>';
  };
  const tela = (corpo, extra) => '<div class="tela' + (S.draft ? ' form' : '') + '">' + corpo + '</div>' + (S.draft ? '' : nav()) + (extra || '') + '<div id="toast" class="toast"></div>';

  // ---------- telas ----------
  function vLogin() {
    app.innerHTML = '<div class="login"><img src="logo.png" alt="Somnium Ateliê" width="150" height="150"><div class="tit">Painel Somnium Ateliê</div><p class="sub">Entre com a sua conta Google para abrir o painel.</p><button class="btn" data-act="entrar">Entrar com Google</button><p class="err" id="err">' + esc(S.msg) + '</p></div>';
  }
  function vInicio() {
    const hoje = new Date(); const dt = DIAS_LONGO[hoje.getDay()].toLowerCase() + (hoje.getDay() > 0 && hoje.getDay() < 6 ? '-feira' : '') + ', ' + hoje.getDate() + ' de ' + MESES[hoje.getMonth()];
    const av = avisosPreco().length;
    const t = (v, n, s) => '<button class="tile" data-act="ir" data-v="' + v + '"><span class="ic">' + svg(v, 20, '#7A5FA0') + '</span><span class="tt"><b>' + n + '</b><small>' + s + '</small></span></button>';
    const hj = iso(hoje), ag = S.agenda.filter(x => x.data === hj).sort((x, y) => (x.hora || '').localeCompare(y.hora || '')).slice(0, 4);
    const ent = S.pedidos.filter(p => p.status !== 'Entregue').map(p => ({ k: 'pedidos:' + p.id, t: p.titulo || 'Pedido', c: nomeCliente(p.clienteId) || p.clienteNome || '', d: p.prazo || '' }))
      .concat(S.ajustes.filter(x => x.status !== 'Entregue').map(x => ({ k: 'ajustes:' + x.id, t: 'Ajuste de roupa', c: nomeAj(x) || '', d: x.prazo || '' })))
      .sort((x, y) => (x.d || '9999').localeCompare(y.d || '9999')).slice(0, 3);
    const lin = (k, t, m) => '<button class="card" data-act="editar" data-v="' + k + '"><div class="l1"><b>' + esc(t) + '</b><span class="mut">' + esc(m) + '</span></div></button>';
    return tela('<img class="marca" src="marca.png" alt="" aria-hidden="true"><div class="hd rel"><span class="sub">' + esc(dt) + '</span><span class="tit big">Olá, Keila</span></div><div class="frase rel">De rascunhos no caderno à linha na agulha</div>' +
      '<div class="sec2 rel">Hoje na agenda</div><div class="lista rel">' + (ag.length ? ag.map(x => lin('agenda:' + x.id, x.titulo, x.hora ? x.hora.slice(0, 5) : '')).join('') : '<p class="vazio">Nada marcado para hoje.</p>') + '</div>' +
      '<div class="sec2 rel">Próximas entregas</div><div class="lista rel">' + (ent.length ? ent.map(x => lin(x.k, x.t + (x.c ? ' · ' + x.c : ''), x.d ? fmtData(x.d) : 'sem prazo')).join('') : '<p class="vazio">Nenhuma entrega pendente.</p>') + '</div>' +
      (av ? '<button class="aviso rel" data-act="ir" data-v="insumos">' + svg('alerta', 18, '#8C6B2E') + '<span>' + av + (av > 1 ? ' preços desatualizados' : ' preço desatualizado') + '</span></button>' : '') +
      '<div class="sec2 rel">Atalhos</div><div class="grid rel">' + t('clientes', 'Clientes', 'Medidas e fichas') + t('ajustes', 'Ajustes', 'Barras e consertos') + t('insumos', 'Insumos', 'Compras e preços') + t('vendas', 'Vendas', 'Números do mês') + '</div>');
  }
  function vPedidos() {
    const lista = S.pedidos.filter(p => S.filtro === 'Todos' || (S.filtro === 'Andamento' && p.status !== 'Entregue') || (S.filtro === 'Entregar' && (p.status === 'Pronto' || p.status === 'Aguardando prova')) || (S.filtro === 'Entregues' && p.status === 'Entregue'))
      .sort((a, b) => (a.prazo || '9999').localeCompare(b.prazo || '9999'));
    const cor = s => s === 'Entregue' ? 'ok' : (s === 'Aguardando prova' || s === 'Pronto') ? 'gold' : 'lil';
    return tela(head('Pedidos', S.pedidos.length + (S.pedidos.length === 1 ? ' pedido' : ' pedidos')) +
      '<div class="chips">' + ['Todos', 'Andamento', 'Entregar', 'Entregues'].map(f => chip(f, S.filtro === f, 'filtro', '', f)).join('') + '</div>' +
      '<div class="lista">' + (lista.length ? lista.map(p => '<button class="card" data-act="editar" data-v="pedidos:' + p.id + '"><div class="l1"><b>' + esc(p.titulo || 'Pedido') + '</b><span class="mut">' + (p.prazo ? fmtData(p.prazo) : 'sem prazo') + '</span></div><div class="l1"><span class="mut">' + esc(nomeCliente(p.clienteId) || p.clienteNome || '') + '</span><span class="pill ' + cor(p.status) + '">' + esc(p.status) + '</span></div></button>').join('') : '<p class="vazio">Nenhum pedido ainda. Toque em “Novo pedido”.</p>') + '</div>' + fab('Novo pedido', 'novo-pedidos'));
  }
  function nomeCliente(id) { const c = S.clientes.find(x => x.id === id); return c ? c.nome : ''; }
  function vFormPedido() {
    const d = S.draft;
    return tela(topo('Pedidos') + '<div class="tit">' + (d.id ? 'Pedido' : 'Novo pedido') + '</div>' +
      inp('O que vai fazer', 'titulo', { ph: 'Ex.: Vestido, barra de calça' }) +
      sel('Cliente', 'clienteId', [['', '— escolher —']].concat(S.clientes.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map(c => [c.id, c.nome]))) +
      inp('Prazo de entrega', 'prazo', { type: 'date' }) + inp('Valor (R$)', 'valor', { mode: 'decimal' }) +
      '<div class="lb">Situação</div><div class="chips wrap">' + STATUS.map(s => chip(s, d.status === s, 'set', 'status', s)).join('') + '</div>' +
      inp('Observações', 'obs', { area: true }) + barra(d.id ? 'excluir' : '', 'pedidos'));
  }
  function barra(excl, col) { return '<div class="barra">' + (excl ? '<button class="btn sec" data-act="excluir" data-v="' + col + '">Excluir</button>' : '') + '<button class="btn" data-act="salvar" data-v="' + col + '">Salvar</button></div>'; }

  function semanaDias() {
    const base = parseIso(S.dia); const dow = (base.getDay() + 6) % 7; const seg = new Date(base); seg.setDate(base.getDate() - dow + S.semana * 7);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(seg); d.setDate(seg.getDate() + i); return d; });
  }
  function vAgenda() {
    const dias = semanaDias(); const sel = S.dia; const dSel = parseIso(sel); const util = dSel.getDay() >= 1 && dSel.getDay() <= 5;
    const tarefas = S.agenda.filter(t => t.data === sel); const pedidosDia = S.pedidos.concat(S.ajustes.map(a => Object.assign({}, a, { titulo: 'Ajuste' + (a.clienteId ? ' de ' + nomeCliente(a.clienteId) : a.clienteNome ? ' de ' + a.clienteNome : '') }))).filter(p => p.prazo === sel && p.status !== 'Entregue');
    const mesTxt = dias[0].getDate() + ' a ' + dias[6].getDate() + ' de ' + MESES[dias[6].getMonth()];
    const strip = '<div class="strip">' + dias.map(d => { const k = iso(d); const tem = S.agenda.some(t => t.data === k) || S.pedidos.concat(S.ajustes).some(p => p.prazo === k && p.status !== 'Entregue'); return '<button class="dia' + (k === sel ? ' on' : '') + '" data-act="dia" data-v="' + k + '"><small>' + DIAS[d.getDay()] + '</small><b>' + d.getDate() + '</b><i class="' + (tem ? 'pt' : '') + '"></i></button>'; }).join('') + '</div>';
    const item = t => '<div class="tarefa' + (t.feito ? ' feito' : '') + '"><button class="cx" data-act="feito" data-v="' + t.id + '" aria-label="Marcar como feito">' + (t.feito ? svg('x', 14, '#7A5FA0', 2.4).replace('M18 6L6 18M6 6l12 12', 'M5 12l5 5 9-10') : '') + '</button><button class="tx" data-act="editar" data-v="agenda:' + t.id + '"><b>' + esc(t.titulo) + '</b>' + (t.obs ? '<small>' + esc(t.obs) + '</small>' : '') + '</button></div>';
    let corpo;
    if (util) {
      corpo = '<div class="l1 sec"><b>' + DIAS_LONGO[dSel.getDay()] + ', ' + dSel.getDate() + '</b><span class="mut">Costura das 19h às 22h</span></div>' +
        HORAS.map(h => { const ts = tarefas.filter(t => t.hora === h); return '<div class="slot"><span class="hr">' + h.slice(0, 2) + 'h</span><div class="sl">' + (ts.length ? ts.map(item).join('') : '<button class="livre" data-act="novo-agenda-hora" data-v="' + h + '">Livre</button>') + '</div></div>'; }).join('') +
        (tarefas.filter(t => !HORAS.includes(t.hora)).length ? '<div class="mut sm">Sem horário</div>' + tarefas.filter(t => !HORAS.includes(t.hora)).map(item).join('') : '');
    } else {
      corpo = '<div class="l1 sec"><b>' + DIAS_LONGO[dSel.getDay()] + ', ' + dSel.getDate() + '</b><span class="mut">Sem horário fixo</span></div>' + (tarefas.length ? tarefas.map(item).join('') : '<p class="vazio">Fim de semana livre. Anote o que quiser fazer.</p>');
    }
    const ped = pedidosDia.length ? '<div class="aviso">' + svg('agenda', 18, '#8C6B2E') + '<span>Entrega: ' + pedidosDia.map(p => esc(p.titulo)).join(', ') + '</span></div>' : '';
    return tela(head('Agenda', 'semana de ' + mesTxt) + '<div class="sem"><button data-act="semana" data-v="-1" aria-label="Semana anterior">' + svg('back') + '</button><button data-act="hoje" class="mut">hoje</button><button data-act="semana" data-v="1" aria-label="Próxima semana">' + svg('chevron') + '</button></div>' + strip + '<div class="agd">' + corpo + ped + '</div>' + fab('Adicionar', 'novo-agenda'));
  }
  function vFormAgenda() {
    const d = S.draft; const dd = parseIso(d.data || S.dia); const util = dd.getDay() >= 1 && dd.getDay() <= 5;
    return tela(topo('Agenda') + '<div class="tit">' + (d.id ? 'Compromisso' : 'Novo compromisso') + '</div>' + inp('O que fazer', 'titulo') + inp('Dia', 'data', { type: 'date' }) +
      (util ? '<div class="lb">Horário (opcional)</div><div class="chips wrap">' + chip('Sem horário', !d.hora, 'set', 'hora', '') + HORAS.map(h => chip(h.slice(0, 2) + 'h', d.hora === h, 'set', 'hora', h)).join('') + '</div>' : '') + inp('Observação', 'obs', { area: true }) + barra(d.id ? 'excluir' : '', 'agenda'));
  }

  function vClientes() {
    const q = norm(S.busca); const lista = S.clientes.filter(c => !q || norm(c.nome).includes(q)).sort((a, b) => a.nome.localeCompare(b.nome));
    return tela(topo('Mais', 'mais') + head('Clientes', S.clientes.length + ' fichas') + '<input class="in busca" id="busca" placeholder="Buscar cliente" value="' + esc(S.busca) + '">' +
      '<div class="lista">' + (lista.length ? lista.map(c => '<button class="card row" data-act="editar" data-v="clientes:' + c.id + '"><span class="av">' + esc(c.nome.split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase()) + '</span><span class="tt"><b>' + esc(c.nome) + '</b><small>' + esc(histResumo(c.id)) + '</small></span>' + svg('chevron', 18, '#6D6476') + '</button>').join('') : '<p class="vazio">Nenhum cliente ainda.</p>') + '</div>' + fab('Novo cliente', 'novo-clientes'));
  }
  function histResumo(id) { const n = S.pedidos.filter(p => p.clienteId === id).length; return n ? n + (n > 1 ? ' pedidos' : ' pedido') : 'sem pedidos'; }
  function vFormCliente() {
    const d = S.draft; const tel = String(d.whats || '').replace(/\D/g, ''); const ig = String(d.insta || '').replace(/^@/, '').trim();
    const hist = d.id ? S.pedidos.filter(p => p.clienteId === d.id).concat(S.ajustes.filter(a => a.clienteId === d.id).map(a => ({ titulo: 'Ajuste de roupa', status: a.status || '', prazo: a.prazo, valor: calcAjuste(a).total }))).concat(S.vendas.filter(v => v.clienteId === d.id).map(v => ({ titulo: v.descricao, status: 'Venda', prazo: v.data, valor: v.valor }))) : [];
    return tela(topo('Clientes') + '<div class="tit">' + (d.id ? esc(d.nome) : 'Novo cliente') + '</div>' + inp('Nome', 'nome') + inp('WhatsApp', 'whats', { mode: 'tel', ph: 'DDD + número' }) + inp('Instagram', 'insta', { ph: '@usuario' }) +
      (tel || ig ? '<div class="duo">' + (tel ? '<a class="btn sec" target="_blank" rel="noopener" href="https://wa.me/55' + tel.replace(/^55/, '') + '">' + svg('whats', 18) + 'WhatsApp</a>' : '') + (ig ? '<a class="btn sec" target="_blank" rel="noopener" href="https://instagram.com/' + esc(ig) + '">' + svg('insta', 18) + 'Instagram</a>' : '') + '</div>' : '') +
      '<div class="sec2">Medidas (cm)</div><div class="med">' + MEDIDAS.map(m => '<label class="mm"><span>' + m[1] + '</span><input class="in" inputmode="decimal" data-f="med.' + m[0] + '" value="' + esc(getP(d, 'med.' + m[0])) + '"></label>').join('') + '</div>' + inp('Data das medidas', 'medData', { type: 'date' }) +
      inp('Observações', 'obs', { area: true, ph: 'Ex.: gosta de caimento solto' }) +
      (hist.length ? '<div class="sec2">Histórico</div>' + hist.map(h => '<div class="l1"><span>' + esc(h.titulo) + '</span><span class="mut">' + esc(h.status) + (h.valor ? ' · ' + money(num(h.valor)) : '') + '</span></div>').join('') : '') + barra(d.id ? 'excluir' : '', 'clientes'));
  }

  function vPecas() {
    const grupos = COLECOES.concat(['Sem coleção']);
    const av = avisosPreco();
    const card = p => '<button class="card row" data-act="editar" data-v="pecas:' + p.id + '">' + ((p.fotos && p.fotos[0]) ? '<img class="th" src="' + p.fotos[0] + '" alt="">' : '<span class="th ph">' + svg('cam', 20, '#7A5FA0') + '</span>') + '<span class="tt"><b>' + esc(p.nome) + '</b><small>' + esc(p.tipo || '') + (p.vitrine ? ' · na vitrine' : '') + '</small></span><b>' + money(num(p.preco)) + '</b></button>';
    return tela(head('Peças', S.pecas.length + (S.pecas.length === 1 ? ' peça' : ' peças')) + (av.length ? '<button class="aviso" data-act="ir" data-v="insumos">' + svg('alerta', 18, '#8C6B2E') + '<span>' + av.length + ' com preço de material desatualizado</span></button>' : '') +
      (S.pecas.length ? grupos.map(g => { const ps = S.pecas.filter(p => (p.colecao || 'Sem coleção') === g); return ps.length ? '<div class="sec2">' + esc(g) + '</div><div class="lista">' + ps.sort((a, b) => a.nome.localeCompare(b.nome)).map(card).join('') + '</div>' : ''; }).join('') : '<p class="vazio">Nenhuma peça ainda. Toque em “Nova peça”, ou importe o backup do painel antigo em Mais.</p>') + fab('Nova peça', 'novo-pecas'));
  }
  function pontoOpts() {
    const nomes = { 0: 'Ponto reto', 1: 'Reto', 2: 'Reto', 3: 'Reto', 4: 'Reto', 5: 'Zigue-zague', 6: 'Zigue-zague de 3 passos', 7: 'Zigue-zague cheio', 12: 'Invisível', 13: 'Invisível', 17: 'Decorativo elástico', 18: 'Decorativo elástico', 19: 'Decorativo elástico', 26: 'Pregar botão', 27: 'Cerzido' };
    const o = [['', '— escolher —']];
    for (let i = 0; i < 100; i++) { const n = String(i).padStart(2, '0'); let t = nomes[i]; if (!t) t = (i >= 8 && i <= 11) || (i >= 14 && i <= 16) ? 'Chuleado/overloque' : (i >= 20 && i <= 25) ? 'Casa de botão' : 'Decorativo'; o.push([n, n + ' · ' + t]); }
    return o;
  }
  function vFormPeca() {
    const d = S.draft; const r = calcPeca(d);
    const mats = (d.mats || []).map((m, i) => '<div class="mat"><div class="mh"><input class="in" data-f="mats.' + i + '.nome" placeholder="Material" value="' + esc(m.nome) + '"><button class="x" data-act="mat-del" data-v="' + i + '" aria-label="Remover material">' + svg('x', 18) + '</button></div><div class="tri"><label>Unidade<input class="in" data-f="mats.' + i + '.un" value="' + esc(m.un) + '" placeholder="m, un, kg"></label><label>Preço por unidade<input class="in" inputmode="decimal" data-f="mats.' + i + '.precoUn" value="' + esc(m.precoUn) + '"></label><label>Usei<input class="in" inputmode="decimal" data-f="mats.' + i + '.uso" value="' + esc(m.uso) + '"></label></div></div>').join('');
    const fotos = '<div class="fotos">' + (d.fotos || []).map((f, i) => '<div class="ft"><img src="' + f + '" alt=""><button class="x" data-act="foto-del" data-v="' + i + '" aria-label="Remover foto">' + svg('x', 16, '#fff', 2) + '</button></div>').join('') + ((d.fotos || []).length < 4 ? '<button class="addf" data-act="foto">' + svg('cam', 24) + 'Foto</button>' : '') + '</div><input type="file" id="arq" accept="image/*" multiple hidden>';
    return tela(topo('Peças') + '<div class="tit">' + (d.id ? esc(d.nome || 'Peça') : 'Nova peça') + '</div>' + (d.id ? '<div class="duo" style="margin:4px 0 8px"><button class="btn sec" data-act="card-peca">Card da peça</button><button class="btn sec" data-act="nota-peca">Notinha</button></div>' : '') + fotos + inp('Nome', 'nome') +
      '<div class="lb">Coleção</div><div class="chips wrap">' + COLECOES.map(c => chip(c.replace('Coleção ', ''), d.colecao === c, 'set', 'colecao', c)).join('') + '</div>' +
      '<div class="lb">Tipo</div><div class="chips wrap">' + TIPOS.map(c => chip(c, d.tipo === c, 'set', 'tipo', c)).join('') + '</div>' +
      '<div class="rowh"><span class="sec2">Materiais</span><span class="lk"><button data-act="mat-insumo">+ dos insumos</button><button data-act="mat-add">+ novo</button></span></div>' + mats +
      '<div class="duo2">' + inp('Horas gastas', 'horas', { mode: 'decimal' }) + inp('Embalagem (R$)', 'emb', { mode: 'decimal' }) + '</div>' +
      '<div class="sec2">Máquina</div><p class="mut sm">Anote como a máquina estava regulada. Na próxima vez, a peça sai igual.</p>' + inp('Agulha', 'maq.agulha', { ph: 'Ex.: 90/14' }) + inp('Tensão da linha', 'maq.tensao') + sel('Ponto (tabela da Singer)', 'maq.ponto', pontoOpts()) +
      '<div class="duo2">' + inp('Comprimento do ponto', 'maq.comp', { ph: 'mm' }) + inp('Largura', 'maq.larg', { ph: 'mm' }) + '</div>' + inp('Observação da máquina', 'maq.obs', { area: true }) +
      '<div class="sec2">Preço</div><div class="calc" id="calc">' + calcHtml(r, d) + '</div>' + inp('Margem desta peça (%, vazio = padrão ' + cfg().margem + ')', 'margem', { mode: 'decimal' }) + inp('Preço final (R$)', 'preco', { mode: 'decimal', ph: 'vazio = preço sugerido' }) +
      '<label class="sw"><span><b>Mostrar na vitrine</b><small>aparece no catálogo e no PDF</small></span><input type="checkbox" data-f="vitrine"' + (d.vitrine ? ' checked' : '') + '></label>' + inp('Texto da peça', 'texto', { area: true }) + barra(d.id ? 'excluir' : '', 'pecas'));
  }
  function calcHtml(r, d) {
    const l = (a, b, bold) => '<div class="cl' + (bold ? ' bold' : '') + '"><span>' + a + '</span><span>' + b + '</span></div>';
    return l('Materiais', money(r.mat)) + l('Mão de obra (' + (numRaw(d.horas) || 0) + ' h × ' + money(num(cfg().hora)) + ')', money(r.mao)) + l('Indiretos e embalagem', money(r.ind + r.emb)) + '<hr>' + l('Custo', money(r.custo)) + l('Preço sugerido (margem ' + r.margem + '%)', money(r.sug), true);
  }

  function vInsumos() {
    const av = avisosPreco(); const ult = ultimoPreco();
    const alerta = Object.keys(av.reduce((a, x) => { x.mud.forEach(m => a[norm(m.nome)] = m); return a; }, {})).length;
    const txt = av.length ? av.map(a => a.mud.map(m => '<div class="am"><b>' + esc(m.nome) + '</b>: de ' + money(m.de) + ' para ' + money(m.para) + ' por ' + esc(m.un || 'unidade') + ' <small>(' + esc(a.peca.nome) + ')</small></div>').join('')).join('') : '';
    const lista = S.insumos.slice().sort((a, b) => (b.data || '').localeCompare(a.data || '') || (b.criado || 0) - (a.criado || 0));
    return tela(topo('Mais', 'mais') + head('Insumos', S.insumos.length + ' compras') + (av.length ? '<div class="alerta">' + svg('alerta', 20, '#6B5120') + '<div>' + txt + '</div><button class="btn gold" data-act="atualizar-precos">Atualizar preço</button></div>' : '') +
      '<div class="lista">' + (lista.length ? lista.map(i => '<button class="card row" data-act="editar" data-v="insumos:' + i.id + '"><span class="tt"><b>' + esc(i.nome) + '</b><small>' + esc(i.fornecedor || '') + (i.data ? ' · ' + fmtData(i.data) : '') + ' · ' + esc(String(i.qtd)) + ' ' + esc(i.un || '') + '</small></span><b>' + money(numRaw(i.preco)) + '</b></button>').join('') : '<p class="vazio">Nenhuma compra ainda.</p>') + '</div>' + fab('Nova compra', 'novo-insumos'));
  }
  function vFormInsumo() {
    const d = S.draft; const pu = numRaw(d.qtd) > 0 ? numRaw(d.preco) / numRaw(d.qtd) : 0;
    return tela(topo('Insumos') + '<div class="tit">' + (d.id ? 'Compra' : 'Nova compra') + '</div>' + inp('Material', 'nome', { ph: 'Ex.: Corda 6 mm' }) + inp('Fornecedor', 'fornecedor') + inp('Categoria', 'categoria', { ph: 'Ex.: Cordas, Aviamentos' }) + inp('Data da compra', 'data', { type: 'date' }) +
      '<div class="duo2">' + inp('Quantidade', 'qtd', { mode: 'decimal' }) + inp('Unidade', 'un', { ph: 'm, un, kg' }) + '</div>' + inp('Valor total pago (R$)', 'preco', { mode: 'decimal' }) +
      '<p class="mut sm" id="pu">Preço por unidade: ' + money(pu) + '</p>' + barra(d.id ? 'excluir' : '', 'insumos'));
  }
  function vVendas() {
    const hoje = new Date(); const mes = iso(hoje).slice(0, 7);
    const doMes = S.vendas.filter(v => (v.data || '').slice(0, 7) === mes); const tot = doMes.reduce((a, v) => a + num(v.valor), 0), luc = doMes.reduce((a, v) => a + num(v.valor) - num(v.custo), 0);
    const lista = S.vendas.slice().sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    return tela(topo('Mais', 'mais') + head('Vendas', MESES[hoje.getMonth()]) + '<div class="duo2"><div class="num"><small>Vendido</small><b>' + money(tot) + '</b></div><div class="num"><small>Lucro</small><b>' + money(luc) + '</b></div></div><div class="sec2">Vendas</div><div class="lista">' +
      (lista.length ? lista.map(v => '<button class="card row" data-act="editar" data-v="vendas:' + v.id + '"><span class="tt"><b>' + esc(v.descricao) + '</b><small>' + esc(nomeCliente(v.clienteId) || '') + (v.data ? ' · ' + fmtData(v.data) : '') + '</small></span><b>' + money(num(v.valor)) + '</b></button>').join('') : '<p class="vazio">Nenhuma venda ainda.</p>') + '</div>' + fab('Nova venda', 'novo-vendas'));
  }
  function vFormVenda() {
    const d = S.draft;
    return tela(topo('Vendas') + '<div class="tit">' + (d.id ? 'Venda' : 'Nova venda') + '</div>' + inp('O que foi vendido', 'descricao') + sel('Cliente', 'clienteId', [['', '— opcional —']].concat(S.clientes.map(c => [c.id, c.nome]))) + inp('Data', 'data', { type: 'date' }) + '<div class="duo2">' + inp('Valor (R$)', 'valor', { mode: 'decimal' }) + inp('Custo (R$, opcional)', 'custo', { mode: 'decimal' }) + '</div>' + barra(d.id ? 'excluir' : '', 'vendas'));
  }
  function vMais() {
    const b = (v, n, s) => '<button class="card row" data-act="ir" data-v="' + v + '"><span class="ic">' + svg(v === 'config' ? 'config' : v, 20, '#7A5FA0') + '</span><span class="tt"><b>' + n + '</b><small>' + s + '</small></span>' + svg('chevron', 18, '#6D6476') + '</button>';
    return tela(head('Mais', S.user ? S.user.email : '') + '<div class="lista">' + b('clientes', 'Clientes', 'Medidas e fichas') + b('ajustes', 'Ajustes de roupa', 'Barras, zíperes e consertos') + b('insumos', 'Insumos', 'Compras e preços') + b('vendas', 'Vendas', 'Números do mês') + b('config', 'Configurações', 'Hora, margem e backup') + '</div><button class="btn sec" data-act="sair" style="margin-top:18px">Sair da conta</button>');
  }
  function vConfig() {
    const d = S.draft;
    return tela(topo('Mais', 'mais') + '<div class="tit">Configurações</div>' + inp('Valor da hora de trabalho (R$)', 'hora', { mode: 'decimal' }) + inp('Custos indiretos sobre materiais (%)', 'ind', { mode: 'decimal' }) + inp('Margem padrão (%)', 'margem', { mode: 'decimal' }) + inp('Taxa de maquininha (%)', 'taxa', { mode: 'decimal' }) +
      inp('Taxa de urgência nos ajustes (%)', 'urg', { mode: 'decimal' }) + inp('Chave Pix (aparece na notinha)', 'pix') + inp('Contato (aparece na notinha)', 'cont') +
      '<label class="sw"><span><b>Arredondar preço para terminar em ,90</b></span><input type="checkbox" data-f="arred"' + (d.arred ? ' checked' : '') + '></label><div class="rowh"><span class="sec2">Tabela de valores dos ajustes</span><span class="lk"><button data-act="tab-add">+ serviço</button></span></div><p class="mut sm">Minutos gastos e valor cobrado por serviço. Ao escolher o serviço em um ajuste, esses valores já vêm preenchidos.</p>' + (d.tab || []).map((t, i) => '<div class="mat"><div class="mh"><input class="in" data-f="tab.' + i + '.n" placeholder="Serviço" value="' + esc(t.n) + '"><button class="x" data-act="tab-del" data-v="' + i + '" aria-label="Remover serviço">' + svg('x', 18) + '</button></div><div class="tri2"><label>Minutos<input class="in" inputmode="decimal" data-f="tab.' + i + '.m" value="' + esc(t.m) + '"></label><label>Valor (R$)<input class="in" inputmode="decimal" data-f="tab.' + i + '.v" value="' + esc(t.v) + '"></label></div></div>').join('') + '<div class="barra"><button class="btn" data-act="salvar" data-v="config">Salvar</button></div>' +
      '<div class="sec2">Backup</div><p class="mut sm">Baixe uma cópia dos seus dados toda semana. Para importar o backup do painel antigo, escolha o arquivo abaixo.</p><div class="duo"><button class="btn sec" data-act="backup">Fazer backup</button><button class="btn sec" data-act="restaurar">Restaurar / importar</button></div><input type="file" id="arqbk" accept="application/json,.json" hidden>');
  }


  // ---------- ajuste de roupa ----------
  function calcAjuste(a) {
    if (a.notaPeca) { const q = Math.max(numRaw(a.qtd), 0) || 0, v = num(a.vu) * q, abat = Math.min(Math.max(num(a.abat), 0), v), total = v - abat, custo = numRaw(a.custoUn) * q;
      return { itens: [{ d: a.nome || 'Peça', q, v, sug: v }], bruto: v, urg: 0, abat, total, custo, mat: 0, mao: 0, ind: 0, horas: 0, lucro: total - custo }; }
    const c = cfg(), taxa = Math.min(num(c.taxa), 60) / 100; let mat = 0, mao = 0, ind = 0, bruto = 0, horas = 0; const itens = [];
    (a.servs || []).forEach(sv => {
      const q = Math.max(numRaw(sv.qtd), 0), hh = numRaw(sv.min) / 60 * q, lm = num(sv.mat) * q, lmao = hh * num(c.hora), lind = lm * num(c.ind) / 100, lc = lm + lmao + lind;
      const sug = lc > 0 ? Math.ceil(lc * (1 + num(c.margem) / 100) / (1 - taxa)) : 0;
      const v = String(sv.vu == null ? '' : sv.vu).trim() !== '' ? num(sv.vu) * q : sug;
      mat += lm; mao += lmao; ind += lind; horas += hh; bruto += v; itens.push({ d: (sv.nome || 'Serviço') + (String(sv.det || '').trim() ? ' — ' + String(sv.det).trim() : ''), q, v, sug });
    });
    const urg = a.urgente && bruto > 0 ? bruto * num(c.urg) / 100 : 0; const abat = Math.min(Math.max(num(a.abat), 0), bruto + urg); const total = bruto + urg - abat; const custo = mat + mao + ind;
    return { itens, bruto, urg, abat, total, custo, mat, mao, ind, horas, lucro: total - total * taxa - custo };
  }
  function calcAjHtml(r) {
    const l = (x, y, b) => '<div class="cl' + (b ? ' bold' : '') + '"><span>' + x + '</span><span>' + y + '</span></div>';
    return r.itens.map(i => l(esc(i.d) + (i.q !== 1 ? ' ×' + i.q : ''), money(i.v))).join('') + (r.urg ? l('Taxa de urgência', money(r.urg)) : '') + (r.abat ? l('Desconto', '− ' + money(r.abat)) : '') + '<hr>' + l('Total', money(r.total), true) + l('Seu custo estimado', money(r.custo)) + l('Sobra para você', money(r.lucro));
  }
  function nomeAj(a) { return nomeCliente(a.clienteId) || a.clienteNome || ''; }
  function dataBR(d) { if (!d) return ''; const p = String(d).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : d; }
  function numNota() { return String(Math.max(1, Math.round(num(cfg().nota)) || 1)).padStart(4, '0'); }
  function linhasNota(a) { const r = calcAjuste(a); const rows = r.itens.map(i => ({ d: i.d, q: i.q, v: i.v })); if (r.urg > 0) rows.push({ d: 'Taxa de urgência', q: '', v: r.urg }); return { r, rows }; }
  function notaTexto(a) {
    const { r, rows } = linhasNota(a), c = cfg(), rec = a.tipo === 'Recibo', L = [];
    L.push('*Somnium Ateliê*', '*' + (a.tipo || 'Orçamento') + ' nº ' + numNota() + '* — ' + new Date().toLocaleDateString('pt-BR'));
    if (nomeAj(a)) L.push('Cliente: ' + nomeAj(a)); if (a.prazo && !rec) L.push('Entrega prevista: ' + dataBR(a.prazo)); L.push('');
    rows.forEach(i => L.push('• ' + i.d + (i.q !== '' && i.q !== 1 ? ' (' + i.q + 'x)' : '') + ' — ' + money(i.v))); if (r.abat > 0) L.push('• Desconto — -' + money(r.abat));
    L.push('', '*Total: ' + money(r.total) + '*' + (rec ? ' (pago)' : '')); if (!rec && String(c.pix || '').trim()) L.push('Pix: ' + String(c.pix).trim()); if (String(a.obs || '').trim()) L.push(String(a.obs).trim());
    L.push(rec ? 'Obrigada pela preferência!' : 'Orçamento válido por 7 dias.'); if (String(c.cont || '').trim()) L.push(String(c.cont).trim()); L.push('', 'Já nos segue nas redes sociais? 💜', 'https://instagram.com/somniumatelie'); return L.join('\n');
  }
  function carregarImg(src) { return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
  function quebrar(g, txt, larg) {
    const ps = String(txt).split(' '), ls = []; let at = '';
    ps.forEach(p => { const t = at ? at + ' ' + p : p; if (g.measureText(t).width > larg && at) { ls.push(at); at = p; } else at = t; }); if (at) ls.push(at); return ls;
  }
  function desenharNota(a) {
    const fontes = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('50px "Kaushan Script"'), document.fonts.load('22px "Jost"'), document.fonts.load('600 22px "Jost"')]).catch(() => { }) : Promise.resolve();
    return Promise.all([carregarImg('logo.png'), fontes]).then(x => {
      const logo = x[0], { r, rows } = linhasNota(a), c = cfg(), rec = a.tipo === 'Recibo', W = 720, esc = 2, ALT = 3200;
      const cv = document.createElement('canvas'); cv.width = W * esc; cv.height = ALT * esc; const g = cv.getContext('2d'); g.scale(esc, esc);
      const F = '"Jost", "Futura", "Avenir Next", system-ui, sans-serif', SC = '"Kaushan Script", "Brush Script MT", cursive';
      g.fillStyle = '#fbf8f2'; g.fillRect(0, 0, W, ALT); g.fillStyle = '#c9a66b'; g.fillRect(0, 0, W, 8);
      const px = 40, L = W - 80, R = px + L; let y = 44;
      if (logo) { g.save(); g.beginPath(); g.moveTo(px + 16, y); g.arcTo(px + 84, y, px + 84, y + 84, 16); g.arcTo(px + 84, y + 84, px, y + 84, 16); g.arcTo(px, y + 84, px, y, 16); g.arcTo(px, y, px + 84, y, 16); g.closePath(); g.clip(); g.drawImage(logo, px, y, 84, 84); g.restore(); }
      g.textBaseline = 'alphabetic'; g.fillStyle = '#2f2a35'; g.font = '50px ' + SC; g.fillText('Somnium', px + 104, y + 44); const wS = g.measureText('Somnium').width;
      g.fillStyle = '#6d6476'; g.font = '15px ' + F; try { g.letterSpacing = '4px'; } catch (e) { } const wA = g.measureText('ATELIÊ').width; g.fillText('ATELIÊ', px + 104 + wS - wA + 2, y + 64); try { g.letterSpacing = '0px'; } catch (e) { }
      g.font = '20px ' + F; g.fillText((a.tipo || 'Orçamento') + ' nº ' + numNota() + ' · ' + new Date().toLocaleDateString('pt-BR'), px + 104, y + 92); y += 84 + 28;
      const traco = (yy, cor) => { g.save(); g.setLineDash([6, 5]); g.strokeStyle = cor || '#cfc5b8'; g.lineWidth = 1; g.beginPath(); g.moveTo(px, yy); g.lineTo(R, yy); g.stroke(); g.restore(); };
      traco(y); y += 30;
      const par = (k, v) => { if (!v) return; g.fillStyle = '#6d6476'; g.font = '19px ' + F; g.fillText(k, px, y); g.fillStyle = '#2f2a35'; g.font = '21px ' + F; g.fillText(v, px + 130, y); y += 32; };
      par('Cliente', nomeAj(a).trim()); if (!rec) par('Entrega', dataBR(a.prazo)); if (nomeAj(a).trim() || (!rec && a.prazo)) y += 8;
      const qx = R - 150, wd = L - 210;
      g.fillStyle = '#6d6476'; g.font = '15px ' + F; g.fillText('DESCRIÇÃO', px, y); g.textAlign = 'center'; g.fillText('QTD.', qx, y); g.textAlign = 'right'; g.fillText('VALOR', R, y); g.textAlign = 'left';
      y += 12; g.save(); g.strokeStyle = '#cfc5b8'; g.beginPath(); g.moveTo(px, y); g.lineTo(R, y); g.stroke(); g.restore(); y += 30;
      const item = (desc, qtd, val) => {
        g.font = '22px ' + F; g.fillStyle = '#2f2a35'; const ls = quebrar(g, desc, wd), y0 = y;
        ls.forEach((t, i) => { g.textAlign = 'left'; g.fillText(t, px, y0 + i * 29); }); g.textAlign = 'center'; g.fillText(qtd, qx, y0); g.textAlign = 'right'; g.fillText(val, R, y0); g.textAlign = 'left';
        y += (ls.length - 1) * 29 + 16; traco(y, '#e0d7ca'); y += 28;
      };
      rows.forEach(i => item(i.d, i.q === '' ? '' : String(i.q), money(i.v))); if (r.abat > 0) item('Desconto', '', '-' + money(r.abat));
      y -= 4; g.save(); g.strokeStyle = '#2f2a35'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(px, y); g.lineTo(R, y); g.stroke(); g.restore(); y += 40;
      g.fillStyle = '#2f2a35'; g.font = '600 30px ' + F; g.fillText('Total' + (rec ? ' (pago)' : ''), px, y); g.textAlign = 'right'; g.fillText(money(r.total), R, y); g.textAlign = 'left'; y += 44;
      const rod = []; if (!rec && String(c.pix || '').trim()) rod.push('Pix: ' + String(c.pix).trim()); if (String(a.obs || '').trim()) rod.push(String(a.obs).trim());
      rod.push(rec ? 'Obrigada pela preferência!' : 'Orçamento válido por 7 dias.'); if (String(c.cont || '').trim()) rod.push(String(c.cont).trim());
      g.fillStyle = '#6d6476'; g.font = '19px ' + F; rod.forEach(t => { quebrar(g, t, L).forEach(ln => { g.fillText(ln, px, y); y += 27; }); }); y += 14;
      g.save(); g.fillStyle = '#f3ead9'; g.strokeStyle = '#c9a66b'; g.lineWidth = 1.2; const bx = px, bw = L, bh = 92, rr = 14; g.beginPath(); g.moveTo(bx + rr, y); g.arcTo(bx + bw, y, bx + bw, y + bh, rr); g.arcTo(bx + bw, y + bh, bx, y + bh, rr); g.arcTo(bx, y + bh, bx, y, rr); g.arcTo(bx, y, bx + bw, y, rr); g.closePath(); g.fill(); g.stroke(); g.restore();
      g.textAlign = 'center'; g.fillStyle = '#2f2a35'; g.font = '600 21px ' + F; g.fillText('Já nos segue nas redes sociais?', W / 2, y + 38); g.fillStyle = '#7a4fa3'; g.font = '600 22px ' + F; g.fillText('instagram.com/somniumatelie', W / 2, y + 70); g.textAlign = 'left'; y += bh + 36;
      const out = document.createElement('canvas'); out.width = W * esc; out.height = Math.ceil(y * esc); out.getContext('2d').drawImage(cv, 0, 0, W * esc, y * esc, 0, 0, W * esc, y * esc); return out;
    });
  }
  async function proximaNota() { const c = Object.assign({}, cfg(), { nota: (Math.round(num(cfg().nota)) || 1) + 1 }); S.cfg = c; await store.save('config', 'main', c); }
  async function notaFoto(a) {
    toast('Gerando a foto…'); const cv = await desenharNota(a);
    const blob = await new Promise(ok => cv.toBlob(ok, 'image/png')); if (!blob) return toast('Não consegui gerar a foto');
    const nome = 'Nota_Somnium_' + numNota() + '.png'; let f = null; try { f = new File([blob], nome, { type: 'image/png' }); } catch (e) { }
    if (f && navigator.canShare && navigator.canShare({ files: [f] })) {
      try { await navigator.share({ files: [f], title: (a.tipo || 'Orçamento') + ' — Somnium Ateliê', text: 'Já nos segue nas redes sociais? 💜\nhttps://instagram.com/somniumatelie' }); await proximaNota(); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const u = URL.createObjectURL(blob), el = document.createElement('a'); el.href = u; el.download = nome; document.body.appendChild(el); el.click(); setTimeout(() => { URL.revokeObjectURL(u); el.remove(); }, 800); toast('Foto salva. Envie pelo WhatsApp'); await proximaNota();
  }
  function vFormNotaPeca() {
    const d = S.draft, r = calcAjuste(d);
    return tela(topo('Peças') + '<div class="tit">Notinha da peça</div><p class="mut sm">' + esc(d.nome) + '</p>' +
      sel('Cliente', 'clienteId', [['', '— escolher ou digitar abaixo —']].concat(S.clientes.slice().sort((x, y) => x.nome.localeCompare(y.nome)).map(c => [c.id, c.nome]))) + inp('Ou nome sem ficha', 'clienteNome') +
      '<div class="lb">Documento</div><div class="chips wrap">' + ['Orçamento', 'Recibo'].map(t => chip(t, d.tipo === t, 'set', 'tipo', t)).join('') + '</div>' +
      '<div class="duo2">' + inp('Quantidade', 'qtd', { mode: 'decimal' }) + inp('Valor de cada (R$)', 'vu', { mode: 'decimal' }) + '</div>' + inp('Desconto (R$)', 'abat', { mode: 'decimal' }) + inp('Prazo de entrega (opcional)', 'prazo', { type: 'date' }) + inp('Observações', 'obs', { area: true }) +
      '<div class="sec2">Resumo</div><div class="calc" id="calc">' + calcAjHtml(r) + '</div><p class="mut sm">Documento nº ' + numNota() + '. O número avança depois que você compartilha a foto.</p><div class="duo"><button class="btn sec" data-act="aj-copiar">Copiar texto</button><button class="btn sec" data-act="aj-foto">Compartilhar foto</button></div><div class="barra"><button class="btn" data-act="nota-venda">Registrar venda</button></div>');
  }

  // ---------- card da peça ----------
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function desenharCard(d) {
    const fontes = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('50px "Kaushan Script"'), document.fonts.load('22px "Jost"'), document.fonts.load('600 22px "Jost"')]).catch(() => { }) : Promise.resolve();
    const idx = (Array.isArray(d.usar) ? d.usar : (d.fotos || []).map((f, i) => i)).filter(i => (d.fotos || [])[i]).slice(0, 4);
    return Promise.all([carregarImg('logo.png'), Promise.all(idx.map(i => carregarImg(d.fotos[i]))), fontes]).then(x => {
      const logo = x[0], ims = x[1].filter(Boolean), W = 1080, TH = 5200;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = TH; const c = cv.getContext('2d');
      const F = '"Jost", "Futura", "Avenir Next", system-ui, sans-serif', SC = '"Kaushan Script", "Brush Script MT", cursive';
      c.fillStyle = '#fbf8f2'; c.fillRect(0, 0, W, TH); c.fillStyle = '#c9a66b'; c.fillRect(0, 0, W, 12);
      const px = 60, pw = W - 120, gap = 16, cl = (v, a, b) => Math.max(a, Math.min(b, v));
      const tile = (im, x0, y0, w, h) => {
        c.save(); rr(c, x0, y0, w, h, 28); c.clip(); c.fillStyle = '#f1ebe0'; c.fillRect(x0, y0, w, h);
        if (im) { const k = Math.min(w / im.width, h / im.height), iw = im.width * k, ih = im.height * k; c.drawImage(im, x0 + (w - iw) / 2, y0 + (h - ih) / 2, iw, ih); }
        else if (logo) c.drawImage(logo, x0 + w / 2 - 130, y0 + h / 2 - 130, 260, 260);
        c.restore(); c.save(); rr(c, x0, y0, w, h, 28); c.lineWidth = 2; c.strokeStyle = '#e0d7ca'; c.stroke(); c.restore();
      };
      let y = 56; const asp = im => im.height / im.width;
      if (ims.length <= 1) { const h = ims[0] ? cl(pw * asp(ims[0]), 600, 1200) : 640; tile(ims[0], px, y, pw, h); y += h; }
      else if (ims.length === 2) { const w = (pw - gap) / 2, h = cl(w * Math.max(asp(ims[0]), asp(ims[1])), 440, 800); tile(ims[0], px, y, w, h); tile(ims[1], px + w + gap, y, w, h); y += h; }
      else { const h = cl(pw * asp(ims[0]), 560, 1000); tile(ims[0], px, y, pw, h); y += h + gap; const r = ims.slice(1), n = r.length, w = (pw - gap * (n - 1)) / n, h2 = cl(w * Math.max.apply(null, r.map(asp)), w * .9, w * 1.4); r.forEach((im, i) => tile(im, px + i * (w + gap), y, w, h2)); y += h2; }
      const col = String(d.colecao || '').trim();
      if (col) { c.font = '600 26px ' + F; const tw = c.measureText(col).width + 44; c.save(); c.fillStyle = 'rgba(58,53,65,.88)'; rr(c, px + 24, 56 + 24, tw, 52, 26); c.fill(); c.restore(); c.fillStyle = '#e9d3a6'; c.textBaseline = 'middle'; c.fillText(col, px + 46, 56 + 51); c.textBaseline = 'alphabetic'; }
      y += 74; c.fillStyle = '#2f2a35'; c.font = '600 52px ' + F;
      quebrar(c, d.nome || 'Peça', pw).forEach(t => { c.fillText(t, px, y); y += 60; });
      y -= 60;
      if (d.mostrar !== false && d.preco > 0) {
        const pv = money(d.preco); c.font = '600 40px ' + F; const wp = c.measureText(pv).width + 64, bh = 78, by = y + 26;
        c.fillStyle = '#3a3541'; rr(c, px, by, wp, bh, 39); c.fill(); c.fillStyle = '#e9d3a6'; c.textBaseline = 'middle'; c.fillText(pv, px + 32, by + bh / 2 + 2); c.textBaseline = 'alphabetic'; y = by + bh;
      }
      const tx = String(d.texto || '').trim();
      if (tx) { y += 20; c.fillStyle = '#5b5263'; c.font = '29px ' + F; tx.split(/\n/).forEach(p => { if (!p.trim()) { y += 18; return; } quebrar(c, p, pw).forEach(t => { y += 40; c.fillText(t, px, y); }); }); y += 10; }
      y += 48; c.save(); c.setLineDash([6, 5]); c.strokeStyle = '#cfc5b8'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px, y); c.lineTo(px + pw, y); c.stroke(); c.restore(); y += 62;
      if (logo) { c.save(); rr(c, px, y - 34, 56, 56, 12); c.clip(); c.drawImage(logo, px, y - 34, 56, 56); c.restore(); }
      c.fillStyle = '#2f2a35'; c.font = '38px ' + SC; c.fillText('Somnium', px + 74, y + 4); const ws = c.measureText('Somnium').width;
      c.fillStyle = '#6d6476'; c.font = '14px ' + F; try { c.letterSpacing = '3px'; } catch (e) { } c.fillText('ATELIÊ', px + 74 + ws + 12, y + 4); try { c.letterSpacing = '0px'; } catch (e) { }
      c.textAlign = 'right'; c.fillStyle = '#7a4fa3'; c.font = '600 28px ' + F; c.fillText('@somniumatelie', px + pw, y + 2); c.textAlign = 'left'; y += 56;
      const out = document.createElement('canvas'); out.width = W; out.height = Math.ceil(y); out.getContext('2d').drawImage(cv, 0, 0, W, y, 0, 0, W, y); return out;
    });
  }
  function desenharTabela() {
    const fontes = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('50px "Kaushan Script"'), document.fonts.load('22px "Jost"'), document.fonts.load('600 22px "Jost"')]).catch(() => { }) : Promise.resolve();
    return Promise.all([carregarImg('logo.png'), fontes]).then(x => {
      const logo = x[0], c0 = cfg(), tab = (c0.tab || []).filter(t => String(t.n || '').trim()), W = 720, esc = 2, ALT = 4200;
      const cv = document.createElement('canvas'); cv.width = W * esc; cv.height = ALT * esc; const g = cv.getContext('2d'); g.scale(esc, esc);
      const F = '"Jost", "Futura", "Avenir Next", system-ui, sans-serif', SC = '"Kaushan Script", "Brush Script MT", cursive';
      g.fillStyle = '#fbf8f2'; g.fillRect(0, 0, W, ALT); g.fillStyle = '#c9a66b'; g.fillRect(0, 0, W, 8);
      const px = 40, L = W - 80, R = px + L; let y = 44;
      if (logo) { g.save(); rr(g, px, y, 84, 84, 16); g.clip(); g.drawImage(logo, px, y, 84, 84); g.restore(); }
      g.textBaseline = 'alphabetic'; g.fillStyle = '#2f2a35'; g.font = '50px ' + SC; g.fillText('Somnium', px + 104, y + 44); const wS = g.measureText('Somnium').width;
      g.fillStyle = '#6d6476'; g.font = '15px ' + F; try { g.letterSpacing = '4px'; } catch (e) { } const wA = g.measureText('ATELIÊ').width; g.fillText('ATELIÊ', px + 104 + wS - wA + 2, y + 64); try { g.letterSpacing = '0px'; } catch (e) { }
      g.font = '20px ' + F; g.fillText('Tabela de ajustes de roupa', px + 104, y + 92); y += 84 + 28;
      const traco = (yy, cor) => { g.save(); g.setLineDash([6, 5]); g.strokeStyle = cor || '#cfc5b8'; g.lineWidth = 1; g.beginPath(); g.moveTo(px, yy); g.lineTo(R, yy); g.stroke(); g.restore(); };
      traco(y); y += 30;
      g.fillStyle = '#6d6476'; g.font = '15px ' + F; g.fillText('AJUSTE', px, y); g.textAlign = 'right'; g.fillText('VALOR', R, y); g.textAlign = 'left';
      y += 12; g.save(); g.strokeStyle = '#cfc5b8'; g.beginPath(); g.moveTo(px, y); g.lineTo(R, y); g.stroke(); g.restore(); y += 32;
      tab.forEach(t => {
        g.font = '22px ' + F; g.fillStyle = '#2f2a35'; const v = money(num(t.v)), wv = g.measureText(v).width, ls = quebrar(g, t.n, L - wv - 30);
        ls.forEach((l, i) => g.fillText(l, px, y + i * 29)); g.textAlign = 'right'; g.fillText(v, R, y); g.textAlign = 'left';
        y += (ls.length - 1) * 29 + 16; traco(y, '#e0d7ca'); y += 31;
      });
      y -= 6; g.save(); g.strokeStyle = '#2f2a35'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(px, y); g.lineTo(R, y); g.stroke(); g.restore(); y += 40;
      g.fillStyle = '#6d6476'; g.font = '19px ' + F; g.fillText('Peças que não estão na tabela: solicite um orçamento.', px, y); y += 27; if (String(c0.cont || '').trim()) { g.fillText(String(c0.cont).trim(), px, y); y += 27; } y += 14;
      g.save(); g.fillStyle = '#f3ead9'; g.strokeStyle = '#c9a66b'; g.lineWidth = 1.2; rr(g, px, y, L, 92, 14); g.fill(); g.stroke(); g.restore();
      g.textAlign = 'center'; g.fillStyle = '#2f2a35'; g.font = '600 21px ' + F; g.fillText('Já nos segue nas redes sociais?', W / 2, y + 38); g.fillStyle = '#7a4fa3'; g.font = '600 22px ' + F; g.fillText('instagram.com/somniumatelie', W / 2, y + 70); g.textAlign = 'left'; y += 92 + 36;
      const out = document.createElement('canvas'); out.width = W * esc; out.height = Math.ceil(y * esc); out.getContext('2d').drawImage(cv, 0, 0, W * esc, y * esc, 0, 0, W * esc, y * esc); return out;
    });
  }
  async function tabelaFoto() {
    toast('Gerando a tabela…'); const cv = await desenharTabela(); const blob = await new Promise(ok => cv.toBlob(ok, 'image/png')); if (!blob) return toast('Não consegui gerar a tabela');
    const nome = 'Tabela_Ajustes_Somnium.png'; let f = null; try { f = new File([blob], nome, { type: 'image/png' }); } catch (e) { }
    if (f && navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: 'Tabela de ajustes — Somnium Ateliê', text: 'Já nos segue nas redes sociais? 💜\nhttps://instagram.com/somniumatelie' }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    const u = URL.createObjectURL(blob), el = document.createElement('a'); el.href = u; el.download = nome; document.body.appendChild(el); el.click(); setTimeout(() => { URL.revokeObjectURL(u); el.remove(); }, 800); toast('Tabela salva. Envie pelo WhatsApp');
  }
  function vFormTabela() {
    return tela(topo('Ajustes', 'ajustes') + '<div class="tit">Tabela de valores</div><p class="mut sm">Card com os ajustes e valores da sua tabela. Para mudar itens ou preços: Mais → Ajustes do app → Tabela de valores dos ajustes.</p>' +
      '<img id="cardprev" alt="Prévia da tabela" style="width:100%;border-radius:16px;border:1px solid #e0d7ca;display:block;margin:8px 0 12px;background:#fbf8f2;min-height:200px"><div class="barra"><button class="btn" data-act="tabela-share">Compartilhar / baixar tabela</button></div>');
  }
  let cardTk = 0;
  function atualizarCard() {
    const el = $('#cardprev'); if (!el || !S.draft || (S.sub !== 'cardpeca' && S.sub !== 'tabcard')) return; const tk = ++cardTk;
    (S.sub === 'tabcard' ? desenharTabela() : desenharCard(S.draft)).then(cv => { if (tk !== cardTk) return; const e2 = $('#cardprev'); if (e2) e2.src = cv.toDataURL('image/jpeg', .92); });
  }
  async function cardFoto(d) {
    toast('Gerando o card…'); const cv = await desenharCard(d); const blob = await new Promise(ok => cv.toBlob(ok, 'image/jpeg', .93)); if (!blob) return toast('Não consegui gerar o card');
    const nome = 'Card_' + String(d.nome || 'peca').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') + '.jpg'; let f = null; try { f = new File([blob], nome, { type: 'image/jpeg' }); } catch (e) { }
    const txt = (d.nome || 'Peça') + (d.mostrar !== false && d.preco > 0 ? ' — ' + money(d.preco) : '') + '\nSomnium Ateliê · https://instagram.com/somniumatelie';
    if (f && navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: d.nome || 'Peça', text: txt }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    const u = URL.createObjectURL(blob), el = document.createElement('a'); el.href = u; el.download = nome; document.body.appendChild(el); el.click(); setTimeout(() => { URL.revokeObjectURL(u); el.remove(); }, 800); toast('Card salvo. Envie pelo WhatsApp');
  }
  function vFormCardPeca() {
    const d = S.draft, fs = d.fotos || [];
    return tela(topo('Peças') + '<div class="tit">Card da peça</div><p class="mut sm">Imagem pronta para enviar a quem perguntar sobre a peça.</p>' +
      '<img id="cardprev" alt="Prévia do card" style="width:100%;border-radius:16px;border:1px solid #e0d7ca;display:block;margin:8px 0 12px;background:#fbf8f2;min-height:200px">' +
      (fs.length > 1 ? '<div class="lb">Fotos no card (toque para incluir ou tirar; a primeira escolhida fica maior)</div><div class="fotos">' + fs.map((f, i) => { const k = (d.usar || []).indexOf(i); return '<button type="button" class="ft" data-act="card-foto" data-v="' + i + '" aria-label="Foto ' + (i + 1) + '"><img src="' + f + '" alt="" style="' + (k >= 0 ? 'outline:3px solid #c9a66b;outline-offset:2px' : 'opacity:.45') + '">' + (k >= 0 ? '<span style="position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:12px;background:#3a3541;color:#e9d3a6;font:600 13px/24px sans-serif;text-align:center">' + (k + 1) + '</span>' : '') + '</button>'; }).join('') + '</div>' : '') +
      '<div class="lb">Valor no card</div><div class="chips wrap">' + chip('Mostrar valor', d.mostrar !== false, 'card-valor', '', '1') + chip('Sem valor', d.mostrar === false, 'card-valor', '', '0') + '</div>' +
      inp('Texto (opcional)', 'texto', { area: true, ph: 'Ex.: Feita à mão em georgette, tamanho único' }) +
      '<div class="barra"><button class="btn" data-act="card-share">Compartilhar / baixar card</button></div>');
  }
  function vAjustes() {
    const lista = S.ajustes.slice().sort((x, y) => (x.prazo || '9999').localeCompare(y.prazo || '9999'));
    const cor = s => s === 'Entregue' ? 'ok' : s === 'Pronto' ? 'gold' : 'lil';
    return tela(topo('Mais', 'mais') + head('Ajustes de roupa', S.ajustes.length + (S.ajustes.length === 1 ? ' ajuste' : ' ajustes')) + '<button class="btn sec" data-act="tabela-card" style="width:100%;flex:none;margin:4px 0 10px">Tabela de valores (card para compartilhar)</button>' + '<div class="lista">' + (lista.length ? lista.map(a => { const r = calcAjuste(a); return '<button class="card" data-act="editar" data-v="ajustes:' + a.id + '"><div class="l1"><b>' + esc(nomeAj(a) || 'Sem nome') + '</b><b>' + money(r.total) + '</b></div><div class="l1"><span class="mut">' + esc(r.itens.map(i => i.d.split(' (')[0]).slice(0, 2).join(', ')) + (r.itens.length > 2 ? '…' : '') + (a.prazo ? ' · ' + fmtData(a.prazo) : '') + '</span><span class="pill ' + cor(a.status) + '">' + esc(a.status || 'Aguardando') + '</span></div></button>'; }).join('') : '<p class="vazio">Nenhum ajuste ainda. Toque em “Novo ajuste”.</p>') + '</div>' + fab('Novo ajuste', 'novo-ajustes'));
  }
  function vFormAjuste() {
    const d = S.draft; const r = calcAjuste(d);
    const servs = d.servs.map((x, i) => '<div class="mat"><div class="mh"><input class="in" data-f="servs.' + i + '.nome" placeholder="Serviço" value="' + esc(x.nome) + '"><button class="x" data-act="aj-del" data-v="' + i + '" aria-label="Remover serviço">' + svg('x', 18) + '</button></div><input class="in sm2" data-f="servs.' + i + '.det" placeholder="Detalhe (ex.: calça de jiu jitsu)" value="' + esc(x.det) + '"><div class="tri2 q4"><label>Quantidade<input class="in" inputmode="decimal" data-f="servs.' + i + '.qtd" value="' + esc(x.qtd) + '"></label><label>Minutos cada<input class="in" inputmode="decimal" data-f="servs.' + i + '.min" value="' + esc(x.min) + '"></label><label>Valor cada (R$)<input class="in" inputmode="decimal" data-f="servs.' + i + '.vu" value="' + esc(x.vu) + '"></label><label>Material (R$)<input class="in" inputmode="decimal" data-f="servs.' + i + '.mat" value="' + esc(x.mat) + '"></label></div></div>').join('');
    return tela(topo('Ajustes', 'ajustes') + '<div class="tit">' + (d.id ? 'Ajuste de roupa' : 'Novo ajuste') + '</div>' +
      sel('Cliente', 'clienteId', [['', '— escolher ou digitar abaixo —']].concat(S.clientes.slice().sort((x, y) => x.nome.localeCompare(y.nome)).map(c => [c.id, c.nome]))) + inp('Ou nome sem ficha', 'clienteNome') + inp('Prazo', 'prazo', { type: 'date' }) +
      '<div class="lb">Documento</div><div class="chips wrap">' + ['Orçamento', 'Recibo'].map(t => chip(t, d.tipo === t, 'set', 'tipo', t)).join('') + '</div><div class="lb">Situação</div><div class="chips wrap">' + ['Aguardando', 'Pronto', 'Entregue'].map(t => chip(t, d.status === t, 'set', 'status', t)).join('') + '</div>' +
      '<div class="rowh"><span class="sec2">Serviços</span><span class="lk"><button data-act="aj-add">+ serviço</button></span></div>' + (servs || '<p class="vazio">Toque em “+ serviço” e escolha na tabela.</p>') +
      '<label class="sw"><span><b>Urgente</b><small>soma a taxa de urgência de ' + cfg().urg + '%</small></span><input type="checkbox" data-f="urgente"' + (d.urgente ? ' checked' : '') + '></label>' + inp('Desconto (R$)', 'abat', { mode: 'decimal' }) + inp('Observações', 'obs', { area: true }) +
      '<div class="sec2">Resumo</div><div class="calc" id="calc">' + calcAjHtml(r) + '</div><p class="mut sm">Documento nº ' + numNota() + '. O número avança depois que você compartilha a foto.</p><div class="duo"><button class="btn sec" data-act="aj-copiar">Copiar texto</button><button class="btn sec" data-act="aj-foto">Compartilhar foto</button></div>' + barra(d.id ? 'excluir' : '', 'ajustes'));
  }
  function escolherServico() {
    const tab = cfg().tab; const m = document.createElement('div'); m.className = 'modal'; m.id = 'modal';
    m.innerHTML = '<div class="mc"><div class="rowh"><b>Escolher serviço</b><button class="x" data-act="modal-x" aria-label="Fechar">' + svg('x') + '</button></div>' + tab.map((t, i) => '<button class="card row" data-act="aj-pick" data-v="' + i + '"><span class="tt"><b>' + esc(t.n) + '</b><small>' + esc(t.m) + ' min · ' + money(num(t.v)) + '</small></span></button>').join('') + '<button class="card row" data-act="aj-pick" data-v="-1"><span class="tt"><b>Outro serviço</b><small>preencher à mão</small></span></button></div>';
    document.body.appendChild(m);
  }

  // ---------- desenho ----------
  function render() {
    if (!S.user) { vLogin(); return; }
    if (!S.cfg && !S.ready.cfg) { app.innerHTML = '<div class="login"><p class="sub">Abrindo…</p></div>'; return; }
    let h = '';
    if (S.draft) {
      const m = { tabcard: vFormTabela, notapeca: vFormNotaPeca, cardpeca: vFormCardPeca, ajustes: vFormAjuste, pedidos: vFormPedido, agenda: vFormAgenda, clientes: vFormCliente, pecas: vFormPeca, insumos: vFormInsumo, vendas: vFormVenda, config: vConfig }; h = m[S.sub]();
    } else h = ({ inicio: vInicio, pedidos: vPedidos, agenda: vAgenda, pecas: vPecas, ajustes: vAjustes, mais: vMais, clientes: vClientes, insumos: vInsumos, vendas: vVendas }[S.view] || vInicio)();
    const y = window.scrollY; app.innerHTML = h; if (S.keepScroll) window.scrollTo(0, y);
    if (Date.now() < (S.toastAte || 0)) { const tz = $('#toast'); if (tz) { tz.textContent = S.toastTxt; tz.classList.add('on'); } }
    if (S.draft && (S.sub === 'cardpeca' || S.sub === 'tabcard')) atualizarCard();
    const b = $('#busca'); if (b) b.addEventListener('input', e => { S.busca = e.target.value; const pos = e.target.selectionStart; render(); const nb = $('#busca'); nb.focus(); try { nb.setSelectionRange(pos, pos); } catch (x) { } });
  }
  function rerender(keep) { S.keepScroll = !!keep; render(); S.keepScroll = false; }

  // ---------- rascunhos ----------
  function novoRascunho(col, extra) {
    const base = {
      pedidos: { titulo: '', clienteId: '', prazo: '', valor: '', status: 'Aguardando', obs: '' },
      agenda: { titulo: '', data: S.dia, hora: '', obs: '' },
      clientes: { nome: '', whats: '', insta: '', med: {}, medData: '', obs: '' },
      pecas: { nome: '', colecao: 'Coleção Initium', tipo: 'Corda', mats: [], horas: '', emb: '', margem: '', preco: '', vitrine: true, texto: '', fotos: [], maq: { agulha: '', tensao: '', ponto: '', comp: '', larg: '', obs: '' } },
      insumos: { nome: '', fornecedor: '', categoria: '', data: iso(new Date()), qtd: '1', un: '', preco: '' },
      ajustes: { clienteId: '', clienteNome: '', prazo: '', tipo: 'Orçamento', status: 'Aguardando', urgente: false, abat: '', obs: '', servs: [] },
      vendas: { descricao: '', clienteId: '', data: iso(new Date()), valor: '', custo: '' },
      config: clone(cfg())
    }[col];
    return Object.assign(base, extra || {});
  }
  function abrir(col, d) { if (S.draft && S.sub) (S.pilha = S.pilha || []).push({ sub: S.sub, draft: S.draft }); S.sub = col; S.draft = d; rerender(); window.scrollTo(0, 0); }
  function fechar() { S.draft = null; S.sub = null; S.pilha = []; rerender(); }
  const TOPO = ['inicio', 'pedidos', 'agenda', 'pecas', 'mais'];
  function voltar() {
    if ($('#modal')) { fecharModal(); return true; }
    if (S.draft) { const p = (S.pilha || []).pop(); if (p) { S.sub = p.sub; S.draft = p.draft; rerender(); } else fechar(); window.scrollTo(0, 0); return true; }
    if (S.view && S.view !== 'inicio') { S.view = (S.pilhaV || []).pop() || 'inicio'; rerender(); window.scrollTo(0, 0); return true; }
    return false;
  }
  function lerTudo() { document.querySelectorAll('[data-f]').forEach(el => { if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') setDraft(el); }); }
  function setDraft(el) {
    const v = el.type === 'checkbox' ? el.checked : el.value; const path = el.dataset.f;
    if (!S.draft || !path) return; setP(S.draft, path, v);
    if (S.sub === 'pecas') { const c = $('#calc'); if (c) c.innerHTML = calcHtml(calcPeca(S.draft), S.draft); }
    if (S.sub === 'cardpeca') { clearTimeout(S.cardT); S.cardT = setTimeout(atualizarCard, 350); }
    if (S.sub === 'notapeca') { const c = $('#calc'); if (c) c.innerHTML = calcAjHtml(calcAjuste(S.draft)); }
    if (S.sub === 'ajustes') { const c = $('#calc'); if (c) c.innerHTML = calcAjHtml(calcAjuste(S.draft)); }
    if (S.sub === 'insumos') { const p = $('#pu'); if (p) p.textContent = 'Preço por unidade: ' + money(numRaw(S.draft.qtd) > 0 ? numRaw(S.draft.preco) / numRaw(S.draft.qtd) : 0); }
  }

  // ---------- salvar por coleção ----------
  async function gravar(col) {
    lerTudo(); const d = clone(S.draft);
    if (col === 'config') { ['hora', 'ind', 'margem', 'taxa', 'urg'].forEach(k => d[k] = num(d[k])); d.tab = (d.tab || []).filter(t => String(t.n || '').trim()); await store.save('config', 'main', d); S.cfg = d; fechar(); S.view = 'mais'; rerender(); toast('✓ Configurações salvas'); return; }
    if (col === 'pedidos') { if (!d.titulo.trim()) return toast('Escreva o que vai fazer'); const antes = d.id ? S.pedidos.find(p => p.id === d.id) : null; const id = await salvar(col, d); if (d.status === 'Entregue' && (!antes || antes.status !== 'Entregue') && num(d.valor) > 0 && !S.vendas.some(v => v.pedidoId === id) && confirm('Registrar esta entrega como venda de ' + money(num(d.valor)) + '?')) await salvar('vendas', { descricao: d.titulo, clienteId: d.clienteId || '', data: iso(new Date()), valor: d.valor, custo: '', pedidoId: id }); }
    else if (col === 'agenda') { if (!d.titulo.trim()) return toast('Escreva o que fazer'); await salvar(col, d); S.dia = d.data || S.dia; S.semana = 0; }
    else if (col === 'clientes') { if (!d.nome.trim()) return toast('Escreva o nome'); await salvar(col, d); }
    else if (col === 'pecas') {
      if (!d.nome.trim()) return toast('Escreva o nome da peça');
      d.mats = (d.mats || []).filter(m => (m.nome || '').trim()); const r = calcPeca(d); d.preco = String(d.preco).trim() === '' ? r.sug : numRaw(d.preco); await salvar(col, d);
    }
    else if (col === 'insumos') { if (!d.nome.trim()) return toast('Escreva o nome do material'); d.qtd = numRaw(d.qtd) || 1; d.preco = numRaw(d.preco); d.precoUn = d.preco / d.qtd; await salvar(col, d); }
    else if (col === 'ajustes') {
      d.servs = d.servs.filter(x => String(x.nome || '').trim()); if (!d.servs.length) return toast('Escolha ao menos um serviço');
      const antes = d.id ? S.ajustes.find(a => a.id === d.id) : null; const id = await salvar(col, d); const cc = calcAjuste(d);
      if (d.status === 'Entregue' && (!antes || antes.status !== 'Entregue') && cc.total > 0 && !S.vendas.some(v => v.ajusteId === id) && confirm('Registrar esta entrega como venda de ' + money(cc.total) + '?')) await salvar('vendas', { descricao: 'Ajuste de roupa', clienteId: d.clienteId || '', data: iso(new Date()), valor: cc.total, custo: Math.round(cc.custo * 100) / 100, ajusteId: id });
    }
    else if (col === 'vendas') { if (!d.descricao.trim()) return toast('Escreva o que foi vendido'); await salvar(col, d); }
    fechar(); toast('✓ Salvo');
  }

  // ---------- backup ----------
  function backup() {
    const out = { app: 'Painel Somnium Ateliê', tipo: 'backup', versao: 3, geradoEm: iso(new Date()), configuracoes: S.cfg || cfg() }; COLS.forEach(c => out[c] = S[c]);
    const blob = new Blob([JSON.stringify(out)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Backup_Somnium_' + iso(new Date()) + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); toast('Backup baixado');
  }
  async function importar(file) {
    const txt = await file.text(); let j; try { j = JSON.parse(txt); } catch (e) { return toast('Esse arquivo não parece um backup'); }
    const antigo = !!(j.pecas && j.pecas[0] && j.pecas[0].dados) || !!j.compras;
    let n = 0;
    if (antigo) {
      for (const p of (j.pecas || [])) {
        const pe = (p.dados && p.dados.peca) || {};
        let fotos = (Array.isArray(p.fotos) ? p.fotos : []).map(x => typeof x === 'string' ? x : (x && (x.u || x.r)) || '').filter(x => /^data:image|^https?:/.test(x)); if (!fotos.length && p.fotoData) fotos = [p.fotoData]; fotos = fotos.slice(0, 4);
        const mats = (pe.mats || []).map(m => ({ nome: m.nome, un: m.un, precoUn: numRaw(m.pack) > 0 ? numRaw(String(m.preco)) / numRaw(m.pack) : numRaw(String(m.preco)), uso: String(m.uso || '') }));
        const tipo = /corda|bolsa|porta|sousplaca/i.test((pe.cat || '') + (p.tipo || '')) ? 'Corda' : /roupa|blusa|camisa|cal[cç]a|vestido|colete/i.test((pe.cat || '') + (p.tipo || '')) ? 'Roupa' : 'Acessório';
        await salvar('pecas', { id: 'imp-' + (p.id || (p.dados && p.dados.id) || n), nome: p.nome, colecao: p.colecao || (pe.colecao) || 'Coleção Initium', tipo, mats, horas: pe.horas || '', emb: pe.emb || '', margem: '', preco: num(p.preco) || numRaw(p.preco), vitrine: !!p.vitrine, texto: p.texto || pe.texto || '', fotos, maq: { agulha: '', tensao: '', ponto: '', comp: '', larg: '', obs: '' }, criado: p.criado || Date.now() }); n++;
      }
      for (const c of (j.compras || [])) { const q = numRaw(c.qtd) || 1; await salvar('insumos', { id: 'imp-' + c.id, nome: c.material, fornecedor: c.fornecedor || '', categoria: c.categoria || '', data: c.data || '', qtd: q, un: c.un || '', preco: numRaw(c.preco) * 1, precoUn: numRaw(c.preco) / q, criado: c.criado || Date.now() }); n++; }
      for (const a of (j.ajustes_salvos || [])) { const dd = a.dados || {}, aj = dd.aj || {}, nt = dd.nota || {}; await salvar('ajustes', { id: 'imp-' + (dd.id || n), clienteId: '', clienteNome: nt.cliente || '', prazo: nt.prazo || '', tipo: nt.tipo || 'Orçamento', status: 'Aguardando', urgente: !!aj.urgente, abat: nt.abat || '', obs: nt.obs || '', servs: (aj.servs || []).map(x => ({ nome: x.nome, det: x.det || '', min: String(x.min || ''), qtd: String(x.qtd || '1'), vu: String(x.valor || ''), mat: String(x.mat || '') })), criado: a.criado || Date.now() }); n++; }
      for (const v of (j.vendas || [])) { await salvar('vendas', { id: 'imp-' + v.id, descricao: v.descricao || v.nome || 'Venda', data: v.data || '', valor: v.valor || v.total || 0, custo: v.custo || '', criado: v.criado || Date.now() }); n++; }
      const k = j.configuracoes; if (k) { const c = { hora: num(k.hora), ind: num(k.ind), margem: num(k.margem), taxa: num(k.taxa), arred: !!k.arred, urg: num(k.urg), pix: k.pix || '', cont: k.cont || '@somniumatelie', nota: Math.round(num(k.nota)) || 1, tab: (k.tab || []).map(t => ({ n: t.n, m: t.m, v: t.v })) }; await store.save('config', 'main', c); S.cfg = c; }
    } else {
      for (const col of COLS) for (const o of (j[col] || [])) { await salvar(col, o); n++; }
      if (j.configuracoes) { await store.save('config', 'main', j.configuracoes); S.cfg = j.configuracoes; }
    }
    toast(n + ' itens importados'); rerender();
  }

  // ---------- eventos ----------
  document.addEventListener('input', e => { const el = e.target; if (el.dataset && el.dataset.f && S.draft && el.type !== 'checkbox' && el.tagName !== 'SELECT') setDraft(el); });
  document.addEventListener('change', e => {
    const el = e.target; if (el.id === 'arq' && el.files) { addFotos(el.files); return; } if (el.id === 'arqbk' && el.files && el.files[0]) { guard(importar)(el.files[0]); el.value = ''; return; }
    if (el.dataset && el.dataset.f && S.draft) { setDraft(el); }
  });
  async function addFotos(files) {
    lerTudo(); toast('Preparando foto…');
    for (const f of Array.from(files)) { if ((S.draft.fotos || []).length >= 4) break; try { (S.draft.fotos = S.draft.fotos || []).push(await lerFoto(f)); } catch (e) { toast('Não consegui abrir essa foto'); } }
    rerender(true);
  }
  try { history.replaceState({ a: 0 }, ''); history.pushState({ a: 1 }, ''); } catch (e) { }
  window.addEventListener('popstate', () => {
    if (voltar()) { try { history.pushState({ a: 1 }, ''); } catch (e) { } return; }
    if (S.sairArm) { S.sairArm = false; history.back(); return; }
    S.sairArm = true; toast('Toque em voltar de novo para sair'); try { history.pushState({ a: 1 }, ''); } catch (e) { } setTimeout(() => { S.sairArm = false; }, 2500);
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, v = b.dataset.v;
    const fa = {
      entrar: async () => { try { S.msg = ''; await store.signIn(); } catch (x) { S.msg = 'Não consegui entrar. Tente de novo.'; const el = $('#err'); if (el) el.textContent = S.msg; } },
      sair: () => store.signOut(),
      ir: () => { if (!TOPO.includes(v) && S.view !== v) (S.pilhaV = S.pilhaV || []).push(S.view); else if (TOPO.includes(v)) S.pilhaV = []; S.draft = null; S.sub = null; S.pilha = []; S.view = v; window.scrollTo(0, 0); if (v === 'config') { abrir('config', novoRascunho('config')); return; } rerender(); },
      fechar: () => voltar(),
      filtro: () => { S.filtro = v; rerender(); },
      dia: () => { S.dia = v; S.semana = 0; rerender(true); },
      semana: () => { const d = parseIso(S.dia); d.setDate(d.getDate() + 7 * +v); S.dia = iso(d); S.semana = 0; rerender(true); },
      hoje: () => { S.dia = iso(new Date()); S.semana = 0; rerender(true); },
      set: () => { lerTudo(); setP(S.draft, b.dataset.f, v); rerender(true); },
      editar: () => { const p = v.split(':'); const o = S[p[0]].find(x => x.id === p[1]); if (o) { const d = clone(o); if (p[0] === 'pecas') { d.fotos = d.fotos || []; d.mats = d.mats || []; d.maq = d.maq || {}; } if (p[0] === 'clientes') d.med = d.med || {}; abrir(p[0], d); } },
      excluir: () => { if (confirm('Excluir de vez? Não dá para desfazer.')) guard(async () => { await store.remove(v, S.draft.id); toast('Excluído'); fechar(); })(); },
      salvar: () => { if (S.salvando) return; S.salvando = true; b.disabled = true; guard(gravar)(v).finally(() => { S.salvando = false; b.disabled = false; }); },
      feito: () => { const t = S.agenda.find(x => x.id === v); if (t) guard(salvar)('agenda', Object.assign({}, t, { feito: !t.feito })); },
      'mat-add': () => { lerTudo(); S.draft.mats.push({ nome: '', un: '', precoUn: '', uso: '' }); rerender(true); },
      'mat-del': () => { lerTudo(); S.draft.mats.splice(+v, 1); rerender(true); },
      'mat-insumo': () => escolherInsumo(),
      foto: () => { const f = $('#arq'); if (f) f.click(); },
      'foto-del': () => { lerTudo(); S.draft.fotos.splice(+v, 1); rerender(true); },
      'atualizar-precos': () => guard(atualizarPrecos)(),
      backup: () => backup(),
      restaurar: () => { const f = $('#arqbk'); if (f) f.click(); },
      'ins-pick': () => { const i = S.insumos.find(x => x.id === v); if (i) { lerTudo(); S.draft.mats.push({ nome: i.nome, un: i.un || '', precoUn: String(Math.round(i.precoUn * 10000) / 10000).replace('.', ','), uso: '' }); } fecharModal(); rerender(true); },
      'modal-x': () => fecharModal(),
      'nota-peca': () => { lerTudo(); const d = S.draft, r = calcPeca(d), pr = String(d.preco).trim() === '' ? r.sug : numRaw(d.preco); abrir('notapeca', { notaPeca: true, pecaId: d.id, nome: d.nome, clienteId: '', clienteNome: '', tipo: 'Recibo', qtd: '1', vu: String(pr).replace('.', ','), abat: '', prazo: '', obs: '', custoUn: Math.round(r.custo * 100) / 100 }); },
      'nota-venda': () => guard(async () => { lerTudo(); const d = S.draft, c = calcAjuste(d); if (!(c.total > 0)) return toast('Informe o valor'); if (!confirm('Registrar venda de ' + money(c.total) + '?')) return; await salvar('vendas', { descricao: d.nome + (numRaw(d.qtd) > 1 ? ' (' + d.qtd + 'x)' : ''), clienteId: d.clienteId || '', data: iso(new Date()), valor: c.total, custo: Math.round(c.custo * 100) / 100, pecaId: d.pecaId || '' }); toast('Venda registrada'); fechar(); })(),
      'tab-add': () => { lerTudo(); (S.draft.tab = S.draft.tab || []).push({ n: '', m: '', v: '' }); rerender(true); },
      'tab-del': () => { lerTudo(); S.draft.tab.splice(+v, 1); rerender(true); },
      'aj-add': () => escolherServico(),
      'aj-pick': () => { const t = cfg().tab[+v]; lerTudo(); S.draft.servs.push(t ? { nome: t.n, det: '', min: String(t.m), qtd: '1', vu: String(t.v), mat: '' } : { nome: '', det: '', min: '', qtd: '1', vu: '', mat: '' }); fecharModal(); rerender(true); },
      'aj-del': () => { lerTudo(); S.draft.servs.splice(+v, 1); rerender(true); },
      'aj-copiar': () => { lerTudo(); const t = notaTexto(S.draft); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Texto copiado'), () => toast('Não consegui copiar')); },
      'card-peca': () => { lerTudo(); const d = S.draft, r = calcPeca(d), pr = String(d.preco).trim() === '' ? r.sug : numRaw(d.preco); abrir('cardpeca', { pecaId: d.id, nome: d.nome, colecao: d.colecao, texto: d.texto || '', fotos: (d.fotos || []).slice(), usar: (d.fotos || []).map((f, i) => i).slice(0, 4), preco: pr, mostrar: true }); },
      'card-foto': () => { lerTudo(); const u = S.draft.usar || [], i = +v, k = u.indexOf(i); if (k >= 0) { if (u.length > 1) u.splice(k, 1); } else if (u.length < 4) u.push(i); S.draft.usar = u; rerender(true); },
      'tabela-card': () => abrir('tabcard', {}),
      'tabela-share': () => guard(tabelaFoto)(),
      'card-valor': () => { lerTudo(); S.draft.mostrar = v === '1'; rerender(true); },
      'card-share': () => { lerTudo(); guard(cardFoto)(S.draft); },
      'aj-foto': () => { lerTudo(); guard(notaFoto)(S.draft); },
      'toggle': () => { lerTudo(); setP(S.draft, b.dataset.f, !getP(S.draft, b.dataset.f)); rerender(true); }
    };
    if (a.indexOf('novo-') === 0) { const p = a.slice(5).split('-'); const col = p[0]; const extra = p[1] === 'hora' ? { hora: v } : null; if (col === 'agenda' && extra) { abrir('agenda', novoRascunho('agenda', extra)); } else abrir(col, novoRascunho(col)); return; }
    if (fa[a]) fa[a]();
  });
  function escolherInsumo() {
    const ult = ultimoPreco(); const itens = Object.keys(ult).map(k => ult[k]).sort((a, b) => a.nome.localeCompare(b.nome));
    const m = document.createElement('div'); m.className = 'modal'; m.id = 'modal';
    m.innerHTML = '<div class="mc"><div class="rowh"><b>Escolher insumo</b><button class="x" data-act="modal-x" aria-label="Fechar">' + svg('x') + '</button></div>' + (itens.length ? itens.map(i => '<button class="card row" data-act="ins-pick" data-v="' + i.id + '"><span class="tt"><b>' + esc(i.nome) + '</b><small>' + money(i.precoUn) + ' por ' + esc(i.un || 'unidade') + '</small></span></button>').join('') : '<p class="vazio">Cadastre compras em Insumos primeiro.</p>') + '</div>';
    document.body.appendChild(m);
  }
  function fecharModal() { const m = $('#modal'); if (m) m.remove(); }
  async function atualizarPrecos() {
    const ult = ultimoPreco(); let n = 0;
    for (const a of avisosPreco()) {
      const p = clone(a.peca); p.mats.forEach(m => { const i = ult[norm(m.nome)]; if (i && i.precoUn > 0) m.precoUn = i.precoUn; });
      p.preco = calcPeca(p).sug; await salvar('pecas', p); n++;
    }
    toast(n + (n === 1 ? ' preço atualizado' : ' preços atualizados'));
  }

  // ---------- início ----------
  let assinado = false;
  store.onAuth(user => {
    S.user = user ? { email: user.email, uid: user.uid } : null;
    if (!user) { render(); return; }
    if (assinado) { render(); return; } assinado = true;
    setTimeout(() => { if (!S.ready.cfg) { S.ready.cfg = true; if (!S.cfg) S.cfg = Object.assign({}, DEF_CFG); rerender(true); } }, 5000);
    const err = e => { console.error(e); S.msg = 'Sem permissão ou sem conexão.'; };
    COLS.forEach(c => store.subscribe(c, rows => { S[c] = rows; S.ready[c] = true; if (!S.draft && !$('#modal')) rerender(true); }, err));
    store.subscribe('config', rows => { const m = rows.find(r => r.id === 'main'); S.cfg = m || null; S.ready.cfg = true; if (!m) S.cfg = Object.assign({}, DEF_CFG); if (!S.draft) rerender(true); }, err);
    render();
  });
  render();
  return { S, calcPeca, avisosPreco, importar, render, desenharNota, desenharCard, desenharTabela, calcAjuste };
}
