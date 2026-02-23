import { useState, useEffect, useCallback, useRef } from "react";

const PREP_VERBS = ["a", "com", "de", "em", "por"];
const PREP_ADJ = ["a", "com", "de", "em", "por", "para"];

const ACCEPTED_FORMS = {
  a: ["a","à","ao","aos","às"], com: ["com","comigo","contigo","consigo","connosco","convosco"],
  de: ["de","do","da","dos","das","dele","dela","deles","delas","deste","desta","disto","desse","dessa","disso","daquele","daquela","daquilo","dum","duma","duns","dumas"],
  em: ["em","no","na","nos","nas","nele","nela","neles","nelas","neste","nesta","nisto","nesse","nessa","nisso","naquele","naquela","naquilo","num","numa","nuns","numas"],
  por: ["por","pelo","pela","pelos","pelas"], para: ["para","pra"],
};
const CONTRACTIONS = {
  a: new Set(["à","ao","aos","às"]), com: new Set(["comigo","contigo","consigo","connosco","convosco"]),
  de: new Set(["do","da","dos","das","dele","dela","deles","delas","deste","desta","disto","desse","dessa","disso","daquele","daquela","daquilo","dum","duma","duns","dumas"]),
  em: new Set(["no","na","nos","nas","nele","nela","neles","nelas","neste","nesta","nisto","nesse","nessa","nisso","naquele","naquela","naquilo","num","numa","nuns","numas"]),
  por: new Set(["pelo","pela","pelos","pelas"]), para: new Set([]),
};

function getPreps(e) { return Array.isArray(e.preposition) ? e.preposition : [e.preposition]; }
function prepDisplay(e) { return getPreps(e).join("/"); }
function entryKey(e) { return `${e.word} ${prepDisplay(e)}`; }
function isCorrectChoice(p, e) { return getPreps(e).includes(p); }

function checkAnswer(input, correctWord, basePreps) {
  const n = input.trim().toLowerCase(), correct = correctWord.toLowerCase();
  if (n === correct) return "exact";
  for (const bp of basePreps) {
    if (n === bp && CONTRACTIONS[bp]?.has(correct)) return "half";
    if (ACCEPTED_FORMS[bp]?.includes(n)) return "accepted";
  }
  return "wrong";
}

function parseExample(ex) {
  const m = ex.match(/^(.*?)\{([^}]+)\}(.*)$/);
  if (!m) return null;
  const clean = s => s.replace(/\{([^}]+)\}/g, "$1");
  return { before: clean(m[1]), answer: m[2], after: clean(m[3]) };
}
function pickGapExample(e) { const u = (e.examples||[]).map(parseExample).filter(Boolean); return u.length ? u[Math.floor(Math.random()*u.length)] : null; }
function shuffle(a) { const r=[...a]; for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];} return r; }
function pickRandom(a) { return a[Math.floor(Math.random()*a.length)]; }

async function loadStorage(k,f) { try{const r=localStorage.getItem(k);return r?JSON.parse(r):f;}catch{return f;} }
async function saveStorage(k,v) { try{localStorage.setItem(k,JSON.stringify(v));}catch(e){console.error("Storage:",e);} }

const API_URL = typeof window!=="undefined" && window.location.hostname==="localhost" ? "https://api.anthropic.com/v1/messages" : "/api/claude";
async function callAPI(body) { return (await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})).json(); }

