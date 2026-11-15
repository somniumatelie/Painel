// Painel Somnium Ateliê: telas e regras. Recebe um "store" (Firebase ou de teste).
export function boot(store) {
  'use strict';
  const COLS = ['pecas', 'pedidos', 'clientes', 'insumos', 'vendas', 'agenda', 'ajustes'];
  const S = { user: null, cfg: null, view: 'inicio', sub: null, draft: null, filtro: 'Todos', busca: '', dia: iso(new Date()), semana: 0, msg: '', ready: {} };
  COLS.forEach(c => S[c] = []);
  const DEF_TAB = [{"m": 30, "n": "Barra de calça", "v": "20"}, {"m": 35, "n": "Barra italiana", "v": "25"}, {"m": 20, "n": "Barra de malha", "v": "15"}, {"m": 30, "n": "Ajuste de blusa", "v": "20"}, {"m": 35, "n": "Ajuste de blusa com manga", "v": "25"}, {"m": 30, "n": "Ajuste de cintura", "v": "15"}, {"m": 30, "n": "Ajuste de pernas", "v": "15"}, {"m": 40, "n": "Ajuste de vestido de festa", "v": "25"}, {"m": 45, "n": "Ajuste de blazer", "v": "30"}, {"m": 25, "n": "Encurtar blusa ou vestido", "v": "15"}, {"m": 40, "n": "Encurtar manga de camisa", "v": "25"}, {"m": 20, "n": "Encurtar manga de malha", "v": "15"}, {"m": 20, "n": "Encurtar alça", "v": "15"}, {"m": 30, "n": "Zíper de calça ou saia", "v": "15"}, {"m": 35, "n": "Zíper de vestido", "v": "20"}, {"m": 40, "n": "Zíper de jaqueta", "v": "20"}, {"m": 5, "n": "Botão ou casa", "v": "2"}, {"m": 15, "n": "Cerzido", "v": "10"}, {"m": 40, "n": "Colarinho", "v": "25"}];
  const DEF_CFG = { hora: 30, ind: 5, margem: 50, taxa: 0, arred: true, urg: 30, pix: '', cont: '@somniumatelie', tab: DEF_TAB };
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
    await store.save(col, id, o); return id;
  }
  function toast(t) { S.msg = t; const el = $('#toast'); if (el) { el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2600); } }
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
    return tela('<img class="marca" src="marca.png" alt="" aria-hidden="true"><div class="hd rel"><span class="sub">' + esc(dt) + '</span><span class="tit big">Olá, Keila</span></div><div class="frase rel">De rascunhos no caderno à linha na agulha</div>' +
      '<div class="grid rel">' + t('pedidos', 'Pedidos', 'Prazos e situação') + t('agenda', 'Agenda', 'Provas e entregas') + t('clientes', 'Clientes', 'Medidas e fichas') + t('pecas', 'Peças', 'Coleções e preços') + t('ajustes', 'Ajustes', 'Barras e consertos') + t('insumos', 'Insumos', 'Compras e preços') + t('vendas', 'Vendas', 'Números do mês') + t('config', 'Ajustes do app', 'Hora, margem, backup') + '</div>' +
      (av ? '<button class="aviso rel" data-act="ir" data-v="insumos">' + svg('alerta', 18, '#8C6B2E') + '<span>' + av + (av > 1 ? ' preços desatualizados' : ' preço desatualizado') + '</span></button>' : ''));
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
    return tela(topo('Peças') + '<div class="tit">' + (d.id ? esc(d.nome || 'Peça') : 'Nova peça') + '</div>' + fotos + inp('Nome', 'nome') +
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
    const c = cfg(), taxa = Math.min(num(c.taxa), 60) / 100; let mat = 0, mao = 0, ind = 0, bruto = 0, horas = 0; const itens = [];
    (a.servs || []).forEach(sv => {
      const q = Math.max(numRaw(sv.qtd), 0), hh = numRaw(sv.min) / 60 * q, lm = num(sv.mat) * q, lmao = hh * num(c.hora), lind = lm * num(c.ind) / 100, lc = lm + lmao + lind;
      const sug = lc > 0 ? Math.ceil(lc * (1 + num(c.margem) / 100) / (1 - taxa)) : 0;
      const v = String(sv.vu == null ? '' : sv.vu).trim() !== '' ? num(sv.vu) * q : sug;
      mat += lm; mao += lmao; ind += lind; horas += hh; bruto += v; itens.push({ d: (sv.nome || 'Serviço') + (String(sv.det || '').trim() ? ' (' + String(sv.det).trim() + ')' : ''), q, v, sug });
    });
    const urg = a.urgente && bruto > 0 ? bruto * num(c.urg) / 100 : 0; const abat = Math.min(Math.max(num(a.abat), 0), bruto + urg); const total = bruto + urg - abat; const custo = mat + mao + ind;
    return { itens, bruto, urg, abat, total, custo, mat, mao, ind, horas, lucro: total - total * taxa - custo };
  }
  function calcAjHtml(r) {
    const l = (x, y, b) => '<div class="cl' + (b ? ' bold' : '') + '"><span>' + x + '</span><span>' + y + '</span></div>';
    return r.itens.map(i => l(esc(i.d) + (i.q !== 1 ? ' ×' + i.q : ''), money(i.v))).join('') + (r.urg ? l('Taxa de urgência', money(r.urg)) : '') + (r.abat ? l('Desconto', '− ' + money(r.abat)) : '') + '<hr>' + l('Total', money(r.total), true) + l('Seu custo estimado', money(r.custo)) + l('Sobra para você', money(r.lucro));
  }
  function nomeAj(a) { return nomeCliente(a.clienteId) || a.clienteNome || ''; }
  function notaTexto(a) {
    const r = calcAjuste(a), c = cfg(); const L = [];
    L.push('Somnium Ateliê', (a.tipo || 'Orçamento') + (nomeAj(a) ? ' para ' + nomeAj(a) : ''), '');
    r.itens.forEach(i => L.push('• ' + i.d + (i.q !== 1 ? ' (' + i.q + 'x)' : '') + ': ' + money(i.v)));
    if (r.urg) L.push('• Taxa de urgência: ' + money(r.urg)); if (r.abat) L.push('• Desconto: − ' + money(r.abat));
    L.push('', 'Total: ' + money(r.total)); if (a.prazo) L.push('Prazo: ' + fmtData(a.prazo)); if (a.obs) L.push(a.obs);
    if (c.pix) L.push('Pix: ' + c.pix); if (c.cont) L.push(c.cont); return L.join('\n');
  }
  function notaFoto(a) {
    const r = calcAjuste(a), c = cfg(), W = 1080, pad = 70, lh = 56; const linhas = r.itens.length + (r.urg ? 1 : 0) + (r.abat ? 1 : 0);
    const H = 520 + linhas * lh + 260; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = '#FBF8F2'; g.fillRect(0, 0, W, H);
    const fim = () => {
      let y = 330; g.fillStyle = '#7A5FA0'; g.font = '600 44px Jost, system-ui, sans-serif'; g.fillText((a.tipo || 'Orçamento') + (nomeAj(a) ? ' · ' + nomeAj(a) : ''), pad, y); y += 70; g.font = '36px Jost, system-ui, sans-serif';
      const linha = (t, v, b) => { g.fillStyle = '#2F2A35'; g.font = (b ? '600 ' : '') + '36px Jost, system-ui, sans-serif'; g.textAlign = 'left'; g.fillText(t.length > 38 ? t.slice(0, 37) + '…' : t, pad, y); g.textAlign = 'right'; g.fillText(v, W - pad, y); g.textAlign = 'left'; y += lh; };
      r.itens.forEach(i => linha(i.d + (i.q !== 1 ? ' ×' + i.q : ''), money(i.v))); if (r.urg) linha('Taxa de urgência', money(r.urg)); if (r.abat) linha('Desconto', '− ' + money(r.abat));
      g.fillStyle = '#E8E0D4'; g.fillRect(pad, y - 20, W - pad * 2, 3); y += 24; linha('Total', money(r.total), true); y += 10;
      g.fillStyle = '#6D6476'; g.font = '30px Jost, system-ui, sans-serif'; if (a.prazo) { g.fillText('Prazo: ' + fmtData(a.prazo), pad, y); y += 44; } if (c.pix) { g.fillText('Pix: ' + c.pix, pad, y); y += 44; } if (c.cont) g.fillText(c.cont, pad, y);
      cv.toBlob(b => { const u = URL.createObjectURL(b), el = document.createElement('a'); el.href = u; el.download = 'Notinha_Somnium.png'; document.body.appendChild(el); el.click(); setTimeout(() => { URL.revokeObjectURL(u); el.remove(); }, 800); toast('Foto da notinha salva'); }, 'image/png');
    };
    const im = new Image(); im.onload = () => { g.drawImage(im, W / 2 - 110, 60, 220, 220); fim(); }; im.onerror = fim; im.src = 'logo.png';
  }
  function vAjustes() {
    const lista = S.ajustes.slice().sort((x, y) => (x.prazo || '9999').localeCompare(y.prazo || '9999'));
    const cor = s => s === 'Entregue' ? 'ok' : s === 'Pronto' ? 'gold' : 'lil';
    return tela(topo('Mais', 'mais') + head('Ajustes de roupa', S.ajustes.length + (S.ajustes.length === 1 ? ' ajuste' : ' ajustes')) + '<div class="lista">' + (lista.length ? lista.map(a => { const r = calcAjuste(a); return '<button class="card" data-act="editar" data-v="ajustes:' + a.id + '"><div class="l1"><b>' + esc(nomeAj(a) || 'Sem nome') + '</b><b>' + money(r.total) + '</b></div><div class="l1"><span class="mut">' + esc(r.itens.map(i => i.d.split(' (')[0]).slice(0, 2).join(', ')) + (r.itens.length > 2 ? '…' : '') + (a.prazo ? ' · ' + fmtData(a.prazo) : '') + '</span><span class="pill ' + cor(a.status) + '">' + esc(a.status || 'Aguardando') + '</span></div></button>'; }).join('') : '<p class="vazio">Nenhum ajuste ainda. Toque em “Novo ajuste”.</p>') + '</div>' + fab('Novo ajuste', 'novo-ajustes'));
  }
  function vFormAjuste() {
    const d = S.draft; const r = calcAjuste(d);
    const servs = d.servs.map((x, i) => '<div class="mat"><div class="mh"><input class="in" data-f="servs.' + i + '.nome" placeholder="Serviço" value="' + esc(x.nome) + '"><button class="x" data-act="aj-del" data-v="' + i + '" aria-label="Remover serviço">' + svg('x', 18) + '</button></div><input class="in sm2" data-f="servs.' + i + '.det" placeholder="Detalhe (ex.: calça de jiu jitsu)" value="' + esc(x.det) + '"><div class="tri2 q4"><label>Quantidade<input class="in" inputmode="decimal" data-f="servs.' + i + '.qtd" value="' + esc(x.qtd) + '"></label><label>Minutos cada<input class="in" inputmode="decimal" data-f="servs.' + i + '.min" value="' + esc(x.min) + '"></label><label>Valor cada (R$)<input class="in" inputmode="decimal" data-f="servs.' + i + '.vu" value="' + esc(x.vu) + '"></label><label>Material (R$)<input class="in" inputmode="decimal" data-f="servs.' + i + '.mat" value="' + esc(x.mat) + '"></label></div></div>').join('');
    return tela(topo('Ajustes', 'ajustes') + '<div class="tit">' + (d.id ? 'Ajuste de roupa' : 'Novo ajuste') + '</div>' +
      sel('Cliente', 'clienteId', [['', '— escolher ou digitar abaixo —']].concat(S.clientes.slice().sort((x, y) => x.nome.localeCompare(y.nome)).map(c => [c.id, c.nome]))) + inp('Ou nome sem ficha', 'clienteNome') + inp('Prazo', 'prazo', { type: 'date' }) +
      '<div class="lb">Documento</div><div class="chips wrap">' + ['Orçamento', 'Recibo'].map(t => chip(t, d.tipo === t, 'set', 'tipo', t)).join('') + '</div><div class="lb">Situação</div><div class="chips wrap">' + ['Aguardando', 'Pronto', 'Entregue'].map(t => chip(t, d.status === t, 'set', 'status', t)).join('') + '</div>' +
      '<div class="rowh"><span class="sec2">Serviços</span><span class="lk"><button data-act="aj-add">+ serviço</button></span></div>' + (servs || '<p class="vazio">Toque em “+ serviço” e escolha na tabela.</p>') +
      '<label class="sw"><span><b>Urgente</b><small>soma a taxa de urgência de ' + cfg().urg + '%</small></span><input type="checkbox" data-f="urgente"' + (d.urgente ? ' checked' : '') + '></label>' + inp('Desconto (R$)', 'abat', { mode: 'decimal' }) + inp('Observações', 'obs', { area: true }) +
      '<div class="sec2">Resumo</div><div class="calc" id="calc">' + calcAjHtml(r) + '</div><div class="duo"><button class="btn sec" data-act="aj-copiar">Copiar texto</button><button class="btn sec" data-act="aj-foto">Salvar foto</button></div>' + barra(d.id ? 'excluir' : '', 'ajustes'));
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
      const m = { ajustes: vFormAjuste, pedidos: vFormPedido, agenda: vFormAgenda, clientes: vFormCliente, pecas: vFormPeca, insumos: vFormInsumo, vendas: vFormVenda, config: vConfig }; h = m[S.sub]();
    } else h = ({ inicio: vInicio, pedidos: vPedidos, agenda: vAgenda, pecas: vPecas, ajustes: vAjustes, mais: vMais, clientes: vClientes, insumos: vInsumos, vendas: vVendas }[S.view] || vInicio)();
    const y = window.scrollY; app.innerHTML = h; if (S.keepScroll) window.scrollTo(0, y);
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
  function abrir(col, d) { S.sub = col; S.draft = d; rerender(); window.scrollTo(0, 0); }
  function fechar() { S.draft = null; S.sub = null; rerender(); }
  function lerTudo() { document.querySelectorAll('[data-f]').forEach(el => { if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') setDraft(el); }); }
  function setDraft(el) {
    const v = el.type === 'checkbox' ? el.checked : el.value; const path = el.dataset.f;
    if (!S.draft || !path) return; setP(S.draft, path, v);
    if (S.sub === 'pecas') { const c = $('#calc'); if (c) c.innerHTML = calcHtml(calcPeca(S.draft), S.draft); }
    if (S.sub === 'ajustes') { const c = $('#calc'); if (c) c.innerHTML = calcAjHtml(calcAjuste(S.draft)); }
    if (S.sub === 'insumos') { const p = $('#pu'); if (p) p.textContent = 'Preço por unidade: ' + money(numRaw(S.draft.qtd) > 0 ? numRaw(S.draft.preco) / numRaw(S.draft.qtd) : 0); }
  }

  // ---------- salvar por coleção ----------
  async function gravar(col) {
    lerTudo(); const d = clone(S.draft);
    if (col === 'config') { ['hora', 'ind', 'margem', 'taxa', 'urg'].forEach(k => d[k] = num(d[k])); d.tab = (d.tab || []).filter(t => String(t.n || '').trim()); await store.save('config', 'main', d); S.cfg = d; toast('Configurações salvas'); fechar(); S.view = 'mais'; rerender(); return; }
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
    toast('Salvo'); fechar();
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
      const k = j.configuracoes; if (k) { const c = { hora: num(k.hora), ind: num(k.ind), margem: num(k.margem), taxa: num(k.taxa), arred: !!k.arred, urg: num(k.urg), pix: k.pix || '', cont: k.cont || '@somniumatelie', tab: (k.tab || []).map(t => ({ n: t.n, m: t.m, v: t.v })) }; await store.save('config', 'main', c); S.cfg = c; }
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
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, v = b.dataset.v;
    const fa = {
      entrar: async () => { try { S.msg = ''; await store.signIn(); } catch (x) { S.msg = 'Não consegui entrar. Tente de novo.'; const el = $('#err'); if (el) el.textContent = S.msg; } },
      sair: () => store.signOut(),
      ir: () => { S.draft = null; S.sub = null; S.view = v; window.scrollTo(0, 0); if (v === 'config') { abrir('config', novoRascunho('config')); return; } rerender(); },
      fechar: () => fechar(),
      filtro: () => { S.filtro = v; rerender(); },
      dia: () => { S.dia = v; S.semana = 0; rerender(true); },
      semana: () => { const d = parseIso(S.dia); d.setDate(d.getDate() + 7 * +v); S.dia = iso(d); S.semana = 0; rerender(true); },
      hoje: () => { S.dia = iso(new Date()); S.semana = 0; rerender(true); },
      set: () => { lerTudo(); setP(S.draft, b.dataset.f, v); rerender(true); },
      editar: () => { const p = v.split(':'); const o = S[p[0]].find(x => x.id === p[1]); if (o) { const d = clone(o); if (p[0] === 'pecas') { d.fotos = d.fotos || []; d.mats = d.mats || []; d.maq = d.maq || {}; } if (p[0] === 'clientes') d.med = d.med || {}; abrir(p[0], d); } },
      excluir: () => { if (confirm('Excluir de vez? Não dá para desfazer.')) guard(async () => { await store.remove(v, S.draft.id); toast('Excluído'); fechar(); })(); },
      salvar: () => guard(gravar)(v),
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
      'tab-add': () => { lerTudo(); (S.draft.tab = S.draft.tab || []).push({ n: '', m: '', v: '' }); rerender(true); },
      'tab-del': () => { lerTudo(); S.draft.tab.splice(+v, 1); rerender(true); },
      'aj-add': () => escolherServico(),
      'aj-pick': () => { const t = cfg().tab[+v]; lerTudo(); S.draft.servs.push(t ? { nome: t.n, det: '', min: String(t.m), qtd: '1', vu: String(t.v), mat: '' } : { nome: '', det: '', min: '', qtd: '1', vu: '', mat: '' }); fecharModal(); rerender(true); },
      'aj-del': () => { lerTudo(); S.draft.servs.splice(+v, 1); rerender(true); },
      'aj-copiar': () => { lerTudo(); const t = notaTexto(S.draft); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Texto copiado'), () => toast('Não consegui copiar')); },
      'aj-foto': () => { lerTudo(); notaFoto(S.draft); },
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
  return { S, calcPeca, avisosPreco, importar, render };
}
