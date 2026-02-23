import { useState, useEffect, useCallback, useRef } from "react";

// ─── Initial Verb Database with gap-marked examples ───
// Format: {contraction} marks where the preposition/contraction goes
// The word inside braces is the CORRECT contraction form
const INITIAL_VERBS = [
  // ── A ──
  { verb: "adaptar-se", preposition: "a", translation: "приспособиться к", examples: [
    "O Peter adaptou-se facilmente {à} vida de Lisboa.",
    "Tens de te adaptar {ao} novo horário de trabalho.",
    "Ela ainda não se adaptou {ao} clima português.",
  ]},
  { verb: "agarrar-se", preposition: "a", translation: "схватиться за", examples: [
    "Agarrou-se {ao} braço dele para não escorregar.",
    "O miúdo agarrou-se {à} mãe quando viu o cão.",
    "Agarra-te {a} esta oportunidade, não a percas.",
  ]},
  { verb: "incentivar", preposition: "a", translation: "побуждать к", examples: [
    "A minha mãe sempre me incentivou {a} lutar pelos meus sonhos.",
    "O professor incentivou os alunos {a} participar no debate.",
    "Ninguém me incentivou {a} seguir esta carreira.",
  ]},
  { verb: "oferecer", preposition: "a", translation: "подарить / предложить", examples: [
    "Ofereceste alguma coisa {aos} teus pais no Natal?",
    "Quero oferecer um livro {à} minha avó.",
    "Ofereceram um bolo {ao} vizinho que se mudou.",
  ]},
  { verb: "pertencer", preposition: "a", translation: "принадлежать", examples: [
    "Ela pertence {a} uma organização de solidariedade.",
    "Este terreno pertence {ao} município.",
    "A quem pertence este guarda-chuva?",
  ]},
  { verb: "referir-se", preposition: "a", translation: "ссылаться на", examples: [
    "Eles referiram-se {ao} teu trabalho com elogios.",
    "A que é que te referes exatamente?",
    "O artigo refere-se {a} um estudo recente.",
  ]},
  { verb: "habituar-se", preposition: "a", translation: "привыкнуть к", examples: [
    "Já me habituei {ao} trânsito de Lisboa.",
    "Não me consigo habituar {a} acordar tão cedo.",
    "Habituámo-nos {ao} barulho dos vizinhos.",
  ]},
  // ── COM ──
  { verb: "aborrecer-se", preposition: "com", translation: "раздражаться из-за", examples: [
    "Aborreci-me {com} o miúdo por fazer barulho.",
    "Não te aborreças {com} coisas sem importância.",
    "Ela aborreceu-se {com} o atraso do comboio.",
  ]},
  { verb: "casar-se", preposition: "com", translation: "жениться / выйти замуж за", examples: [
    "A Ana casou-se {com} o meu irmão.",
    "Quando é que te casas {com} a Inês?",
    "Ele casou-se {com} uma colega de trabalho.",
  ]},
  { verb: "embirrar", preposition: "com", translation: "придираться к", examples: [
    "Ela embirra {com} os vizinhos do lado.",
    "Porque é que embirras sempre {comigo}?",
    "O chefe embirra {com} tudo o que eu faço.",
  ]},
  { verb: "preocupar-se", preposition: "com", translation: "беспокоиться о", examples: [
    "Não te preocupes tanto {com} o dinheiro.",
    "Preocupo-me {com} a saúde da minha mãe.",
    "Eles nunca se preocupam {com} os outros.",
  ]},
  { verb: "sonhar", preposition: "com", translation: "мечтать о", examples: [
    "Sonho {contigo} muitas vezes.",
    "Ela sonha {com} uma casa no campo.",
    "Ontem sonhei {com} o meu avô.",
  ]},
  { verb: "zangar-se", preposition: "com", translation: "рассердиться на", examples: [
    "Zangou-se {com} ela por chegar tão tarde a casa.",
    "Não te zangues {comigo}, eu não tive culpa.",
    "A professora zangou-se {com} os alunos.",
  ]},
  // ── DE ──
  { verb: "aproximar-se", preposition: "de", translation: "приближаться к", examples: [
    "Não te aproximes {do} cão.",
    "Aproximei-me {dela} para falar mais baixo.",
    "O Natal está a aproximar-se {de} nós.",
  ]},
  { verb: "cuidar", preposition: "de", translation: "заботиться о", examples: [
    "A minha mãe cuida muito bem {de} nós.",
    "Quem cuida {do} teu gato quando viajas?",
    "Tens de cuidar {de} ti primeiro.",
  ]},
  { verb: "despedir-se", preposition: "de", translation: "попрощаться с", examples: [
    "Não me despedi {dele} quando viajou.",
    "Despede-te {dos} teus colegas antes de ires embora.",
    "Ela despediu-se {de} todos com um abraço.",
  ]},
  { verb: "esquecer-se", preposition: "de", translation: "забыть о", examples: [
    "Esqueci-me {de} te telefonar.",
    "Nunca me esqueço {do} teu aniversário.",
    "Esqueceste-te {de} fechar a porta?",
  ]},
  { verb: "lembrar-se", preposition: "de", translation: "вспомнить о", examples: [
    "Lembras-te {do} meu aniversário?",
    "Não me lembro {do} nome dele.",
    "Lembrei-me {de} uma coisa importante.",
  ]},
  { verb: "precisar", preposition: "de", translation: "нуждаться в", examples: [
    "Preciso {de} comprar uns sapatos.",
    "Precisas {de} ajuda com alguma coisa?",
    "Ela não precisa {de} ninguém.",
  ]},
  // ── EM ──
  { verb: "acreditar", preposition: "em", translation: "верить в", examples: [
    "Acreditas {em} tudo o que ela diz.",
    "Eu acredito {em} ti, vai correr bem.",
    "Já não acredito {em} milagres.",
  ]},
  { verb: "basear-se", preposition: "em", translation: "основываться на", examples: [
    "O filme baseia-se {no} livro.",
    "Em que te baseias para dizer isso?",
    "A decisão baseou-se {nos} dados disponíveis.",
  ]},
  { verb: "confiar", preposition: "em", translation: "доверять", examples: [
    "Confio {nele} para a função de diretor.",
    "Podes confiar {em} mim, não conto a ninguém.",
    "Ela não confia {nos} políticos.",
  ]},
  { verb: "especializar-se", preposition: "em", translation: "специализироваться в", examples: [
    "Ela especializou-se {em} Medicina Molecular.",
    "Quero especializar-me {em} direito fiscal.",
    "Ele especializou-se {em} cozinha portuguesa.",
  ]},
  { verb: "permanecer", preposition: "em", translation: "оставаться в", examples: [
    "Devemos permanecer {em} casa durante a quarentena.",
    "O Pedro permaneceu {em} silêncio durante a reunião.",
    "Vou permanecer {em} Lisboa até ao fim do mês.",
  ]},
  { verb: "transformar", preposition: "em", translation: "превращать в", examples: [
    "Ele transforma o barro {em} obras-primas.",
    "Transformaram o armazém {num} restaurante.",
    "A chuva transformou as ruas {em} rios.",
  ]},
  // ── POR ──
  { verb: "apaixonar-se", preposition: "por", translation: "влюбиться в", examples: [
    "A Ana e o João apaixonaram-se um {pelo} outro.",
    "Apaixonei-me {por} Lisboa logo na primeira visita.",
    "Ela apaixonou-se {por} um colega de faculdade.",
  ]},
  { verb: "criticar", preposition: "por", translation: "критиковать за", examples: [
    "Ele criticou-a {pelos} gastos excessivos.",
    "Não me critiques {por} ter tentado.",
    "Foram criticados {pela} falta de organização.",
  ]},
  { verb: "culpar", preposition: "por", translation: "обвинять в / за", examples: [
    "Ele foi culpado {pelo} acidente.",
    "Não me culpes {por} isso, não fui eu.",
    "Culparam-no {pela} perda do contrato.",
  ]},
  { verb: "esperar", preposition: "por", translation: "ждать", examples: [
    "Espera {por} mim à porta do restaurante.",
    "Estou a esperar {por} uma resposta do médico.",
    "Não esperes {por} ele, vamos embora.",
  ]},
  { verb: "interessar-se", preposition: "por", translation: "интересоваться", examples: [
    "Interesso-me {por} pintura renascentista.",
    "Ela interessa-se {por} história de Portugal.",
    "Nunca me interessei {por} futebol.",
  ]},
  { verb: "recear", preposition: "por", translation: "опасаться за", examples: [
    "Eles receiam {pela} saúde do filho.",
    "Receio {pelo} futuro do nosso planeta.",
    "A mãe receia {pela} segurança dos filhos.",
  ]},
];