async function validateWord(word,prep,type) {
  try { const d=await callAPI({model:"claude-sonnet-4-20250514",max_tokens:200,messages:[{role:"user",content:`Does the European Portuguese ${type==="adjective"?"adjective":"verb"} "${word}" exist and is it commonly used with the preposition "${prep}" in its regência? Answer ONLY with JSON, no markdown: {"valid":true/false,"reason":"brief explanation in Russian if invalid"}`}]});
    return JSON.parse((d.content?.map(c=>c.text||"").join("")||"").replace(/```json|```/g,"").trim());
  } catch{return{valid:true,reason:""};}
}
async function generateExamples(word,prep,type) {
  try { const d=await callAPI({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Generate exactly 3 example sentences in European Portuguese (PE only, never Brazilian) for the ${type==="adjective"?"adjective":"verb"} "${word}" with preposition "${prep}".
CRITICAL FORMAT: Mark the preposition/contraction with curly braces {word}. The word inside braces must be the CORRECT form (including contractions like {ao}, {do}, {no}, {pelo}, {à}, {num}, {nele}, etc.).
Rules: Novo Acordo 2009, natural EP, A2-B1, Portuguese names (João, Maria, Ana, Pedro, Inês), estar a + infinitive (NOT gerund), exactly one {contraction} marker per sentence.
Respond ONLY with a JSON array of 3 strings, no markdown.`}]});
    return JSON.parse((d.content?.map(c=>c.text||"").join("")||"").replace(/```json|```/g,"").trim());
  } catch{return[`Exemplo {${prep}} gerado.`];}
}
async function detectType(word) {
  try { const d=await callAPI({model:"claude-sonnet-4-20250514",max_tokens:100,messages:[{role:"user",content:`In European Portuguese, is "${word}" a verb or an adjective (when used with preposition regência)? Answer ONLY with JSON: {"type":"verb"} or {"type":"adjective"}`}]});
    const p=JSON.parse((d.content?.map(c=>c.text||"").join("")||"").replace(/```json|```/g,"").trim()); return p.type==="adjective"?"adjective":"verb";
  } catch{return"verb";}
}

function formatSessionDate(iso) {
  const d=new Date(iso), days=["dom","seg","ter","qua","qui","sex","sáb"], months=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}, ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

const IconPlay=()=><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IconBook=()=><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IconChart=()=><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IconSettings=()=><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconRef=()=><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IconTrash=()=><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconEdit=()=><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconCheck=()=><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconFire=()=><span style={{fontSize:"1.1em"}}>🔥</span>;

const INITIAL_DATA = [
  {word:"adaptar-se",type:"verb",preposition:"a",translation:"приспособиться к",examples:["O Peter adaptou-se facilmente {à} vida de Lisboa.","Tens de te adaptar {ao} novo horário de trabalho.","Ela ainda não se adaptou {ao} clima português."]},
  {word:"agarrar-se",type:"verb",preposition:"a",translation:"схватиться за",examples:["Agarrou-se {ao} braço dele para não escorregar.","O miúdo agarrou-se {à} mãe quando viu o cão.","Agarra-te {a} esta oportunidade, não a percas."]},
  {word:"incentivar",type:"verb",preposition:"a",translation:"побуждать к",examples:["A minha mãe sempre me incentivou {a} lutar pelos meus sonhos.","O professor incentivou os alunos {a} participar no debate.","Ninguém me incentivou {a} seguir esta carreira."]},
  {word:"oferecer",type:"verb",preposition:"a",translation:"подарить / предложить",examples:["Ofereceste alguma coisa {aos} teus pais no Natal?","Quero oferecer um livro {à} minha avó.","Ofereceram um bolo {ao} vizinho que se mudou."]},
  {word:"pertencer",type:"verb",preposition:"a",translation:"принадлежать",examples:["Ela pertence {a} uma organização de solidariedade.","Este terreno pertence {ao} município.","A quem pertence este guarda-chuva?"]},
  {word:"referir-se",type:"verb",preposition:"a",translation:"ссылаться на",examples:["Eles referiram-se {ao} teu trabalho com elogios.","A que é que te referes exatamente?","O artigo refere-se {a} um estudo recente."]},
  {word:"habituar-se",type:"verb",preposition:"a",translation:"привыкнуть к",examples:["Já me habituei {ao} trânsito de Lisboa.","Não me consigo habituar {a} acordar tão cedo.","Habituámo-nos {ao} barulho dos vizinhos."]},
  {word:"aborrecer-se",type:"verb",preposition:"com",translation:"раздражаться из-за",examples:["Aborreci-me {com} o miúdo por fazer barulho.","Não te aborreças {com} coisas sem importância.","Ela aborreceu-se {com} o atraso do comboio."]},
  {word:"casar-se",type:"verb",preposition:"com",translation:"жениться / выйти замуж за",examples:["A Ana casou-se {com} o meu irmão.","Quando é que te casas {com} a Inês?","Ele casou-se {com} uma colega de trabalho."]},
  {word:"embirrar",type:"verb",preposition:"com",translation:"придираться к",examples:["Ela embirra {com} os vizinhos do lado.","Porque é que embirras sempre {comigo}?","O chefe embirra {com} tudo o que eu faço."]},
  {word:"preocupar-se",type:"verb",preposition:"com",translation:"беспокоиться о",examples:["Não te preocupes tanto {com} o dinheiro.","Preocupo-me {com} a saúde da minha mãe.","Eles nunca se preocupam {com} os outros."]},
  {word:"sonhar",type:"verb",preposition:"com",translation:"мечтать о",examples:["Sonho {contigo} muitas vezes.","Ela sonha {com} uma casa no campo.","Ontem sonhei {com} o meu avô."]},
  {word:"zangar-se",type:"verb",preposition:"com",translation:"рассердиться на",examples:["Zangou-se {com} ela por chegar tão tarde a casa.","Não te zangues {comigo}, eu não tive culpa.","A professora zangou-se {com} os alunos."]},
  {word:"aproximar-se",type:"verb",preposition:"de",translation:"приближаться к",examples:["Não te aproximes {do} cão.","Aproximei-me {dela} para falar mais baixo.","O Natal está a aproximar-se {de} nós."]},
  {word:"cuidar",type:"verb",preposition:"de",translation:"заботиться о",examples:["A minha mãe cuida muito bem {de} nós.","Quem cuida {do} teu gato quando viajas?","Tens de cuidar {de} ti primeiro."]},
  {word:"despedir-se",type:"verb",preposition:"de",translation:"попрощаться с",examples:["Não me despedi {dele} quando viajou.","Despede-te {dos} teus colegas antes de ires embora.","Ela despediu-se {de} todos com um abraço."]},
  {word:"esquecer-se",type:"verb",preposition:"de",translation:"забыть о",examples:["Esqueci-me {de} te telefonar.","Nunca me esqueço {do} teu aniversário.","Esqueceste-te {de} fechar a porta?"]},
  {word:"lembrar-se",type:"verb",preposition:"de",translation:"вспомнить о",examples:["Lembras-te {do} meu aniversário?","Não me lembro {do} nome dele.","Lembrei-me {de} uma coisa importante."]},
  {word:"precisar",type:"verb",preposition:"de",translation:"нуждаться в",examples:["Preciso {de} comprar uns sapatos.","Precisas {de} ajuda com alguma coisa?","Ela não precisa {de} ninguém."]},
  {word:"acreditar",type:"verb",preposition:"em",translation:"верить в",examples:["Acreditas {em} tudo o que ela diz.","Eu acredito {em} ti, vai correr bem.","Já não acredito {em} milagres."]},
  {word:"basear-se",type:"verb",preposition:"em",translation:"основываться на",examples:["O filme baseia-se {no} livro.","Em que te baseias para dizer isso?","A decisão baseou-se {nos} dados disponíveis."]},
  {word:"confiar",type:"verb",preposition:"em",translation:"доверять",examples:["Confio {nele} para a função de diretor.","Podes confiar {em} mim, não conto a ninguém.","Ela não confia {nos} políticos."]},
  {word:"especializar-se",type:"verb",preposition:"em",translation:"специализироваться в",examples:["Ela especializou-se {em} Medicina Molecular.","Quero especializar-me {em} direito fiscal.","Ele especializou-se {em} cozinha portuguesa."]},
  {word:"permanecer",type:"verb",preposition:"em",translation:"оставаться в",examples:["Devemos permanecer {em} casa durante a quarentena.","O Pedro permaneceu {em} silêncio durante a reunião.","Vou permanecer {em} Lisboa até ao fim do mês."]},
  {word:"transformar",type:"verb",preposition:"em",translation:"превращать в",examples:["Ele transforma o barro {em} obras-primas.","Transformaram o armazém {num} restaurante.","A chuva transformou as ruas {em} rios."]},
  {word:"apaixonar-se",type:"verb",preposition:"por",translation:"влюбиться в",examples:["A Ana e o João apaixonaram-se um {pelo} outro.","Apaixonei-me {por} Lisboa logo na primeira visita.","Ela apaixonou-se {por} um colega de faculdade."]},
  {word:"criticar",type:"verb",preposition:"por",translation:"критиковать за",examples:["Ele criticou-a {pelos} gastos excessivos.","Não me critiques {por} ter tentado.","Foram criticados {pela} falta de organização."]},
  {word:"culpar",type:"verb",preposition:"por",translation:"обвинять в / за",examples:["Ele foi culpado {pelo} acidente.","Não me culpes {por} isso, não fui eu.","Culparam-no {pela} perda do contrato."]},
  {word:"esperar",type:"verb",preposition:"por",translation:"ждать",examples:["Espera {por} mim à porta do restaurante.","Estou a esperar {por} uma resposta do médico.","Não esperes {por} ele, vamos embora."]},
  {word:"interessar-se",type:"verb",preposition:"por",translation:"интересоваться",examples:["Interesso-me {por} pintura renascentista.","Ela interessa-se {por} história de Portugal.","Nunca me interessei {por} futebol."]},
  {word:"recear",type:"verb",preposition:"por",translation:"опасаться за",examples:["Eles receiam {pela} saúde do filho.","Receio {pelo} futuro do nosso planeta.","A mãe receia {pela} segurança dos filhos."]},
  // ── Adjectives ──
  {word:"zangado",type:"adjective",preposition:"com",translation:"злой / сердитый на",examples:["A Ana está zangada {com} a irmã mais nova.","Estou zangado {com} ele por ter mentido.","Não fiques zangada {comigo}, foi sem querer."]},
  {word:"aborrecido",type:"adjective",preposition:"com",translation:"раздражённый из-за",examples:["Estou tão aborrecido {com} este tempo.","Ela ficou aborrecida {com} a resposta dele.","Estamos aborrecidos {com} a situação no trabalho."]},
  {word:"ocupado",type:"adjective",preposition:"com",translation:"занят чем-л.",examples:["Não posso falar contigo. Estou ocupado {com} a contabilidade do mês.","Ela anda ocupada {com} os preparativos da festa.","O João está sempre ocupado {com} os projetos da empresa."]},
  {word:"assustado",type:"adjective",preposition:"com",translation:"напуганный чем-л.",examples:["Fiquei realmente assustado {com} o aspeto dele.","Ela está assustada {com} os resultados dos exames.","Estamos assustados {com} as notícias do jornal."]},
  {word:"surpreendido",type:"adjective",preposition:"com",translation:"удивлённый чем-л.",examples:["Fiquei surpreendido {com} a decisão deles.","Ela ficou surpreendida {com} o presente.","Estamos surpreendidos {com} o resultado final."]},
  {word:"orgulhoso",type:"adjective",preposition:"de",translation:"гордый чем-л.",examples:["Estou tão orgulhosa {de} ti!","O pai ficou orgulhoso {do} filho.","Ela está orgulhosa {dos} seus resultados."]},
  {word:"agradecido",type:"adjective",preposition:"por",translation:"благодарный за",examples:["Estamos tão agradecidos {pela} vossa ajuda.","Fico agradecido {por} tudo o que fizeste.","Ela está agradecida {pelo} apoio dos amigos."]},
  {word:"interessado",type:"adjective",preposition:["por","em"],translation:"заинтересованный в",examples:["Estou interessada {por} pintura impressionista.","Estou interessado {em} comprar aquela casa.","Ela está muito interessada {no} curso de fotografia."]},
  {word:"feliz",type:"adjective",preposition:"por",translation:"счастлив из-за",examples:["Fico muito feliz {por} ti.","Estou feliz {por} ter conseguido o emprego.","Ela está feliz {pela} promoção do marido."]},
  {word:"ansioso",type:"adjective",preposition:"para",translation:"нетерпеливый / стремящийся к",examples:["Estou ansioso {para} saber o resultado do exame.","Ela está ansiosa {para} começar o novo trabalho.","Estamos ansiosos {para} conhecer o bebé."]},
];

export default function App() {
  const [screen,setScreen]=useState("game");
  const [words,setWords]=useState(INITIAL_DATA);
  const [stats,setStats]=useState({});
  const [sessions,setSessions]=useState([]);
  const [settings,setSettings]=useState({questionsPerSession:15,showTimer:false,onlyHard:false,showExampleAfter:true,enableFreeInput:true,showTranslationAfter:false,useVerbs:true,useAdjectives:true});
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{const s=document.createElement("style");s.textContent="button:focus,button:focus-visible{outline:none!important;box-shadow:none!important}button::-moz-focus-inner{border:0}";document.head.appendChild(s);return()=>document.head.removeChild(s);},[]);

  useEffect(()=>{(async()=>{
    const sw=await loadStorage("words-db-v3",null),ss=await loadStorage("word-stats-v3",{}),sh=await loadStorage("session-history-v3",[]),se=await loadStorage("game-settings-v3",null);
    if(sw)setWords(sw);if(ss)setStats(ss);if(sh)setSessions(sh);if(se)setSettings(s=>({...s,...se}));setLoaded(true);
  })();},[]);

  useEffect(()=>{if(loaded)saveStorage("words-db-v3",words);},[words,loaded]);
  useEffect(()=>{if(loaded)saveStorage("word-stats-v3",stats);},[stats,loaded]);
  useEffect(()=>{if(loaded)saveStorage("session-history-v3",sessions);},[sessions,loaded]);
  useEffect(()=>{if(loaded)saveStorage("game-settings-v3",settings);},[settings,loaded]);

  const addWords=async(newWords,onStatus)=>{
    const enriched=[],results=[];
    for(const w of newWords){
      const label=`${w.word} ${Array.isArray(w.preposition)?w.preposition.join("/"):w.preposition}`;
      const exists=words.find(ew=>ew.word===w.word&&JSON.stringify(getPreps(ew))===JSON.stringify(getPreps(w)));
      if(exists){results.push({label,status:"duplicate"});if(onStatus)onStatus(results);continue;}
      if(onStatus)onStatus([...results,{label,status:"detecting"}]);
      const type=w.type||await detectType(w.word);
      const preps=getPreps(w);
      if(onStatus)onStatus([...results,{label,status:"validating"}]);
      const val=await validateWord(w.word,preps[0],type);
      if(!val.valid){results.push({label,status:"invalid",reason:val.reason});if(onStatus)onStatus(results);continue;}
      if(onStatus)onStatus([...results,{label,status:"generating"}]);
      const ex=await generateExamples(w.word,preps[0],type);
      let allEx=ex;
      if(preps.length>1){const ex2=await generateExamples(w.word,preps[1],type);allEx=[...ex.slice(0,2),...ex2.slice(0,1)];}
      enriched.push({...w,type,examples:allEx});results.push({label,status:"added"});if(onStatus)onStatus(results);
    }
    if(enriched.length>0)setWords(prev=>[...prev,...enriched].sort((a,b)=>a.word.localeCompare(b.word,"pt")));
    return results;
  };

  const removeWord=(word,prep)=>{setWords(prev=>prev.filter(w=>!(w.word===word&&JSON.stringify(getPreps(w))===JSON.stringify(Array.isArray(prep)?prep:[prep]))).sort((a,b)=>a.word.localeCompare(b.word,"pt")));};
  const updateTranslation=(word,prep,t)=>{setWords(prev=>prev.map(w=>w.word===word&&JSON.stringify(getPreps(w))===JSON.stringify(Array.isArray(prep)?prep:[prep])?{...w,translation:t}:w));};
  const recordAnswer=(key,pts)=>{setStats(prev=>{const o=prev[key]||{correct:0,wrong:0,half:0,points:0};if(pts>=1)return{...prev,[key]:{...o,correct:o.correct+1,points:o.points+pts}};if(pts===0.5)return{...prev,[key]:{...o,half:(o.half||0)+1,points:o.points+0.5}};return{...prev,[key]:{...o,wrong:o.wrong+1}};});};
  const saveSession=s=>setSessions(prev=>[s,...prev].slice(0,50));

  const activeWords=words.filter(w=>{if(w.type==="adjective"&&!settings.useAdjectives)return false;if(w.type!=="adjective"&&!settings.useVerbs)return false;return true;});

  if(!loaded)return(<div style={S.loadWrap}><div style={{textAlign:"center"}}><svg width="80" height="54" viewBox="0 0 80 54" style={{filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.12))"}}><defs><clipPath id="fc"><rect width="80" height="54" rx="4"/></clipPath></defs><g clipPath="url(#fc)"><rect x="0" y="0" width="32" height="54" fill="#006600"><animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite"/></rect><rect x="32" y="0" width="48" height="54" fill="#FF0000"><animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite" begin="0.2s"/></rect><circle cx="32" cy="27" r="10" fill="#FFCC00" stroke="#006600" strokeWidth="1.2"><animate attributeName="r" values="9.5;10.5;9.5" dur="1.8s" repeatCount="indefinite"/></circle><circle cx="32" cy="27" r="6.5" fill="#FFF" stroke="#003399" strokeWidth="1"><animate attributeName="r" values="6;7;6" dur="1.8s" repeatCount="indefinite"/></circle><circle cx="32" cy="24" r="1.2" fill="#003399"/><circle cx="29.5" cy="26" r="1.2" fill="#003399"/><circle cx="34.5" cy="26" r="1.2" fill="#003399"/><circle cx="30" cy="29" r="1.2" fill="#003399"/><circle cx="34" cy="29" r="1.2" fill="#003399"/></g></svg><p style={{marginTop:"14px",fontSize:"0.9rem",color:C.muted,fontFamily:C.sans}}>A carregar...</p></div></div>);

  return(
    <div style={S.app}><div style={S.main}>
      {screen==="game"&&<GameScreen words={activeWords} stats={stats} settings={settings} recordAnswer={recordAnswer} saveSession={saveSession}/>}
      {screen==="database"&&<DatabaseScreen words={words} addWords={addWords} removeWord={removeWord} updateTranslation={updateTranslation}/>}
      {screen==="stats"&&<StatsScreen sessions={sessions} stats={stats} words={words}/>}
      {screen==="reference"&&<ReferenceScreen words={words}/>}
      {screen==="settings"&&<SettingsScreen settings={settings} setSettings={setSettings}/>}
    </div>
    <nav style={S.nav}>{[{id:"game",icon:<IconPlay/>,l:"Jogar"},{id:"database",icon:<IconBook/>,l:"Palavras"},{id:"stats",icon:<IconChart/>,l:"Stats"},{id:"reference",icon:<IconRef/>,l:"Consulta"},{id:"settings",icon:<IconSettings/>,l:"Opções"}].map(t=>(
      <button key={t.id} onClick={()=>setScreen(t.id)} style={{...S.navBtn,...(screen===t.id?S.navBtnA:{})}}><span style={{color:screen===t.id?C.primary:C.muted}}>{t.icon}</span><span style={{...S.navLbl,...(screen===t.id?{color:C.primary,fontWeight:"600"}:{})}}>{t.l}</span></button>
    ))}</nav></div>
  );
}

// ═══ GAME ═══
function GameScreen({words,stats,settings,recordAnswer,saveSession}){
  const [phase,setPhase]=useState("ready");
  const [questions,setQuestions]=useState([]);
  const [idx,setIdx]=useState(0);
  const [streak,setStreak]=useState(0);
  const [maxStreak,setMaxStreak]=useState(0);
  const [score,setScore]=useState(0);
  const [totalAnswered,setTotalAnswered]=useState(0);
  const [wrongCount,setWrongCount]=useState(0);
  const [answered,setAnswered]=useState(false);
  const [selected,setSelected]=useState(null);
  const [result,setResult]=useState(null);
  const [showTrans,setShowTrans]=useState(false);
  const [inputVal,setInputVal]=useState("");
  const [timer,setTimer]=useState(0);
  const timerRef=useRef(null),inputRef=useRef(null),transRef=useRef(null),justAnsweredRef=useRef(false);

  useEffect(()=>{const h=e=>{if(e.key==="Enter"&&answered&&phase==="playing"&&!justAnsweredRef.current){e.preventDefault();nextQ();}};document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);},[answered,phase,idx,questions.length]);

  const startGame=useCallback(()=>{
    let pool=[...words];if(pool.length===0)return;
    if(settings.onlyHard&&Object.keys(stats).length>0){const h=pool.filter(w=>{const s=stats[entryKey(w)];if(!s||(s.correct+s.wrong+(s.half||0))<3)return true;return s.wrong/(s.correct+s.wrong+(s.half||0))>0.35;});if(h.length>=5)pool=h;}
    const weighted=[];for(const w of pool){const s=stats[entryKey(w)];const wt=s?Math.max(1,1+s.wrong-s.correct*0.5):2;for(let i=0;i<Math.ceil(wt);i++)weighted.push(w);}
    const sel=[];const used=new Set();const count=Math.min(settings.questionsPerSession,words.length);
    while(sel.length<count&&weighted.length>0){const pick=pickRandom(weighted);const key=entryKey(pick);if(!used.has(key)||sel.length>=pool.length){used.add(key);let mode="choice";if(settings.enableFreeInput){const gap=pickGapExample(pick);if(gap&&Math.random()<0.5)mode="input";}const gapData=mode==="input"?pickGapExample(pick):null;const exForDisplay=pickRandom((pick.examples||[]).filter(e=>parseExample(e)));const prepSet=pick.type==="adjective"?PREP_ADJ:PREP_VERBS;sel.push({...pick,mode,gapData,exForDisplay,prepSet});}}
    setQuestions(shuffle(sel));setIdx(0);setStreak(0);setMaxStreak(0);setScore(0);setTotalAnswered(0);setWrongCount(0);setAnswered(false);setSelected(null);setResult(null);setShowTrans(false);setInputVal("");setTimer(0);setPhase("playing");
  },[words,stats,settings]);

  useEffect(()=>{if(phase==="playing"&&settings.showTimer&&!answered){timerRef.current=setInterval(()=>setTimer(t=>t+0.1),100);return()=>clearInterval(timerRef.current);}return()=>clearInterval(timerRef.current);},[phase,settings.showTimer,answered,idx]);
  useEffect(()=>{if(phase==="playing"&&questions[idx]?.mode==="input"&&!answered)setTimeout(()=>inputRef.current?.focus(),100);},[idx,phase,answered,questions]);

  const q=questions[idx];

  const handleChoice=p=>{if(answered)return;clearInterval(timerRef.current);const correct=isCorrectChoice(p,q);setAnswered(true);setSelected(p);setResult(correct?"exact":"wrong");setTotalAnswered(a=>a+1);if(correct){setScore(s=>s+1);setStreak(s=>{const n=s+1;setMaxStreak(m=>Math.max(m,n));return n;});recordAnswer(entryKey(q),1);}else{setWrongCount(w=>w+1);setStreak(0);recordAnswer(entryKey(q),0);}};

  const handleInput=val=>{if(answered||!q.gapData)return;clearInterval(timerRef.current);justAnsweredRef.current=true;setTimeout(()=>{justAnsweredRef.current=false;},100);const res=checkAnswer(val,q.gapData.answer,getPreps(q));setAnswered(true);setSelected(val.trim().toLowerCase());setResult(res);setTotalAnswered(a=>a+1);if(res==="exact"||res==="accepted"){setScore(s=>s+1);setStreak(s=>{const n=s+1;setMaxStreak(m=>Math.max(m,n));return n;});recordAnswer(entryKey(q),1);}else if(res==="half"){setScore(s=>s+0.5);setStreak(s=>{const n=s+1;setMaxStreak(m=>Math.max(m,n));return n;});recordAnswer(entryKey(q),0.5);}else{setWrongCount(w=>w+1);setStreak(0);recordAnswer(entryKey(q),0);}};

  const nextQ=()=>{if(idx+1>=questions.length){saveSession({date:new Date().toISOString(),total:questions.length,score,wrong:wrongCount,maxStreak});setPhase("result");}else{setIdx(i=>i+1);setAnswered(false);setSelected(null);setResult(null);setShowTrans(false);setInputVal("");setTimer(0);}};
  const toggleTrans=()=>{if(showTrans)return;setShowTrans(true);clearTimeout(transRef.current);transRef.current=setTimeout(()=>setShowTrans(false),3000);};
  useEffect(()=>()=>clearTimeout(transRef.current),[]);

  if(phase==="ready")return(
    <div style={S.center}><div style={S.card}>
      <h1 style={S.title}>Regência</h1><p style={S.subtitle}>Verbos e Adjetivos com Preposições</p>
      <div style={S.readyInfo}><span style={S.infoItem}>{words.length} palavras</span><span style={S.dot}>•</span><span style={S.infoItem}>{settings.questionsPerSession} perguntas</span></div>
      {settings.onlyHard&&<div style={S.badge}>Modo difícil</div>}
      {words.length===0?<p style={S.muted}>Ativa verbos ou adjetivos nas definições.</p>:<button onClick={startGame} style={S.btnPrimary}>Começar</button>}
    </div></div>);

  if(phase==="result"){const pct=totalAnswered>0?Math.round((score/totalAnswered)*100):0;return(
    <div style={S.center}><div style={S.card}>
      <h2 style={S.resultTitle}>Sessão Concluída!</h2><div style={S.bigPct}>{pct}%</div>
      <div style={S.resultRow}><div style={S.resultItem}><span style={S.resultVal}>{score}</span><span style={S.resultLbl}>pontos</span></div><div style={S.resultItem}><span style={S.resultVal}>{wrongCount}</span><span style={S.resultLbl}>erros</span></div><div style={S.resultItem}><span style={S.resultVal}><IconFire/> {maxStreak}</span><span style={S.resultLbl}>série</span></div></div>
      <button onClick={()=>setPhase("ready")} style={S.btnPrimary}>Jogar outra vez</button>
    </div></div>);}

  if(!q)return null;

  return(
    <div style={S.gameWrap}>
      <div style={S.progBar}><div style={{...S.progFill,width:`${(idx/questions.length)*100}%`}}/></div>
      <div style={S.gameHead}><span style={S.qCount}>{idx+1} / {questions.length}</span><div style={{display:"flex",gap:"8px",alignItems:"center"}}>{streak>0&&<span style={S.streakBadge}><IconFire/> {streak}</span>}{settings.showTimer&&<span style={S.timerBadge}>{timer.toFixed(1)}s</span>}</div></div>
      <div style={S.verbArea}>
        <button onClick={toggleTrans} style={S.verbBtn}>
          {showTrans||(answered&&settings.showTranslationAfter)?<span style={S.verbText}><span style={{color:C.primary}}>{q.translation}</span></span>:<><span style={S.verbText}>{q.word}</span><span style={S.infoIcon}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></span></>}
        </button>
        <div style={S.typeLabel}><span style={{...S.typeBadge,backgroundColor:q.type==="adjective"?"#e8d5f5":C.primaryLt,color:q.type==="adjective"?"#6b21a8":"#1b4332"}}>{q.type==="adjective"?"adj":"verbo"}</span></div>
        {!answered&&!showTrans&&<p style={S.verbHint}>toca para ver a tradução</p>}
      </div>

      {q.mode==="choice"?(
        <>
          <div style={{...S.choiceGrid,gridTemplateColumns:q.prepSet.length>5?"1fr 1fr 1fr":"1fr 1fr"}}>
            {q.prepSet.map(p=>{let st=S.choiceBtn;if(answered){if(isCorrectChoice(p,q))st={...st,...S.choiceOk};else if(p===selected&&result==="wrong")st={...st,...S.choiceErr};else st={...st,opacity:0.35};}return<button key={`${idx}-${p}`} onClick={()=>handleChoice(p)} disabled={answered} style={st}>{p}</button>;})}
          </div>
          {answered&&settings.showExampleAfter&&q.exForDisplay&&(()=>{const parsed=parseExample(q.exForDisplay);if(!parsed)return null;return<div style={S.exBox}><p style={S.exText}>{parsed.before}<strong style={{color:C.primary}}>{parsed.answer}</strong>{parsed.after}</p></div>;})()}
        </>
      ):(
        <>
          {q.gapData&&(<div style={S.sentenceWrap}>
            <p style={S.sentenceText}>{q.gapData.before}<span style={S.gapContainer}>{answered?<span style={{...S.gapAnswered,color:result==="wrong"?C.accent:result==="half"?"#b8860b":C.primary,textDecoration:result==="wrong"?"line-through":"none"}}>{inputVal||selected}</span>:<input ref={inputRef} type="text" value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&inputVal.trim()){e.preventDefault();handleInput(inputVal);}}} style={S.gapInput} autoCapitalize="none" autoCorrect="off" spellCheck="false" lang="pt" placeholder="..."/>}</span>{q.gapData.after}</p>
            {answered&&result==="half"&&<p style={S.feedbackHalf}>½ ponto — forma correta: <strong>{q.gapData.answer}</strong></p>}
            {answered&&result==="wrong"&&<p style={S.feedbackWrong}>Resposta correta: <strong>{q.gapData.answer}</strong></p>}
            {answered&&(result==="exact"||result==="accepted")&&<p style={S.feedbackOk}>✓ Correto!</p>}
          </div>)}
          {!answered&&inputVal.trim()&&<button onClick={()=>handleInput(inputVal)} style={S.btnCheck}>Verificar</button>}
        </>
      )}
      {answered&&<button onClick={nextQ} style={S.btnNext}>{idx+1>=questions.length?"Ver resultado":"Seguinte"} <span style={{opacity:0.5,fontSize:"0.8em",marginLeft:"6px"}}>↵</span></button>}
    </div>
  );
}

// ═══ DATABASE ═══
function DatabaseScreen({words,addWords,removeWord,updateTranslation}){
  const [tab,setTab]=useState("list");
  const [input,setInput]=useState("");
  const [adding,setAdding]=useState(false);
  const [statusLog,setStatusLog]=useState([]);
  const [filter,setFilter]=useState("all");
  const [typeFilter,setTypeFilter]=useState("all");
  const [editKey,setEditKey]=useState(null);
  const [editVal,setEditVal]=useState("");
  const ALL_PREPS=["a","com","de","em","por","para"];

  const handleAdd=async()=>{
    if(!input.trim())return;setAdding(true);setStatusLog([]);
    const lines=input.trim().split("\n").filter(Boolean),parsed=[];
    for(const line of lines){
      const m=line.match(/^(.+?)\s+((?:(?:a|com|de|em|por|para)(?:\s*\/\s*)?)+)\s*[—–\-]\s*(.+)$/i);
      if(m){const preps=m[2].split(/\s*\/\s*/).map(p=>p.trim().toLowerCase()).filter(p=>ALL_PREPS.includes(p));
        if(preps.length>0)parsed.push({word:m[1].trim().toLowerCase(),preposition:preps.length===1?preps[0]:preps,translation:m[3].trim()});
        else setStatusLog(prev=>[...prev,{label:line.trim().substring(0,50),status:"parse_error",reason:"preposição não reconhecida"}]);
      }else{const hasSep=line.match(/^(.+?)\s*[—–\-]\s*(.+)$/);setStatusLog(prev=>[...prev,{label:line.trim().substring(0,50),status:"parse_error",reason:hasSep?"falta a preposição (a/com/de/em/por/para)":"formato não reconhecido"}]);}
    }
    if(parsed.length>0){const results=await addWords(parsed,interim=>{setStatusLog(s=>{const pe=s.filter(x=>x.status==="parse_error");return[...pe,...interim];});});const pe=statusLog.filter(x=>x.status==="parse_error");setStatusLog([...pe,...results]);if(results.filter(r=>r.status==="added").length>0)setInput("");}
    setAdding(false);
  };

  const startEdit=w=>{setEditKey(entryKey(w));setEditVal(w.translation);};
  const saveEdit=w=>{updateTranslation(w.word,w.preposition,editVal);setEditKey(null);};

  const filtered=words.filter(w=>{if(typeFilter==="verb"&&w.type==="adjective")return false;if(typeFilter==="adjective"&&w.type!=="adjective")return false;if(filter!=="all"&&!getPreps(w).includes(filter))return false;return true;});
  const grouped={};for(const w of filtered)for(const p of getPreps(w)){if(!grouped[p])grouped[p]=[];if(!grouped[p].find(x=>x.word===w.word))grouped[p].push(w);}

  return(
    <div style={S.padded}>
      <h2 style={S.screenTitle}>Base de Palavras</h2>
      <div style={S.tabs}><button onClick={()=>setTab("list")} style={{...S.tabBtn,...(tab==="list"?S.tabA:{})}}>Lista ({words.length})</button><button onClick={()=>setTab("add")} style={{...S.tabBtn,...(tab==="add"?S.tabA:{})}}>Adicionar</button></div>
      {tab==="list"&&(<>
        <div style={S.filterRow}>{["all","verb","adjective"].map(f=><button key={f} onClick={()=>setTypeFilter(f)} style={{...S.chip,...(typeFilter===f?S.chipA:{})}}>{f==="all"?"todos":f==="verb"?"verbos":"adjetivos"}</button>)}</div>
        <div style={S.filterRow}>{["all",...ALL_PREPS].map(f=><button key={f} onClick={()=>setFilter(f)} style={{...S.chip,...(filter===f?S.chipA:{})}}>{f==="all"?"todas prep.":f}</button>)}</div>
        <div style={S.vList}>{Object.entries(grouped).sort(([a],[b])=>a.localeCompare(b)).map(([prep,list])=>(
          <div key={prep}><div style={S.groupHead}>{prep.toUpperCase()}</div>
            {list.sort((a,b)=>a.word.localeCompare(b.word,"pt")).map(w=>{const key=entryKey(w);const editing=editKey===key;return(
              <div key={key} style={S.vRow}><div style={S.vRowInfo}>
                <span style={S.vRowName}>{w.word} <span style={{color:C.primary,fontWeight:"400"}}>{prepDisplay(w)}</span><span style={{...S.typeBadgeSm,backgroundColor:w.type==="adjective"?"#e8d5f5":C.primaryLt,color:w.type==="adjective"?"#6b21a8":"#1b4332"}}>{w.type==="adjective"?"adj":"v"}</span></span>
                {editing?<div style={{display:"flex",gap:"6px",alignItems:"center",marginTop:"4px"}}><input value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEdit(w)} style={S.editInput} autoFocus/><button onClick={()=>saveEdit(w)} style={S.iconBtn}><IconCheck/></button></div>:<span style={S.vRowTrans}>{w.translation}</span>}
              </div><div style={{display:"flex",gap:"2px",flexShrink:0}}>{!editing&&<button onClick={()=>startEdit(w)} style={S.iconBtn}><IconEdit/></button>}<button onClick={()=>removeWord(w.word,w.preposition)} style={S.iconBtn}><IconTrash/></button></div></div>
            );})}</div>
        ))}</div>
      </>)}
      {tab==="add"&&(<div style={S.addCard}>
        <p style={S.hint}>Formato: <code style={S.code}>palavra preposição — tradução</code></p>
        <p style={S.hint}>Двойное управление: <code style={S.code}>interessado por/em — перевод</code></p>
        <p style={S.hint}>Тип (глагол/прилагательное) определяется автоматически.</p>
        <pre style={S.pre}>{`depender de — зависеть от\norgulhoso de — гордый\ninteressado por/em — заинтересованный в`}</pre>
        <textarea value={input} onChange={e=>setInput(e.target.value)} style={S.textarea} rows={5} placeholder="depender de — зависеть от" disabled={adding}/>
        <button onClick={handleAdd} disabled={adding||!input.trim()} style={{...S.btnPrimary,width:"100%",marginTop:"12px",...(adding||!input.trim()?{opacity:0.4,cursor:"not-allowed"}:{})}}>{adding?"A processar...":"Adicionar"}</button>
        {statusLog.length>0&&<div style={S.statusLog}>{statusLog.map((item,i)=><div key={i} style={S.statusRow}><span style={{...S.statusIcon,color:item.status==="added"?C.primary:item.status==="duplicate"?C.gold:item.status==="invalid"||item.status==="parse_error"?C.accent:C.light}}>{item.status==="added"?"✓":item.status==="duplicate"?"⚠":item.status==="invalid"||item.status==="parse_error"?"✗":"⟳"}</span><span style={S.statusLabel}>{item.label}</span><span style={S.statusMsg}>{item.status==="added"&&"adicionado"}{item.status==="duplicate"&&"já existe"}{item.status==="invalid"&&(item.reason||"regência inválida")}{item.status==="parse_error"&&(item.reason||"formato não reconhecido")}{item.status==="validating"&&"a verificar..."}{item.status==="generating"&&"a gerar exemplos..."}{item.status==="detecting"&&"a detetar tipo..."}</span></div>)}</div>}
      </div>)}
    </div>
  );
}

// ═══ STATS ═══
function StatsScreen({sessions,stats,words}){
  const totalC=Object.values(stats).reduce((s,v)=>s+v.correct,0),totalW=Object.values(stats).reduce((s,v)=>s+v.wrong,0),totalH=Object.values(stats).reduce((s,v)=>s+(v.half||0),0),total=totalC+totalW+totalH,pct=total>0?Math.round((totalC/total)*100):0;
  const hardWords=words.map(w=>{const k=entryKey(w),s=stats[k];if(!s||s.correct+s.wrong+(s.half||0)<2)return null;const er=s.wrong/(s.correct+s.wrong+(s.half||0));return er>0.3?{...w,...s,errRate:er,key:k}:null;}).filter(Boolean).sort((a,b)=>b.errRate-a.errRate).slice(0,10);
  return(
    <div style={S.padded}><h2 style={S.screenTitle}>Estatísticas</h2>
      <div style={S.statsGrid}><div style={S.statBox}><div style={S.statNum}>{pct}%</div><div style={S.statLbl}>precisão</div></div><div style={S.statBox}><div style={S.statNum}>{total}</div><div style={S.statLbl}>respostas</div></div><div style={S.statBox}><div style={S.statNum}>{sessions.length}</div><div style={S.statLbl}>sessões</div></div></div>
      {hardWords.length>0&&<div style={S.section}><h3 style={S.secTitle}>Palavras mais difíceis</h3>{hardWords.map(w=><div key={w.key} style={S.hardRow}><span style={S.hardName}>{w.word} <span style={{color:C.primary}}>{prepDisplay(w)}</span></span><span style={S.hardStats}>{w.correct}✓ {w.half||0}½ {w.wrong}✗</span></div>)}</div>}
      <div style={S.section}><h3 style={S.secTitle}>Histórico</h3>{sessions.length===0?<p style={S.muted}>Ainda sem sessões.</p>:sessions.map((s,i)=><div key={i} style={S.sessRow}><span style={S.sessDate}>{formatSessionDate(s.date)}</span><span style={S.sessResult}>{s.score}/{s.total} {s.maxStreak>1&&<><IconFire/> {s.maxStreak}</>}</span></div>)}</div>
    </div>
  );
}

// ═══ REFERENCE ═══
function ReferenceScreen({words}){
  const [refTab,setRefTab]=useState("verb");
  const filtered=words.filter(w=>refTab==="verb"?w.type!=="adjective":w.type==="adjective");
  const grouped={};for(const w of filtered)for(const p of getPreps(w)){if(!grouped[p])grouped[p]=[];if(!grouped[p].find(x=>x.word===w.word))grouped[p].push(w);}
  return(
    <div style={S.padded}><h2 style={S.screenTitle}>Consulta: Regência</h2>
      <div style={S.tabs}><button onClick={()=>setRefTab("verb")} style={{...S.tabBtn,...(refTab==="verb"?S.tabA:{})}}>Verbos</button><button onClick={()=>setRefTab("adj")} style={{...S.tabBtn,...(refTab==="adj"?S.tabA:{})}}>Adjetivos</button></div>
      {["a","com","de","em","por","para"].map(prep=>{const list=grouped[prep];if(!list||!list.length)return null;return(
        <div key={prep} style={{marginBottom:"20px"}}><div style={S.refPrepHead}>{prep.toUpperCase()}</div><div style={S.refTable}>{list.sort((a,b)=>a.word.localeCompare(b.word,"pt")).map(w=><div key={entryKey(w)} style={S.refRow}><span style={S.refVerb}>{w.word} <span style={{color:C.primary}}>{prepDisplay(w)}</span></span><span style={S.refTrans}>{w.translation}</span></div>)}</div></div>
      );})}
    </div>
  );
}

// ═══ SETTINGS ═══
function SettingsScreen({settings,setSettings}){
  const u=(k,v)=>{if(k==="useVerbs"&&!v&&!settings.useAdjectives)return;if(k==="useAdjectives"&&!v&&!settings.useVerbs)return;setSettings(s=>({...s,[k]:v}));};
  return(
    <div style={S.padded}><h2 style={S.screenTitle}>Definições</h2><div style={S.settingsGroup}>
      <SetRow l="Perguntas por sessão" h="Quantas palavras treinar por ronda"><select value={settings.questionsPerSession} onChange={e=>u("questionsPerSession",Number(e.target.value))} style={S.select}>{[5,10,15,20,25,30].map(n=><option key={n} value={n}>{n}</option>)}</select></SetRow>
      <SetRow l="Usar verbos" h="Incluir verbos no treino"><Toggle v={settings.useVerbs} o={v=>u("useVerbs",v)}/></SetRow>
      <SetRow l="Usar adjetivos" h="Incluir adjetivos no treino"><Toggle v={settings.useAdjectives} o={v=>u("useAdjectives",v)}/></SetRow>
      <SetRow l="Escrita livre" h="Ativar o modo de introdução da preposição na frase"><Toggle v={settings.enableFreeInput} o={v=>u("enableFreeInput",v)}/></SetRow>
      <SetRow l="Temporizador" h="Mostra o tempo de cada resposta"><Toggle v={settings.showTimer} o={v=>u("showTimer",v)}/></SetRow>
      <SetRow l="Apenas difíceis" h="Treinar só palavras com mais erros"><Toggle v={settings.onlyHard} o={v=>u("onlyHard",v)}/></SetRow>
      <SetRow l="Mostrar exemplo" h="Frase de exemplo após resposta (modo escolha)"><Toggle v={settings.showExampleAfter} o={v=>u("showExampleAfter",v)}/></SetRow>
      <SetRow l="Tradução após resposta" h="Mostrar a tradução após responder"><Toggle v={settings.showTranslationAfter} o={v=>u("showTranslationAfter",v)}/></SetRow>
    </div></div>
  );
}
function SetRow({l,h,children}){return<div style={S.setRow}><div style={{flex:1,minWidth:0}}><div style={S.setLabel}>{l}</div><div style={S.setHint}>{h}</div></div>{children}</div>;}
function Toggle({v,o}){return<button onClick={()=>o(!v)} style={{...S.toggle,backgroundColor:v?C.primary:"#ccc"}}><div style={{...S.toggleKnob,transform:v?"translateX(22px)":"translateX(2px)"}}/></button>;}

// ═══ STYLES ═══
const C={bg:"#f5f0eb",card:"#ffffff",primary:"#2d6a4f",primaryLt:"#d8f3dc",accent:"#c44536",accentLt:"#fce4e1",gold:"#e09f3e",goldLt:"#fdf0d5",text:"#1b1b1b",light:"#5c5c5c",muted:"#9a9a9a",border:"#e8e2dc",shadow:"0 2px 12px rgba(0,0,0,0.06)",r:"12px",rs:"8px",font:"'Source Serif 4','Lora',Georgia,serif",sans:"'DM Sans','Nunito',-apple-system,sans-serif"};
const S={
  app:{fontFamily:C.sans,backgroundColor:C.bg,color:C.text,minHeight:"100vh",display:"flex",flexDirection:"column",maxWidth:"600px",margin:"0 auto",position:"relative"},
  main:{flex:1,paddingBottom:"72px",overflowY:"auto"},
  loadWrap:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",fontFamily:C.sans,backgroundColor:C.bg},
  nav:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"600px",display:"flex",backgroundColor:C.card,borderTop:`1px solid ${C.border}`,boxShadow:"0 -2px 10px rgba(0,0,0,0.04)",zIndex:100},
  navBtn:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"1px",padding:"8px 2px",border:"none",background:"none",cursor:"pointer",minHeight:"52px"},navBtnA:{},
  navLbl:{fontSize:"0.65rem",fontWeight:"500",color:C.muted},
  center:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"calc(100vh - 72px)",padding:"24px 16px"},
  card:{textAlign:"center",padding:"36px 24px",backgroundColor:C.card,borderRadius:C.r,boxShadow:C.shadow,width:"100%",maxWidth:"420px"},
  title:{fontFamily:C.font,fontSize:"clamp(1.4rem,5vw,1.9rem)",fontWeight:"700",margin:"0 0 6px 0",lineHeight:1.2},
  subtitle:{fontSize:"0.9rem",color:C.light,margin:"0 0 20px 0"},
  readyInfo:{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",marginBottom:"20px"},
  infoItem:{fontSize:"0.85rem",color:C.muted},dot:{color:C.muted},
  badge:{display:"inline-block",padding:"4px 14px",backgroundColor:C.accentLt,color:C.accent,borderRadius:"20px",fontSize:"0.8rem",fontWeight:"600",marginBottom:"16px"},
  btnPrimary:{padding:"14px 44px",backgroundColor:C.primary,color:"#fff",border:"none",borderRadius:C.rs,fontSize:"1rem",fontWeight:"600",cursor:"pointer",fontFamily:C.sans,minHeight:"48px",transition:"opacity .15s"},
  btnCheck:{display:"block",margin:"12px auto 0",padding:"12px 36px",backgroundColor:C.primary,color:"#fff",border:"none",borderRadius:C.rs,fontSize:"0.95rem",fontWeight:"600",cursor:"pointer",fontFamily:C.sans,minHeight:"44px"},
  btnNext:{width:"100%",padding:"14px",backgroundColor:C.text,color:"#fff",border:"none",borderRadius:C.rs,fontSize:"1rem",fontWeight:"600",cursor:"pointer",fontFamily:C.sans,minHeight:"48px",marginTop:"16px",display:"flex",alignItems:"center",justifyContent:"center"},
  gameWrap:{padding:"12px 16px",maxWidth:"500px",margin:"0 auto",width:"100%"},
  progBar:{height:"4px",backgroundColor:C.border,borderRadius:"2px",overflow:"hidden",marginBottom:"14px"},
  progFill:{height:"100%",backgroundColor:C.primary,transition:"width .3s ease",borderRadius:"2px"},
  gameHead:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"},
  qCount:{fontSize:"0.85rem",color:C.muted,fontWeight:"500"},
  streakBadge:{display:"inline-flex",alignItems:"center",gap:"3px",padding:"3px 10px",backgroundColor:C.goldLt,borderRadius:"20px",fontSize:"0.82rem",fontWeight:"600",color:"#8a6914"},
  timerBadge:{fontSize:"0.82rem",color:C.muted,fontVariantNumeric:"tabular-nums"},
  verbArea:{textAlign:"center",marginBottom:"24px"},
  verbBtn:{background:"none",border:"none",cursor:"pointer",padding:"12px 20px",borderRadius:C.rs,display:"flex",alignItems:"center",justifyContent:"center",width:"100%",minHeight:"56px",gap:"8px"},
  verbText:{fontFamily:C.font,fontSize:"clamp(1.5rem,6vw,2.1rem)",fontWeight:"700",color:C.text,overflowWrap:"break-word"},
  infoIcon:{color:C.muted,flexShrink:0,display:"flex",alignItems:"center",opacity:0.5},
  verbHint:{fontSize:"0.72rem",color:C.muted,marginTop:"2px"},
  typeLabel:{marginTop:"4px"},
  typeBadge:{display:"inline-block",padding:"2px 10px",borderRadius:"12px",fontSize:"0.7rem",fontWeight:"600",letterSpacing:"0.03em"},
  typeBadgeSm:{display:"inline-block",padding:"1px 6px",borderRadius:"8px",fontSize:"0.6rem",fontWeight:"600",marginLeft:"6px",verticalAlign:"middle"},
  choiceGrid:{display:"grid",gap:"10px",marginBottom:"16px"},
  choiceBtn:{padding:"14px",backgroundColor:C.card,border:`2px solid ${C.border}`,borderRadius:C.rs,fontSize:"1.1rem",fontWeight:"600",fontFamily:C.font,cursor:"pointer",transition:"all .15s",minHeight:"50px",color:C.text,outline:"none",WebkitTapHighlightColor:"transparent"},
  choiceOk:{backgroundColor:"#d4edda",borderColor:"#2d6a4f",color:"#155724"},
  choiceErr:{backgroundColor:"#f8d7da",borderColor:"#c44536",color:"#721c24"},
  choiceReveal:{backgroundColor:C.goldLt,borderColor:C.gold,color:"#8a6914"},
  exBox:{padding:"12px 14px",backgroundColor:C.primaryLt,borderRadius:C.rs,marginBottom:"4px",borderLeft:`3px solid ${C.primary}`},
  exText:{fontFamily:C.font,fontSize:"clamp(1rem,3.5vw,1.2rem)",color:"#1b4332",fontStyle:"italic",lineHeight:1.5,margin:0},
  sentenceWrap:{padding:"20px 16px",backgroundColor:C.card,borderRadius:C.r,boxShadow:C.shadow,marginBottom:"8px"},
  sentenceText:{fontFamily:C.font,fontSize:"clamp(1rem,3.5vw,1.2rem)",lineHeight:1.7,color:C.text,margin:0,overflowWrap:"break-word"},
  gapContainer:{display:"inline-block",verticalAlign:"baseline"},
  gapInput:{fontFamily:C.font,fontSize:"inherit",fontWeight:"600",color:C.primary,border:"none",borderBottom:`2px solid ${C.primary}`,background:"transparent",outline:"none",width:"5em",textAlign:"center",padding:"2px 4px",caretColor:C.primary},
  gapAnswered:{fontWeight:"700",fontSize:"inherit",fontFamily:C.font},
  feedbackOk:{marginTop:"12px",fontSize:"0.9rem",color:C.primary,fontWeight:"600"},
  feedbackHalf:{marginTop:"12px",fontSize:"0.9rem",color:"#b8860b",fontWeight:"500"},
  feedbackWrong:{marginTop:"12px",fontSize:"0.9rem",color:C.accent},
  resultTitle:{fontFamily:C.font,fontSize:"1.3rem",fontWeight:"700",margin:"0 0 12px 0"},
  bigPct:{fontSize:"2.8rem",fontWeight:"800",color:C.primary,margin:"0 0 20px 0",fontFamily:C.sans},
  resultRow:{display:"flex",justifyContent:"center",gap:"28px",marginBottom:"24px"},
  resultItem:{display:"flex",flexDirection:"column",alignItems:"center",gap:"2px"},
  resultVal:{fontSize:"1.15rem",fontWeight:"700",display:"flex",alignItems:"center",gap:"3px"},
  resultLbl:{fontSize:"0.72rem",color:C.muted},
  padded:{padding:"16px 16px"},
  screenTitle:{fontFamily:C.font,fontSize:"clamp(1.2rem,4vw,1.5rem)",fontWeight:"700",margin:"0 0 16px 0"},
  tabs:{display:"flex",gap:"0",marginBottom:"16px",borderBottom:`2px solid ${C.border}`},
  tabBtn:{flex:1,padding:"10px",border:"none",background:"none",cursor:"pointer",fontFamily:C.sans,fontSize:"0.9rem",fontWeight:"500",color:C.light,borderBottom:"2px solid transparent",marginBottom:"-2px",transition:"all .15s"},
  tabA:{color:C.primary,borderBottomColor:C.primary,fontWeight:"600"},
  filterRow:{display:"flex",gap:"6px",marginBottom:"10px",flexWrap:"wrap"},
  chip:{padding:"5px 12px",border:`1px solid ${C.border}`,borderRadius:"20px",backgroundColor:C.card,fontSize:"0.82rem",fontWeight:"500",cursor:"pointer",fontFamily:C.sans,color:C.light,minHeight:"32px"},
  chipA:{backgroundColor:C.primary,color:"#fff",borderColor:C.primary},
  vList:{marginBottom:"12px"},
  groupHead:{fontSize:"0.72rem",fontWeight:"700",color:C.primary,letterSpacing:"0.05em",padding:"10px 0 4px 0",borderBottom:`1px solid ${C.border}`,marginBottom:"2px"},
  vRow:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}22`,gap:"8px"},
  vRowInfo:{display:"flex",flexDirection:"column",gap:"1px",flex:1,minWidth:0},
  vRowName:{fontSize:"0.9rem",fontWeight:"600",fontFamily:C.font,overflowWrap:"break-word"},
  vRowTrans:{fontSize:"0.78rem",color:C.muted},
  editInput:{fontSize:"0.85rem",padding:"4px 8px",border:`1px solid ${C.border}`,borderRadius:"4px",fontFamily:C.sans,flex:1,minWidth:"80px"},
  iconBtn:{padding:"6px",border:"none",background:"none",cursor:"pointer",color:C.muted,borderRadius:"4px",display:"flex",alignItems:"center",justifyContent:"center",minWidth:"28px",minHeight:"28px"},
  addCard:{backgroundColor:C.card,borderRadius:C.r,boxShadow:C.shadow,padding:"16px"},
  hint:{fontSize:"0.82rem",color:C.light,margin:"0 0 4px 0",lineHeight:1.4},
  code:{backgroundColor:C.primaryLt,padding:"1px 5px",borderRadius:"3px",fontFamily:"monospace",fontSize:"0.8rem"},
  pre:{fontSize:"0.8rem",color:C.light,backgroundColor:"#f8f6f3",padding:"8px 10px",borderRadius:C.rs,margin:"6px 0 10px 0",fontFamily:"monospace",whiteSpace:"pre-wrap",overflowWrap:"break-word",lineHeight:1.5},
  textarea:{width:"100%",padding:"10px",fontSize:"0.9rem",fontFamily:C.sans,border:`1px solid ${C.border}`,borderRadius:C.rs,resize:"vertical",outline:"none",boxSizing:"border-box",minHeight:"80px",backgroundColor:"#fcfaf8"},
  statusLog:{marginTop:"12px",display:"flex",flexDirection:"column",gap:"4px"},
  statusRow:{display:"flex",alignItems:"flex-start",gap:"8px",padding:"6px 8px",backgroundColor:"#f9f7f4",borderRadius:"6px",fontSize:"0.84rem",lineHeight:1.4},
  statusIcon:{fontWeight:"700",fontSize:"0.9rem",flexShrink:0,width:"16px",textAlign:"center"},
  statusLabel:{fontWeight:"600",color:C.text,fontFamily:C.font,minWidth:0,overflowWrap:"break-word"},
  statusMsg:{color:C.light,marginLeft:"auto",flexShrink:0,textAlign:"right",fontSize:"0.8rem"},
  statsGrid:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"20px"},
  statBox:{textAlign:"center",padding:"14px 6px",backgroundColor:C.card,borderRadius:C.rs,boxShadow:C.shadow},
  statNum:{fontSize:"1.5rem",fontWeight:"800",color:C.primary,fontFamily:C.sans},
  statLbl:{fontSize:"0.68rem",color:C.muted,marginTop:"2px"},
  section:{marginBottom:"20px"},secTitle:{fontFamily:C.font,fontSize:"0.95rem",fontWeight:"600",margin:"0 0 10px 0"},
  hardRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",backgroundColor:C.card,borderRadius:C.rs,marginBottom:"4px",gap:"8px",flexWrap:"wrap"},
  hardName:{fontSize:"0.88rem",fontWeight:"600",fontFamily:C.font},hardStats:{fontSize:"0.78rem",color:C.muted},
  sessRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",backgroundColor:C.card,borderRadius:C.rs,marginBottom:"4px",gap:"8px",flexWrap:"wrap"},
  sessDate:{fontSize:"0.82rem",color:C.light},sessResult:{fontSize:"0.82rem",fontWeight:"600",display:"flex",alignItems:"center",gap:"3px"},
  muted:{fontSize:"0.85rem",color:C.muted,fontStyle:"italic"},
  refPrepHead:{fontSize:"0.85rem",fontWeight:"700",color:"#fff",backgroundColor:C.primary,padding:"8px 14px",borderRadius:`${C.rs} ${C.rs} 0 0`,letterSpacing:"0.05em"},
  refTable:{backgroundColor:C.card,borderRadius:`0 0 ${C.rs} ${C.rs}`,boxShadow:C.shadow,overflow:"hidden"},
  refRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:`1px solid ${C.border}33`,gap:"12px",flexWrap:"wrap"},
  refVerb:{fontSize:"0.9rem",fontWeight:"600",fontFamily:C.font},refTrans:{fontSize:"0.82rem",color:C.light},
  settingsGroup:{display:"flex",flexDirection:"column",gap:"3px"},
  setRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px",backgroundColor:C.card,borderRadius:C.rs,gap:"14px"},
  setLabel:{fontSize:"0.92rem",fontWeight:"600"},setHint:{fontSize:"0.78rem",color:C.muted,marginTop:"1px"},
  select:{padding:"7px 10px",fontSize:"0.9rem",border:`1px solid ${C.border}`,borderRadius:C.rs,backgroundColor:C.card,fontFamily:C.sans,minHeight:"36px",color:C.text},
  toggle:{width:"48px",height:"26px",borderRadius:"13px",border:"none",cursor:"pointer",position:"relative",transition:"background-color .2s",flexShrink:0,padding:0},
  toggleKnob:{width:"22px",height:"22px",borderRadius:"50%",backgroundColor:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.2)",transition:"transform .2s",position:"absolute",top:"2px"},
};