const PREPOSITIONS = ["a", "com", "de", "em", "por"];

// Accepted forms for each preposition
const ACCEPTED_FORMS = {
  a: ["a", "à", "ao", "aos", "às"],
  com: ["com", "comigo", "contigo", "consigo", "connosco", "convosco"],
  de: ["de", "do", "da", "dos", "das", "dele", "dela", "deles", "delas", "deste", "desta", "disto", "desse", "dessa", "disso", "daquele", "daquela", "daquilo", "dum", "duma", "duns", "dumas"],
  em: ["em", "no", "na", "nos", "nas", "nele", "nela", "neles", "nelas", "neste", "nesta", "nisto", "nesse", "nessa", "nisso", "naquele", "naquela", "naquilo", "num", "numa", "nuns", "numas"],
  por: ["por", "pelo", "pela", "pelos", "pelas"],
};

const CONTRACTIONS = {
  a: new Set(["à", "ao", "aos", "às"]),
  com: new Set(["comigo", "contigo", "consigo", "connosco", "convosco"]),
  de: new Set(["do", "da", "dos", "das", "dele", "dela", "deles", "delas", "deste", "desta", "disto", "desse", "dessa", "disso", "daquele", "daquela", "daquilo", "dum", "duma", "duns", "dumas"]),
  em: new Set(["no", "na", "nos", "nas", "nele", "nela", "neles", "nelas", "neste", "nesta", "nisto", "nesse", "nessa", "nisso", "naquele", "naquela", "naquilo", "num", "numa", "nuns", "numas"]),
  por: new Set(["pelo", "pela", "pelos", "pelas"]),
};

function checkAnswer(input, correctWord, basePrep) {
  const n = input.trim().toLowerCase();
  const correct = correctWord.toLowerCase();
  if (n === correct) return "exact"; // exact match = full point
  const isContraction = CONTRACTIONS[basePrep]?.has(correct);
  if (n === basePrep && isContraction) return "half"; // gave base prep where contraction needed
  if (ACCEPTED_FORMS[basePrep]?.includes(n)) return "accepted"; // another valid form of the preposition
  return "wrong";
}

// Parse example: split on first {word} occurrence, clean any remaining markers
function parseExample(ex) {
  const m = ex.match(/^(.*?)\{([^}]+)\}(.*)$/);
  if (!m) return null;
  // Clean any remaining {word} markers in before/after (show as plain text)
  const clean = (s) => s.replace(/\{([^}]+)\}/g, "$1");
  return { before: clean(m[1]), answer: m[2], after: clean(m[3]) };
}

// Find a usable example (one with a gap) for a verb
function pickGapExample(verb) {
  const examples = verb.examples || [];
  const usable = examples.map(parseExample).filter(Boolean);
  if (usable.length === 0) return null;
  return usable[Math.floor(Math.random() * usable.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Storage helpers (localStorage for standalone deployment) ───
async function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
async function saveStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error("Storage:", e); }
}

// ─── Validate verb+preposition via API ───
async function validateVerb(verb, preposition) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `Does the European Portuguese verb "${verb}" exist and is it commonly used with the preposition "${preposition}" in its regência verbal? Answer ONLY with a JSON object, no markdown:
{"valid": true/false, "reason": "brief explanation in Russian if invalid"}
Examples of valid: "depender de", "gostar de", "acreditar em", "sonhar com"
Examples of invalid: "comer de" (comer is not used with de in regência), "blargh com" (not a real verb)`
        }]
      })
    });
    const data = await response.json();
    const text = data.content?.map(c => c.text || "").join("").trim();
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error("Validation failed:", e);
    return { valid: true, reason: "" }; // fail open
  }
}

// ─── Generate examples via API ───
async function generateExamples(verb, preposition) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Generate exactly 3 example sentences in European Portuguese (PE only, never Brazilian) for "${verb} ${preposition}".

CRITICAL FORMAT: Mark the preposition/contraction with curly braces {word}. The word inside braces must be the CORRECT form used in that sentence (including contractions like {ao}, {do}, {no}, {pelo}, {à}, {num}, {nele}, etc.).

Rules:
- Novo Acordo Ortográfico 2009
- Natural EP sentences, everyday life in Portugal
- A2-B1 level
- Common Portuguese names (João, Maria, Ana, Pedro, Inês, Tiago)
- Use estar a + infinitive (NOT gerund)
- Each sentence must contain exactly one {contraction} marker
- Respond ONLY with a JSON array of 3 strings, no markdown

Example for "apaixonar-se por":
["A Ana apaixonou-se {pelo} colega.", "Apaixonei-me {por} esta cidade.", "Eles apaixonaram-se um {pelo} outro."]`
        }]
      })
    });
    const data = await response.json();
    const text = data.content?.map(c => c.text || "").join("").trim();
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.error("API generation failed:", e);
    return [`Exemplo {${preposition}} gerado automaticamente.`];
  }
}

function formatSessionDate(iso) {
  const d = new Date(iso);
  const days = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}, ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

// ─── Icons ───
const Icon = ({ d, size = 20 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
const IconPlay = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IconBook = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IconChart = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IconSettings = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconRef = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconFire = () => <span style={{fontSize:"1.1em"}}>🔥</span>;

// ─── Main App ───
export default function App() {
  const [screen, setScreen] = useState("game");
  const [verbs, setVerbs] = useState(INITIAL_VERBS);
  const [stats, setStats] = useState({});
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState({
    questionsPerSession: 15,
    showTimer: false,
    onlyHard: false,
    showExampleAfter: true,
    enableFreeInput: true,
    showTranslationAfter: false,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const sv = await loadStorage("verbs-database-v2", null);
      const ss = await loadStorage("verb-stats-v2", {});
      const sh = await loadStorage("session-history-v2", []);
      const se = await loadStorage("game-settings-v2", null);
      if (sv) setVerbs(sv);
      if (ss) setStats(ss);
      if (sh) setSessions(sh);
      if (se) setSettings(s => ({ ...s, ...se }));
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) saveStorage("verbs-database-v2", verbs); }, [verbs, loaded]);
  useEffect(() => { if (loaded) saveStorage("verb-stats-v2", stats); }, [stats, loaded]);
  useEffect(() => { if (loaded) saveStorage("session-history-v2", sessions); }, [sessions, loaded]);
  useEffect(() => { if (loaded) saveStorage("game-settings-v2", settings); }, [settings, loaded]);

  const addVerbs = async (newVerbs, onStatus) => {
    const enriched = [];
    const results = [];
    for (const v of newVerbs) {
      const label = `${v.verb} ${v.preposition}`;
      const exists = verbs.find(ev => ev.verb === v.verb && ev.preposition === v.preposition);
      if (exists) {
        results.push({ label, status: "duplicate" });
        if (onStatus) onStatus(results);
        continue;
      }
      // Validate
      if (onStatus) onStatus([...results, { label, status: "validating" }]);
      const validation = await validateVerb(v.verb, v.preposition);
      if (!validation.valid) {
        results.push({ label, status: "invalid", reason: validation.reason });
        if (onStatus) onStatus(results);
        continue;
      }
      // Generate examples
      if (onStatus) onStatus([...results, { label, status: "generating" }]);
      const examples = await generateExamples(v.verb, v.preposition);
      enriched.push({ ...v, examples });
      results.push({ label, status: "added" });
      if (onStatus) onStatus(results);
    }
    if (enriched.length > 0) setVerbs(prev => [...prev, ...enriched].sort((a, b) => a.verb.localeCompare(b.verb, "pt")));
    return results;
  };

  const removeVerb = (verb, prep) => {
    setVerbs(prev => prev.filter(v => !(v.verb === verb && v.preposition === prep)).sort((a, b) => a.verb.localeCompare(b.verb, "pt")));
    setStats(prev => { const n = { ...prev }; delete n[`${verb} ${prep}`]; return n; });
  };

  const updateTranslation = (verb, prep, newTranslation) => {
    setVerbs(prev => prev.map(v =>
      v.verb === verb && v.preposition === prep ? { ...v, translation: newTranslation } : v
    ));
  };

  const recordAnswer = (verbKey, points) => {
    setStats(prev => {
      const old = prev[verbKey] || { correct: 0, wrong: 0, half: 0, points: 0 };
      if (points >= 1) return { ...prev, [verbKey]: { ...old, correct: old.correct + 1, points: old.points + points } };
      if (points === 0.5) return { ...prev, [verbKey]: { ...old, half: (old.half||0) + 1, points: old.points + 0.5 } };
      return { ...prev, [verbKey]: { ...old, wrong: old.wrong + 1, points: old.points } };
    });
  };

  const saveSession = (session) => setSessions(prev => [session, ...prev].slice(0, 50));

  if (!loaded) return (
    <div style={S.loadWrap}>
      <div style={{textAlign:"center"}}>
        <svg width="80" height="54" viewBox="0 0 80 54" style={{filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.12))"}}>
          <defs>
            <clipPath id="flagClip"><rect width="80" height="54" rx="4"/></clipPath>
          </defs>
          <g clipPath="url(#flagClip)">
            {/* Green stripe */}
            <rect x="0" y="0" width="32" height="54" fill="#006600">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite"/>
            </rect>
            {/* Red stripe */}
            <rect x="32" y="0" width="48" height="54" fill="#FF0000">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite" begin="0.2s"/>
            </rect>
            {/* Shield circle (simplified armillary sphere) */}
            <circle cx="32" cy="27" r="10" fill="#FFCC00" stroke="#006600" strokeWidth="1.2">
              <animate attributeName="r" values="9.5;10.5;9.5" dur="1.8s" repeatCount="indefinite"/>
            </circle>
            {/* Inner shield */}
            <circle cx="32" cy="27" r="6.5" fill="#FFFFFF" stroke="#003399" strokeWidth="1">
              <animate attributeName="r" values="6;7;6" dur="1.8s" repeatCount="indefinite"/>
            </circle>
            {/* Blue dots representing the 5 quinas */}
            <circle cx="32" cy="24" r="1.2" fill="#003399"/>
            <circle cx="29.5" cy="26" r="1.2" fill="#003399"/>
            <circle cx="34.5" cy="26" r="1.2" fill="#003399"/>
            <circle cx="30" cy="29" r="1.2" fill="#003399"/>
            <circle cx="34" cy="29" r="1.2" fill="#003399"/>
          </g>
          {/* Wave animation overlay */}
          <rect x="0" y="0" width="80" height="54" fill="url(#wave)" rx="4">
            <animate attributeName="opacity" values="0;0.08;0" dur="2.4s" repeatCount="indefinite"/>
          </rect>
          <defs>
            <linearGradient id="wave" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff"/><stop offset="50%" stopColor="#fff"/><stop offset="100%" stopColor="transparent"/>
              <animate attributeName="x1" values="-1;1" dur="2.4s" repeatCount="indefinite"/>
              <animate attributeName="x2" values="0;2" dur="2.4s" repeatCount="indefinite"/>
            </linearGradient>
          </defs>
        </svg>
        <p style={{marginTop:"14px",fontSize:"0.9rem",color:C.muted,fontFamily:C.sans}}>A carregar...</p>
      </div>
    </div>
  );

  const screens = { game: "game", database: "database", stats: "stats", reference: "reference", settings: "settings" };

  return (
    <div style={S.app}>
      <div style={S.main}>
        {screen === "game" && <GameScreen verbs={verbs} stats={stats} settings={settings} recordAnswer={recordAnswer} saveSession={saveSession} />}
        {screen === "database" && <DatabaseScreen verbs={verbs} addVerbs={addVerbs} removeVerb={removeVerb} updateTranslation={updateTranslation} />}
        {screen === "stats" && <StatsScreen sessions={sessions} stats={stats} verbs={verbs} />}
        {screen === "reference" && <ReferenceScreen verbs={verbs} />}
        {screen === "settings" && <SettingsScreen settings={settings} setSettings={setSettings} />}
      </div>
      <nav style={S.nav}>
        {[
          { id: "game", icon: <IconPlay />, label: "Jogar" },
          { id: "database", icon: <IconBook />, label: "Verbos" },
          { id: "stats", icon: <IconChart />, label: "Stats" },
          { id: "reference", icon: <IconRef />, label: "Consulta" },
          { id: "settings", icon: <IconSettings />, label: "Opções" },
        ].map(t => (
          <button key={t.id} onClick={() => setScreen(t.id)} style={{...S.navBtn, ...(screen === t.id ? S.navBtnActive : {})}}>
            <span style={screen === t.id ? {color:C.primary} : {color:C.muted}}>{t.icon}</span>
            <span style={{...S.navLbl, ...(screen === t.id ? {color:C.primary, fontWeight:"600"} : {})}}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ═══════════════════════════════════════
// GAME SCREEN
// ═══════════════════════════════════════
function GameScreen({ verbs, stats, settings, recordAnswer, saveSession }) {
  const [phase, setPhase] = useState("ready");
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null); // "exact"|"half"|"accepted"|"wrong"
  const [showTrans, setShowTrans] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const transRef = useRef(null);

  // Enter to continue
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter" && answered && phase === "playing") {
        e.preventDefault();
        nextQ();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [answered, phase, idx, questions.length]);

  const startGame = useCallback(() => {
    let pool = [...verbs];
    if (settings.onlyHard && Object.keys(stats).length > 0) {
      const hard = pool.filter(v => {
        const s = stats[`${v.verb} ${v.preposition}`];
        if (!s || (s.correct + s.wrong + (s.half||0)) < 3) return true;
        return s.wrong / (s.correct + s.wrong + (s.half||0)) > 0.35;
      });
      if (hard.length >= 5) pool = hard;
    }

    const weighted = [];
    for (const v of pool) {
      const s = stats[`${v.verb} ${v.preposition}`];
      const w = s ? Math.max(1, 1 + s.wrong - s.correct * 0.5) : 2;
      for (let i = 0; i < Math.ceil(w); i++) weighted.push(v);
    }

    const selected = [];
    const used = new Set();
    const count = Math.min(settings.questionsPerSession, verbs.length);
    while (selected.length < count) {
      const pick = pickRandom(weighted);
      const key = `${pick.verb} ${pick.preposition}`;
      if (!used.has(key) || selected.length >= pool.length) {
        used.add(key);
        // Decide mode
        let mode = "choice";
        if (settings.enableFreeInput) {
          const gap = pickGapExample(pick);
          if (gap && Math.random() < 0.5) {
            mode = "input";
          }
        }
        const gapData = mode === "input" ? pickGapExample(pick) : null;
        // For example display after choice, pick any example
        const exForDisplay = pickRandom((pick.examples || []).filter(e => parseExample(e)));
        selected.push({ ...pick, mode, gapData, exForDisplay });
      }
    }

    setQuestions(shuffle(selected));
    setIdx(0); setStreak(0); setMaxStreak(0); setScore(0);
    setTotalAnswered(0); setWrongCount(0);
    setAnswered(false); setSelected(null); setResult(null);
    setShowTrans(false); setInputVal(""); setTimer(0);
    setPhase("playing");
  }, [verbs, stats, settings]);

  // Timer
  useEffect(() => {
    if (phase === "playing" && settings.showTimer && !answered) {
      timerRef.current = setInterval(() => setTimer(t => t + 0.1), 100);
      return () => clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, settings.showTimer, answered, idx]);

  // Focus input
  useEffect(() => {
    if (phase === "playing" && questions[idx]?.mode === "input" && !answered) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [idx, phase, answered, questions]);

  const q = questions[idx];

  const handleChoice = (prep) => {
    if (answered) return;
    clearInterval(timerRef.current);
    const correct = prep === q.preposition;
    setAnswered(true);
    setSelected(prep);
    setResult(correct ? "exact" : "wrong");
    setTotalAnswered(a => a + 1);
    if (correct) {
      setScore(s => s + 1);
      setStreak(s => { const n = s + 1; setMaxStreak(m => Math.max(m, n)); return n; });
      recordAnswer(`${q.verb} ${q.preposition}`, 1);
    } else {
      setWrongCount(w => w + 1);
      setStreak(0);
      recordAnswer(`${q.verb} ${q.preposition}`, 0);
    }
  };

  const handleInput = (val) => {
    if (answered || !q.gapData) return;
    clearInterval(timerRef.current);
    const res = checkAnswer(val, q.gapData.answer, q.preposition);
    setAnswered(true);
    setSelected(val.trim().toLowerCase());
    setResult(res);
    setTotalAnswered(a => a + 1);
    if (res === "exact" || res === "accepted") {
      setScore(s => s + 1);
      setStreak(s => { const n = s + 1; setMaxStreak(m => Math.max(m, n)); return n; });
      recordAnswer(`${q.verb} ${q.preposition}`, 1);
    } else if (res === "half") {
      setScore(s => s + 0.5);
      setStreak(s => { const n = s + 1; setMaxStreak(m => Math.max(m, n)); return n; });
      recordAnswer(`${q.verb} ${q.preposition}`, 0.5);
    } else {
      setWrongCount(w => w + 1);
      setStreak(0);
      recordAnswer(`${q.verb} ${q.preposition}`, 0);
    }
  };

  const nextQ = () => {
    if (idx + 1 >= questions.length) {
      saveSession({
        date: new Date().toISOString(),
        total: questions.length,
        score, wrong: wrongCount, maxStreak,
      });
      setPhase("result");
    } else {
      setIdx(i => i + 1);
      setAnswered(false); setSelected(null); setResult(null);
      setShowTrans(false); setInputVal(""); setTimer(0);
    }
  };

  const toggleTrans = () => {
    if (showTrans) return;
    setShowTrans(true);
    clearTimeout(transRef.current);
    transRef.current = setTimeout(() => setShowTrans(false), 3000);
  };
  useEffect(() => () => clearTimeout(transRef.current), []);

  // ── READY ──
  if (phase === "ready") {
    return (
      <div style={S.center}>
        <div style={S.card}>
          <h1 style={S.title}>Verbos com Preposições</h1>
          <p style={S.subtitle}>Тренажёр предложного управления</p>
          <div style={S.readyInfo}>
            <span style={S.infoItem}>{verbs.length} verbos</span>
            <span style={S.dot}>•</span>
            <span style={S.infoItem}>{settings.questionsPerSession} perguntas</span>
          </div>
          {settings.onlyHard && <div style={S.badge}>Modo difícil</div>}
          <button onClick={startGame} style={S.btnPrimary}>Começar</button>
        </div>
      </div>
    );
  }

  // ── RESULT ──
  if (phase === "result") {
    const pct = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
    return (
      <div style={S.center}>
        <div style={S.card}>
          <h2 style={S.resultTitle}>Sessão Concluída!</h2>
          <div style={S.bigPct}>{pct}%</div>
          <div style={S.resultRow}>
            <div style={S.resultItem}><span style={S.resultVal}>{score}</span><span style={S.resultLbl}>pontos</span></div>
            <div style={S.resultItem}><span style={S.resultVal}>{wrongCount}</span><span style={S.resultLbl}>erros</span></div>
            <div style={S.resultItem}><span style={S.resultVal}><IconFire/> {maxStreak}</span><span style={S.resultLbl}>série</span></div>
          </div>
          <button onClick={() => setPhase("ready")} style={S.btnPrimary}>Jogar outra vez</button>
        </div>
      </div>
    );
  }

  // ── PLAYING ──
  return (
    <div style={S.gameWrap}>
      {/* Progress */}
      <div style={S.progBar}><div style={{...S.progFill, width:`${(idx/questions.length)*100}%`}}/></div>
      {/* Header */}
      <div style={S.gameHead}>
        <span style={S.qCount}>{idx+1} / {questions.length}</span>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          {streak > 0 && <span style={S.streakBadge}><IconFire/> {streak}</span>}
          {settings.showTimer && <span style={S.timerBadge}>{timer.toFixed(1)}s</span>}
        </div>
      </div>

      {/* Verb */}
      <div style={S.verbArea}>
        <button onClick={toggleTrans} style={S.verbBtn}>
          {showTrans || (answered && settings.showTranslationAfter)
            ? <span style={S.verbText}><span style={{color:C.primary}}>{q.translation}</span></span>
            : <>
                <span style={S.verbText}>{q.verb}</span>
                <span style={S.infoIcon} title="Ver tradução">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </span>
              </>}
        </button>
        {!answered && !showTrans && <p style={S.verbHint}>toca para ver a tradução</p>}
      </div>

      {/* Answer area */}
      {q.mode === "choice" ? (
        <>
          <div style={S.choiceGrid}>
            {PREPOSITIONS.map(p => {
              let st = S.choiceBtn;
              if (answered) {
                if (p === q.preposition) st = {...st, ...(result !== "wrong" ? S.choiceOk : S.choiceReveal)};
                else if (p === selected && result === "wrong") st = {...st, ...S.choiceErr};
                else st = {...st, opacity: 0.35};
              }
              return <button key={p} onClick={() => handleChoice(p)} disabled={answered} style={st}>{p}</button>;
            })}
          </div>
          {answered && settings.showExampleAfter && q.exForDisplay && (() => {
            const parsed = parseExample(q.exForDisplay);
            if (!parsed) return null;
            return (
              <div style={S.exBox}>
                <p style={S.exText}>{parsed.before}<strong style={{color:C.primary}}>{parsed.answer}</strong>{parsed.after}</p>
              </div>
            );
          })()}
        </>
      ) : (
        <>
          {/* Inline input in sentence context */}
          {q.gapData && (
            <div style={S.sentenceWrap}>
              <p style={S.sentenceText}>
                {q.gapData.before}
                <span style={S.gapContainer}>
                  {answered ? (
                    <span style={{
                      ...S.gapAnswered,
                      color: result === "wrong" ? C.accent : result === "half" ? "#b8860b" : C.primary,
                      textDecoration: result === "wrong" ? "line-through" : "none",
                    }}>{inputVal || selected}</span>
                  ) : (
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputVal}
                      onChange={e => setInputVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && inputVal.trim()) {
                          e.preventDefault();
                          handleInput(inputVal);
                        }
                      }}
                      style={S.gapInput}
                      autoCapitalize="none" autoCorrect="off" spellCheck="false" lang="pt"
                      placeholder="..."
                    />
                  )}
                </span>
                {q.gapData.after}
              </p>

              {/* Feedback */}
              {answered && result === "half" && (
                <p style={S.feedbackHalf}>½ ponto — forma correta: <strong>{q.gapData.answer}</strong></p>
              )}
              {answered && result === "wrong" && (
                <p style={S.feedbackWrong}>Resposta correta: <strong>{q.gapData.answer}</strong></p>
              )}
              {answered && (result === "exact" || result === "accepted") && (
                <p style={S.feedbackOk}>✓ Correto!</p>
              )}
            </div>
          )}
          {!answered && inputVal.trim() && (
            <button onClick={() => handleInput(inputVal)} style={S.btnCheck}>Verificar</button>
          )}
        </>
      )}

      {/* Next */}
      {answered && (
        <button onClick={nextQ} style={S.btnNext}>
          {idx + 1 >= questions.length ? "Ver resultado" : "Seguinte"} <span style={{opacity:0.5,fontSize:"0.8em",marginLeft:"6px"}}>↵</span>
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// DATABASE SCREEN
// ═══════════════════════════════════════
function DatabaseScreen({ verbs, addVerbs, removeVerb, updateTranslation }) {
  const [tab, setTab] = useState("list");
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [statusLog, setStatusLog] = useState([]);
  const [filter, setFilter] = useState("all");
  const [editKey, setEditKey] = useState(null);
  const [editVal, setEditVal] = useState("");

  const handleAdd = async () => {
    if (!input.trim()) return;
    setAdding(true); setStatusLog([]);
    const lines = input.trim().split("\n").filter(Boolean);
    const parsed = [];
    for (const line of lines) {
      const m = line.match(/^(.+?)\s+(a|com|de|em|por)\s*[—–\-]\s*(.+)$/i);
      if (m) {
        parsed.push({ verb: m[1].trim().toLowerCase(), preposition: m[2].trim().toLowerCase(), translation: m[3].trim() });
      } else {
        // Check if it's a line with separator but missing preposition
        const hasSep = line.match(/^(.+?)\s*[—–\-]\s*(.+)$/);
        if (hasSep) {
          setStatusLog(prev => [...prev, { label: line.trim().substring(0, 50), status: "parse_error", reason: "falta a preposição (a/com/de/em/por)" }]);
        } else {
          setStatusLog(prev => [...prev, { label: line.trim().substring(0, 50), status: "parse_error", reason: "formato não reconhecido" }]);
        }
      }
    }
    if (!parsed.length && lines.length > 0) {
      setAdding(false);
      return;
    }
    const results = await addVerbs(parsed, (interim) => setStatusLog(s => {
      // Merge interim with any parse errors already present
      const parseErrors = s.filter(x => x.status === "parse_error");
      return [...parseErrors, ...interim];
    }));
    const parseErrors = statusLog.filter(x => x.status === "parse_error");
    setStatusLog([...parseErrors, ...results]);
    const addedCount = results.filter(r => r.status === "added").length;
    if (addedCount > 0) setInput("");
    setAdding(false);
  };

  const startEdit = (v) => { setEditKey(`${v.verb}|${v.preposition}`); setEditVal(v.translation); };
  const saveEdit = (v) => { updateTranslation(v.verb, v.preposition, editVal); setEditKey(null); };

  const filtered = filter === "all" ? verbs : verbs.filter(v => v.preposition === filter);
  const grouped = {};
  for (const v of filtered) { if (!grouped[v.preposition]) grouped[v.preposition] = []; grouped[v.preposition].push(v); }

  return (
    <div style={S.padded}>
      <h2 style={S.screenTitle}>Base de Verbos</h2>

      {/* Tabs */}
      <div style={S.tabs}>
        <button onClick={() => setTab("list")} style={{...S.tabBtn, ...(tab==="list" ? S.tabActive : {})}}>Lista ({verbs.length})</button>
        <button onClick={() => setTab("add")} style={{...S.tabBtn, ...(tab==="add" ? S.tabActive : {})}}>Adicionar</button>
      </div>

      {tab === "list" && (
        <>
          <div style={S.filterRow}>
            {["all",...PREPOSITIONS].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{...S.chip, ...(filter===f ? S.chipActive : {})}}>{f === "all" ? "todos" : f}</button>
            ))}
          </div>
          <div style={S.vList}>
            {Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([prep, list]) => (
              <div key={prep}>
                <div style={S.groupHead}>{prep.toUpperCase()}</div>
                {list.sort((a,b) => a.verb.localeCompare(b.verb, "pt")).map(v => {
                  const key = `${v.verb}|${v.preposition}`;
                  const editing = editKey === key;
                  return (
                    <div key={key} style={S.vRow}>
                      <div style={S.vRowInfo}>
                        <span style={S.vRowName}>{v.verb} <span style={{color:C.primary,fontWeight:"400"}}>{v.preposition}</span></span>
                        {editing ? (
                          <div style={{display:"flex",gap:"6px",alignItems:"center",marginTop:"4px"}}>
                            <input
                              value={editVal} onChange={e => setEditVal(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && saveEdit(v)}
                              style={S.editInput} autoFocus
                            />
                            <button onClick={() => saveEdit(v)} style={S.iconBtn} title="Guardar"><IconCheck/></button>
                          </div>
                        ) : (
                          <span style={S.vRowTrans}>{v.translation}</span>
                        )}
                      </div>
                      <div style={{display:"flex",gap:"2px",flexShrink:0}}>
                        {!editing && <button onClick={() => startEdit(v)} style={S.iconBtn} title="Editar"><IconEdit/></button>}
                        <button onClick={() => removeVerb(v.verb, v.preposition)} style={S.iconBtn} title="Remover"><IconTrash/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "add" && (
        <div style={S.addCard}>
          <p style={S.hint}>Formato: <code style={S.code}>verbo preposição — tradução</code></p>
          <p style={S.hint}>Um verbo por linha:</p>
          <pre style={S.pre}>{`depender de — зависеть от\nconcordar com — соглашаться с`}</pre>
          <textarea value={input} onChange={e => setInput(e.target.value)} style={S.textarea} rows={5}
            placeholder="depender de — зависеть от" disabled={adding} />
          <button onClick={handleAdd} disabled={adding || !input.trim()}
            style={{...S.btnPrimary, width:"100%", marginTop:"12px", ...(adding || !input.trim() ? {opacity:0.4,cursor:"not-allowed"} : {})}}>
            {adding ? "A processar..." : "Adicionar"}
          </button>
          {statusLog.length > 0 && (
            <div style={S.statusLog}>
              {statusLog.map((item, i) => (
                <div key={i} style={S.statusRow}>
                  <span style={{
                    ...S.statusIcon,
                    color: item.status === "added" ? C.primary
                      : item.status === "duplicate" ? C.gold
                      : item.status === "invalid" ? C.accent
                      : item.status === "validating" || item.status === "generating" ? C.light
                      : C.accent,
                  }}>
                    {item.status === "added" ? "✓"
                      : item.status === "duplicate" ? "⚠"
                      : item.status === "invalid" ? "✗"
                      : item.status === "parse_error" ? "✗"
                      : item.status === "validating" ? "⟳"
                      : item.status === "generating" ? "⟳"
                      : "?"}
                  </span>
                  <span style={S.statusLabel}>{item.label}</span>
                  <span style={S.statusMsg}>
                    {item.status === "added" && "adicionado"}
                    {item.status === "duplicate" && "já existe na base"}
                    {item.status === "invalid" && (item.reason || "regência inválida")}
                    {item.status === "parse_error" && (item.reason || "formato não reconhecido")}
                    {item.status === "validating" && "a verificar..."}
                    {item.status === "generating" && "a gerar exemplos..."}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// STATS SCREEN
// ═══════════════════════════════════════
function StatsScreen({ sessions, stats, verbs }) {
  const totalC = Object.values(stats).reduce((s,v) => s + v.correct, 0);
  const totalW = Object.values(stats).reduce((s,v) => s + v.wrong, 0);
  const totalH = Object.values(stats).reduce((s,v) => s + (v.half||0), 0);
  const total = totalC + totalW + totalH;
  const pct = total > 0 ? Math.round((totalC / total) * 100) : 0;

  const hardVerbs = verbs.map(v => {
    const k = `${v.verb} ${v.preposition}`;
    const s = stats[k];
    if (!s || s.correct + s.wrong + (s.half||0) < 2) return null;
    const errRate = s.wrong / (s.correct + s.wrong + (s.half||0));
    return errRate > 0.3 ? { ...v, ...s, errRate, key: k } : null;
  }).filter(Boolean).sort((a,b) => b.errRate - a.errRate).slice(0, 10);

  return (
    <div style={S.padded}>
      <h2 style={S.screenTitle}>Estatísticas</h2>
      <div style={S.statsGrid}>
        <div style={S.statBox}><div style={S.statNum}>{pct}%</div><div style={S.statLbl}>precisão</div></div>
        <div style={S.statBox}><div style={S.statNum}>{total}</div><div style={S.statLbl}>respostas</div></div>
        <div style={S.statBox}><div style={S.statNum}>{sessions.length}</div><div style={S.statLbl}>sessões</div></div>
      </div>
      {hardVerbs.length > 0 && (
        <div style={S.section}>
          <h3 style={S.secTitle}>Verbos mais difíceis</h3>
          {hardVerbs.map(v => (
            <div key={v.key} style={S.hardRow}>
              <span style={S.hardName}>{v.verb} <span style={{color:C.primary}}>{v.preposition}</span></span>
              <span style={S.hardStats}>{v.correct}✓ {v.half||0}½ {v.wrong}✗</span>
            </div>
          ))}
        </div>
      )}
      <div style={S.section}>
        <h3 style={S.secTitle}>Histórico</h3>
        {sessions.length === 0 ? <p style={S.muted}>Ainda sem sessões.</p> : sessions.map((s,i) => (
          <div key={i} style={S.sessRow}>
            <span style={S.sessDate}>{formatSessionDate(s.date)}</span>
            <span style={S.sessResult}>{s.score}/{s.total} {s.maxStreak > 1 && <><IconFire/> {s.maxStreak}</>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// REFERENCE SCREEN
// ═══════════════════════════════════════
function ReferenceScreen({ verbs }) {
  const grouped = {};
  for (const v of verbs) { if (!grouped[v.preposition]) grouped[v.preposition] = []; grouped[v.preposition].push(v); }

  return (
    <div style={S.padded}>
      <h2 style={S.screenTitle}>Справка: Verbos com Preposições</h2>
      <p style={{fontSize:"0.85rem",color:C.light,marginBottom:"16px"}}>Todos os verbos com regência da tua base</p>
      {PREPOSITIONS.map(prep => {
        const list = grouped[prep];
        if (!list || !list.length) return null;
        return (
          <div key={prep} style={{marginBottom:"20px"}}>
            <div style={S.refPrepHead}>{prep.toUpperCase()}</div>
            <div style={S.refTable}>
              {list.sort((a,b) => a.verb.localeCompare(b.verb)).map(v => (
                <div key={`${v.verb}-${v.preposition}`} style={S.refRow}>
                  <span style={S.refVerb}>{v.verb} <span style={{color:C.primary}}>{v.preposition}</span></span>
                  <span style={S.refTrans}>{v.translation}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════
// SETTINGS SCREEN
// ═══════════════════════════════════════
function SettingsScreen({ settings, setSettings }) {
  const u = (k, v) => setSettings(s => ({ ...s, [k]: v }));
  return (
    <div style={S.padded}>
      <h2 style={S.screenTitle}>Definições</h2>
      <div style={S.settingsGroup}>
        <SettingRow label="Perguntas por sessão" hint="Quantos verbos treinar por ronda">
          <select value={settings.questionsPerSession} onChange={e => u("questionsPerSession", Number(e.target.value))} style={S.select}>
            {[5,10,15,20,25,30].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Escrita livre" hint="Ativar o modo de introdução da preposição na frase">
          <Toggle value={settings.enableFreeInput} onChange={v => u("enableFreeInput", v)} />
        </SettingRow>
        <SettingRow label="Temporizador" hint="Mostra o tempo de cada resposta">
          <Toggle value={settings.showTimer} onChange={v => u("showTimer", v)} />
        </SettingRow>
        <SettingRow label="Apenas difíceis" hint="Treinar só verbos com mais erros">
          <Toggle value={settings.onlyHard} onChange={v => u("onlyHard", v)} />
        </SettingRow>
        <SettingRow label="Mostrar exemplo" hint="Frase de exemplo após resposta (modo escolha)">
          <Toggle value={settings.showExampleAfter} onChange={v => u("showExampleAfter", v)} />
        </SettingRow>
        <SettingRow label="Tradução após resposta" hint="Mostrar a tradução do verbo após responder">
          <Toggle value={settings.showTranslationAfter} onChange={v => u("showTranslationAfter", v)} />
        </SettingRow>
      </div>
    </div>
  );
}

function SettingRow({ label, hint, children }) {
  return (
    <div style={S.setRow}>
      <div style={{flex:1,minWidth:0}}>
        <div style={S.setLabel}>{label}</div>
        <div style={S.setHint}>{hint}</div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{...S.toggle, backgroundColor: value ? C.primary : "#ccc"}}>
      <div style={{...S.toggleKnob, transform: value ? "translateX(22px)" : "translateX(2px)"}} />
    </button>
  );
}

// ═══════════════════════════════════════
// COLORS & STYLES
// ═══════════════════════════════════════
const C = {
  bg: "#f5f0eb", card: "#ffffff", primary: "#2d6a4f", primaryLt: "#d8f3dc",
  accent: "#c44536", accentLt: "#fce4e1", gold: "#e09f3e", goldLt: "#fdf0d5",
  text: "#1b1b1b", light: "#5c5c5c", muted: "#9a9a9a", border: "#e8e2dc",
  shadow: "0 2px 12px rgba(0,0,0,0.06)", r: "12px", rs: "8px",
  font: "'Source Serif 4','Lora',Georgia,serif",
  sans: "'DM Sans','Nunito',-apple-system,sans-serif",
};

const S = {
  app: { fontFamily:C.sans, backgroundColor:C.bg, color:C.text, minHeight:"100vh", display:"flex", flexDirection:"column", maxWidth:"600px", margin:"0 auto", position:"relative" },
  main: { flex:1, paddingBottom:"72px", overflowY:"auto" },
  loadWrap: { display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", fontFamily:C.sans, backgroundColor:C.bg },
  loadText: { fontSize:"1rem", color:C.light },
  nav: { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:"600px", display:"flex", backgroundColor:C.card, borderTop:`1px solid ${C.border}`, boxShadow:"0 -2px 10px rgba(0,0,0,0.04)", zIndex:100 },
  navBtn: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"1px", padding:"8px 2px", border:"none", background:"none", cursor:"pointer", minHeight:"52px" },
  navBtnActive: {},
  navLbl: { fontSize:"0.65rem", fontWeight:"500", color:C.muted },

  // Common
  center: { display:"flex", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 72px)", padding:"24px 16px" },
  card: { textAlign:"center", padding:"36px 24px", backgroundColor:C.card, borderRadius:C.r, boxShadow:C.shadow, width:"100%", maxWidth:"420px" },
  title: { fontFamily:C.font, fontSize:"clamp(1.4rem,5vw,1.9rem)", fontWeight:"700", margin:"0 0 6px 0", lineHeight:1.2 },
  subtitle: { fontSize:"0.9rem", color:C.light, margin:"0 0 20px 0" },
  readyInfo: { display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginBottom:"20px" },
  infoItem: { fontSize:"0.85rem", color:C.muted },
  dot: { color:C.muted },
  badge: { display:"inline-block", padding:"4px 14px", backgroundColor:C.accentLt, color:C.accent, borderRadius:"20px", fontSize:"0.8rem", fontWeight:"600", marginBottom:"16px" },
  btnPrimary: { padding:"14px 44px", backgroundColor:C.primary, color:"#fff", border:"none", borderRadius:C.rs, fontSize:"1rem", fontWeight:"600", cursor:"pointer", fontFamily:C.sans, minHeight:"48px", transition:"opacity .15s" },
  btnCheck: { display:"block", margin:"12px auto 0", padding:"12px 36px", backgroundColor:C.primary, color:"#fff", border:"none", borderRadius:C.rs, fontSize:"0.95rem", fontWeight:"600", cursor:"pointer", fontFamily:C.sans, minHeight:"44px" },
  btnNext: { width:"100%", padding:"14px", backgroundColor:C.text, color:"#fff", border:"none", borderRadius:C.rs, fontSize:"1rem", fontWeight:"600", cursor:"pointer", fontFamily:C.sans, minHeight:"48px", marginTop:"16px", display:"flex", alignItems:"center", justifyContent:"center" },

  // Game
  gameWrap: { padding:"12px 16px", maxWidth:"500px", margin:"0 auto", width:"100%" },
  progBar: { height:"4px", backgroundColor:C.border, borderRadius:"2px", overflow:"hidden", marginBottom:"14px" },
  progFill: { height:"100%", backgroundColor:C.primary, transition:"width .3s ease", borderRadius:"2px" },
  gameHead: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" },
  qCount: { fontSize:"0.85rem", color:C.muted, fontWeight:"500" },
  streakBadge: { display:"inline-flex", alignItems:"center", gap:"3px", padding:"3px 10px", backgroundColor:C.goldLt, borderRadius:"20px", fontSize:"0.82rem", fontWeight:"600", color:"#8a6914" },
  timerBadge: { fontSize:"0.82rem", color:C.muted, fontVariantNumeric:"tabular-nums" },
  verbArea: { textAlign:"center", marginBottom:"28px" },
  verbBtn: { background:"none", border:"none", cursor:"pointer", padding:"12px 20px", borderRadius:C.rs, display:"flex", alignItems:"center", justifyContent:"center", width:"100%", minHeight:"56px", gap:"8px" },
  verbText: { fontFamily:C.font, fontSize:"clamp(1.5rem,6vw,2.1rem)", fontWeight:"700", color:C.text, overflowWrap:"break-word" },
  infoIcon: { color:C.muted, flexShrink:0, display:"flex", alignItems:"center", opacity:0.5 },
  verbHint: { fontSize:"0.72rem", color:C.muted, marginTop:"2px" },

  // Choices
  choiceGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"16px" },
  choiceBtn: { padding:"14px", backgroundColor:C.card, border:`2px solid ${C.border}`, borderRadius:C.rs, fontSize:"1.1rem", fontWeight:"600", fontFamily:C.font, cursor:"pointer", transition:"all .15s", minHeight:"50px", color:C.text },
  choiceOk: { backgroundColor:"#d4edda", borderColor:"#2d6a4f", color:"#155724" },
  choiceErr: { backgroundColor:"#f8d7da", borderColor:"#c44536", color:"#721c24" },
  choiceReveal: { backgroundColor:C.goldLt, borderColor:C.gold, color:"#8a6914" },
  exBox: { padding:"12px 14px", backgroundColor:C.primaryLt, borderRadius:C.rs, marginBottom:"4px", borderLeft:`3px solid ${C.primary}` },
  exText: { fontFamily:C.font, fontSize:"clamp(1rem,3.5vw,1.2rem)", color:"#1b4332", fontStyle:"italic", lineHeight:1.5, margin:0 },

  // Inline input
  sentenceWrap: { padding:"20px 16px", backgroundColor:C.card, borderRadius:C.r, boxShadow:C.shadow, marginBottom:"8px" },
  sentenceText: { fontFamily:C.font, fontSize:"clamp(1rem,3.5vw,1.2rem)", lineHeight:1.7, color:C.text, margin:0, overflowWrap:"break-word" },
  gapContainer: { display:"inline-block", verticalAlign:"baseline" },
  gapInput: {
    fontFamily:C.font, fontSize:"inherit", fontWeight:"600", color:C.primary,
    border:"none", borderBottom:`2px solid ${C.primary}`, background:"transparent",
    outline:"none", width:"5em", textAlign:"center", padding:"2px 4px",
    caretColor: C.primary,
  },
  gapAnswered: { fontWeight:"700", fontSize:"inherit", fontFamily:C.font },
  feedbackOk: { marginTop:"12px", fontSize:"0.9rem", color:C.primary, fontWeight:"600" },
  feedbackHalf: { marginTop:"12px", fontSize:"0.9rem", color:"#b8860b", fontWeight:"500" },
  feedbackWrong: { marginTop:"12px", fontSize:"0.9rem", color:C.accent },

  // Result
  resultTitle: { fontFamily:C.font, fontSize:"1.3rem", fontWeight:"700", margin:"0 0 12px 0" },
  bigPct: { fontSize:"2.8rem", fontWeight:"800", color:C.primary, margin:"0 0 20px 0", fontFamily:C.sans },
  resultRow: { display:"flex", justifyContent:"center", gap:"28px", marginBottom:"24px" },
  resultItem: { display:"flex", flexDirection:"column", alignItems:"center", gap:"2px" },
  resultVal: { fontSize:"1.15rem", fontWeight:"700", display:"flex", alignItems:"center", gap:"3px" },
  resultLbl: { fontSize:"0.72rem", color:C.muted },

  // Database
  padded: { padding:"16px 16px" },
  screenTitle: { fontFamily:C.font, fontSize:"clamp(1.2rem,4vw,1.5rem)", fontWeight:"700", margin:"0 0 16px 0" },
  tabs: { display:"flex", gap:"0", marginBottom:"16px", borderBottom:`2px solid ${C.border}` },
  tabBtn: { flex:1, padding:"10px", border:"none", background:"none", cursor:"pointer", fontFamily:C.sans, fontSize:"0.9rem", fontWeight:"500", color:C.light, borderBottom:"2px solid transparent", marginBottom:"-2px", transition:"all .15s" },
  tabActive: { color:C.primary, borderBottomColor:C.primary, fontWeight:"600" },
  filterRow: { display:"flex", gap:"6px", marginBottom:"14px", flexWrap:"wrap" },
  chip: { padding:"5px 12px", border:`1px solid ${C.border}`, borderRadius:"20px", backgroundColor:C.card, fontSize:"0.82rem", fontWeight:"500", cursor:"pointer", fontFamily:C.sans, color:C.light, minHeight:"32px" },
  chipActive: { backgroundColor:C.primary, color:"#fff", borderColor:C.primary },
  vList: { marginBottom:"12px" },
  groupHead: { fontSize:"0.72rem", fontWeight:"700", color:C.primary, letterSpacing:"0.05em", padding:"10px 0 4px 0", borderBottom:`1px solid ${C.border}`, marginBottom:"2px" },
  vRow: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.border}22`, gap:"8px" },
  vRowInfo: { display:"flex", flexDirection:"column", gap:"1px", flex:1, minWidth:0 },
  vRowName: { fontSize:"0.9rem", fontWeight:"600", fontFamily:C.font, overflowWrap:"break-word" },
  vRowTrans: { fontSize:"0.78rem", color:C.muted },
  editInput: { fontSize:"0.85rem", padding:"4px 8px", border:`1px solid ${C.border}`, borderRadius:"4px", fontFamily:C.sans, flex:1, minWidth:"80px" },
  iconBtn: { padding:"6px", border:"none", background:"none", cursor:"pointer", color:C.muted, borderRadius:"4px", display:"flex", alignItems:"center", justifyContent:"center", minWidth:"28px", minHeight:"28px" },
  addCard: { backgroundColor:C.card, borderRadius:C.r, boxShadow:C.shadow, padding:"16px" },
  hint: { fontSize:"0.82rem", color:C.light, margin:"0 0 4px 0", lineHeight:1.4 },
  code: { backgroundColor:C.primaryLt, padding:"1px 5px", borderRadius:"3px", fontFamily:"monospace", fontSize:"0.8rem" },
  pre: { fontSize:"0.8rem", color:C.light, backgroundColor:"#f8f6f3", padding:"8px 10px", borderRadius:C.rs, margin:"6px 0 10px 0", fontFamily:"monospace", whiteSpace:"pre-wrap", overflowWrap:"break-word", lineHeight:1.5 },
  textarea: { width:"100%", padding:"10px", fontSize:"0.9rem", fontFamily:C.sans, border:`1px solid ${C.border}`, borderRadius:C.rs, resize:"vertical", outline:"none", boxSizing:"border-box", minHeight:"80px", backgroundColor:"#fcfaf8" },
  statusLog: { marginTop:"12px", display:"flex", flexDirection:"column", gap:"4px" },
  statusRow: { display:"flex", alignItems:"flex-start", gap:"8px", padding:"6px 8px", backgroundColor:"#f9f7f4", borderRadius:"6px", fontSize:"0.84rem", lineHeight:1.4 },
  statusIcon: { fontWeight:"700", fontSize:"0.9rem", flexShrink:0, width:"16px", textAlign:"center" },
  statusLabel: { fontWeight:"600", color:C.text, fontFamily:C.font, minWidth:0, overflowWrap:"break-word" },
  statusMsg: { color:C.light, marginLeft:"auto", flexShrink:0, textAlign:"right", fontSize:"0.8rem" },

  // Stats
  statsGrid: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"20px" },
  statBox: { textAlign:"center", padding:"14px 6px", backgroundColor:C.card, borderRadius:C.rs, boxShadow:C.shadow },
  statNum: { fontSize:"1.5rem", fontWeight:"800", color:C.primary, fontFamily:C.sans },
  statLbl: { fontSize:"0.68rem", color:C.muted, marginTop:"2px" },
  section: { marginBottom:"20px" },
  secTitle: { fontFamily:C.font, fontSize:"0.95rem", fontWeight:"600", margin:"0 0 10px 0" },
  hardRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", backgroundColor:C.card, borderRadius:C.rs, marginBottom:"4px", gap:"8px", flexWrap:"wrap" },
  hardName: { fontSize:"0.88rem", fontWeight:"600", fontFamily:C.font },
  hardStats: { fontSize:"0.78rem", color:C.muted },
  sessRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", backgroundColor:C.card, borderRadius:C.rs, marginBottom:"4px", gap:"8px", flexWrap:"wrap" },
  sessDate: { fontSize:"0.82rem", color:C.light },
  sessResult: { fontSize:"0.82rem", fontWeight:"600", display:"flex", alignItems:"center", gap:"3px" },
  muted: { fontSize:"0.85rem", color:C.muted, fontStyle:"italic" },

  // Reference
  refPrepHead: { fontSize:"0.85rem", fontWeight:"700", color:"#fff", backgroundColor:C.primary, padding:"8px 14px", borderRadius:`${C.rs} ${C.rs} 0 0`, letterSpacing:"0.05em" },
  refTable: { backgroundColor:C.card, borderRadius:`0 0 ${C.rs} ${C.rs}`, boxShadow:C.shadow, overflow:"hidden" },
  refRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderBottom:`1px solid ${C.border}33`, gap:"12px", flexWrap:"wrap" },
  refVerb: { fontSize:"0.9rem", fontWeight:"600", fontFamily:C.font },
  refTrans: { fontSize:"0.82rem", color:C.light },

  // Settings
  settingsGroup: { display:"flex", flexDirection:"column", gap:"3px" },
  setRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px", backgroundColor:C.card, borderRadius:C.rs, gap:"14px" },
  setLabel: { fontSize:"0.92rem", fontWeight:"600" },
  setHint: { fontSize:"0.78rem", color:C.muted, marginTop:"1px" },
  select: { padding:"7px 10px", fontSize:"0.9rem", border:`1px solid ${C.border}`, borderRadius:C.rs, backgroundColor:C.card, fontFamily:C.sans, minHeight:"36px", color:C.text },
  toggle: { width:"48px", height:"26px", borderRadius:"13px", border:"none", cursor:"pointer", position:"relative", transition:"background-color .2s", flexShrink:0, padding:0 },
  toggleKnob: { width:"22px", height:"22px", borderRadius:"50%", backgroundColor:"#fff", boxShadow:"0 1px 3px rgba(0,0,0,.2)", transition:"transform .2s", position:"absolute", top:"2px" },
};
