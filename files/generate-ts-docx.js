#!/usr/bin/env node
/**
 * DI Sistemos Techninės Specifikacijos Generatorius
 * Generuoja .docx dokumentą iš wizard JSON duomenų
 * 
 * Naudojimas:
 *   node generate-ts-docx.js input.json output.docx
 *   node generate-ts-docx.js --demo  (sugeneruoja demo su VILYS duomenimis)
 */

const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, TabStopType, TabStopPosition
} = require("docx");

// ============================================
// DEMO DATA (VILYS @ ŽŪDC)
// ============================================
const DEMO_DATA = {
  meta: {
    projectName: "VILYS – DI dokumentų valdymo automatizacija",
    organization: "Žemės ūkio duomenų centras (ŽŪDC)",
    author: "Egidijus Jakimavičius, AIGP",
    date: new Date().toISOString().split("T")[0],
    version: "2.0",
    docType: "Techninė specifikacija / DI sistemos planavimo dokumentas",
  },
  problem: {
    description: "ŽŪDC kasdien apdoroja 400-450 dokumentų per dvi atskiras kanalus: el. paštu gaunami ir rankiniu būdu keliami registravimui 100-150 raštų/dieną, o tiesiogiai per Avilys DVS sistemą ateina apie 300 dokumentų/dieną. Kiekvieno dokumento registravimas užima 5-7 minutes. Esant tokiai apimčiai, tai sudaro ~40 darbo valandų per dieną vien registravimui – t.y. ~5 etatų darbuotojų pilno darbo laiko.",
    currentProcess: "Dokumentų registravimas vyksta dviem srautais:\n1. El. pašto kanalas (100-150 dok./dieną): darbuotojas gauna raštą el. paštu, atidaro, identifikuoja tipą, rankiniu būdu įkelia į Avilys DVS, užpildo metaduomenis (siuntėjas, tema, skyrius, atsakingas, terminas, prioritetas)\n2. Tiesioginis Avilys srautas (~300 dok./dieną): dokumentas ateina per Avilys, tačiau vis tiek reikalauja rankinio peržiūrėjimo, klasifikavimo, skyriaus ir atsakingo asmens priskyrimo\nAbiem atvejais vieno dokumento registravimas trunka 5-7 minutes",
    painPoints: "1. Milžiniškos laiko sąnaudos – ~40 val./dieną (5 FTE) vien dokumentų registravimui\n2. Du atskiri dokumentų srautai (el. paštas + Avilys) – nėra vieningo proceso\n3. Žmogiškosios klaidos – neteisingas klasifikavimas, praleisti terminai, dubliavimas\n4. El. pašto dokumentai reikalauja papildomo rankinio įkėlimo žingsnio\n5. Nėra organizacinės atminties – pasikartojantys dokumentų šablonai neaptinkami\n6. Vadovybė neturi realaus laiko vaizdo apie dokumentų srautus ir apkrovas",
    timeSpent: "40",
    errorRate: "15",
    volume: "400-450",
    riskLevel: 1,
    whyAI: "Esant 400+ dokumentų per dieną, rankinis registravimas yra ekonomiškai neefektyvus – 5 FTE darbuotojų pilną darbo laiką skiria rutininiam darbui. DI sistema gali:\n- Automatiškai klasifikuoti dokumentus pagal turinį lietuvių kalba (NLP)\n- Sujungti du srautus (el. paštas + Avilys) į vieną automatizuotą pipeline\n- Sumažinti registravimo laiką nuo 5-7 min. iki <30 sek. per dokumentą\n- Atlaisvinti ~4 FTE darbuotojų produktyvesnėms užduotims\nAlternatyvos (taisyklės, RPA) negali analizuoti nestruktūrizuoto lietuviško teksto turinio ir prisitaikyti prie kintančių dokumentų tipų.",
    alternatives: ["Taisyklėmis pagrįstas", "RPA (automatizacija)", "Papildomas personalas"],
    stakeholders: ["business", "process", "legal", "dpo", "it", "ml", "users", "governance"],
    successCriteria: "1. Dokumentų klasifikavimo tikslumas ≥90%\n2. Registravimo laikas <30 sek./dokumentą (vietoj 5-7 min.)\n3. El. pašto dokumentų automatinis įkėlimas į Avilys be rankinio darbo\n4. Darbuotojų laiko sutaupymas ≥32 val./dieną (~4 FTE)\n5. Terminų praleidimas sumažėja iki <2%\n6. Pilnas audito pėdsakas kiekvienam DI sprendimui\n7. Vieningas dokumentų srautas nepriklausomai nuo kanalo",
  },
  concept: {
    vision: "Multi-agentu DI sistema, kuri automatizuoja dokumentu registravima ir klasifikavima ZUDC organizacijoje. Sistema sujungia du atskirus dokumentu srautus (el. pastas + Avilys DVS) i vieninga automatizuota pipeline, apdorojanti 400+ dokumentu per diena. Sistema veikia kaip organizacijos nervu sistema - ne pakeicia zmogu, o atlaisvina ~4 FTE darbuotojus nuo rutininio rankinio darbo produktyvesnems uzduotims.",
    inputSystems: "Avilys DVS (SOAP API) - tiesioginis dokumentu srautas (~300 dok./diena)\nEl. pasto serveris (IMAP/Exchange) - gaunamu rastu srautas (100-150 dok./diena)",
    outputSystems: "Avilys DVS (SOAP API) - dokumentu registravimas, klasifikavimas, priskyrimas\nPranesimu sistema - el. pastas, Teams (eskalavimo ir terminu priminimai)",
    dataSources: "Istoriniai dokumentai (2+ metu, ~100 000+ irasu) klasifikavimo modelio mokymui\nOrganizacine struktura - skyriai, pareigybes, kompetenciju zemelapis\nDokumentu tipu klasifikatorius ir registravimo taisykles",
    orchestration: "n8n workflow platforma",
    modelStrategy: ["hybrid", "rag"],
    modelRationale: "Hibridinis modelis: lokalus Ollama klasifikatoriui (duomenu saugumo delei - dokumentai neiskeliauja is organizacijos tinklo) + Cloud LLM (Claude) sudetingesniems atvejams per RAG sistema su anonimizuotais duomenimis. Esant 400+ dok./diena apkrovai, lokalus modelis uztikrina zema latency ir nepriklausomybe nuo interneto.",
    oversightLevel: "hitl",
    overrideMechanism: "Kiekvienas DI sprendimas pateikiamas su confidence rodikliu. Jei confidence < 85%, sprendimas automatiškai eskaluojamas žmogui. Bet kuriuo metu naudotojas gali pakeisti DI priskirtą skyrių/specialistą vienu paspaudimu. Visi override veiksmai registruojami mokymo duomenims.",
    personalData: "Dokumentuose esantys fizinių asmenų vardai, pavardės, kontaktiniai duomenys, ūkininkų identifikaciniai kodai",
    dataMinimization: "DI modelis apdoroja tik dokumento metaduomenis ir pagrindinį tekstą. Priedai (skanai su parašais) nėra siunčiami į DI modelį. Mokymo duomenyse naudojami pseudonimizuoti dokumentai.",
    gdprChecks: ["dpia", "legal_basis", "retention", "subject_rights"],
    phase1: "3 men. - PoC GovAI smeliadezeje su sintetiniais duomenimis, Avilys SOAP API imitacija ir el. pasto pipeline prototipas",
    phase2: "3 men. - Pilotas ZUDC kanceliarijoje: pradedama nuo Avilys tiesioginio srauto (300 dok./diena) su human-in-the-loop",
    phase3: "6 men. - Pilnas diegimas: abu srautai (Avilys + el. pastas), visi skyriai, stebesenos platforma, vadovybes dashboard",
  },
  evals: {
    metrics: {
      accuracy: { target: "92", minimum: "85" },
      precision: { target: "90", minimum: "80" },
      recall: { target: "95", minimum: "88" },
      f1: { target: "0.92", minimum: "0.85" },
      latency: { target: "10000", minimum: "30000" },
      robustness: { target: "88", minimum: "75" },
      explainability: { target: "4", minimum: "3" },
      audit_trail: { target: "taip", minimum: "taip" },
      user_notice: { target: "taip", minimum: "taip" },
      uptime: { target: "99.9", minimum: "99.5" },
      error_rate: { target: "2", minimum: "5" },
      human_override: { target: "10", minimum: "" },
    },
    testingMethods: ["Unit testai", "Integraciniai testai", "Naudotojų testavimas", "Regresijos testai"],
  },
  architecture: {
    selectedComponents: ["trigger", "preprocess", "ai_model", "logic", "human", "output", "storage", "monitoring"],
    componentDetails: {
      trigger: { technologies: ["SOAP API", "Webhook", "Cron", "IMAP/Exchange"], notes: "Du kanalai: Avilys SOAP API trigger (~300/d.) + El. pasto stebejimas IMAP (100-150/d.)" },
      preprocess: { technologies: ["OCR", "NLP tokenizacija", "Formato konvertavimas"], notes: "DeepSeek OCR 2 arba Azure Document Intelligence. El. pasto priedai: PDF/DOC/DOCX konvertavimas" },
      ai_model: { technologies: ["LLM (Claude/GPT)", "Ollama lokalus", "Embedding"], notes: "Ollama lokaliam klasifikavimui, Claude sudėtingiems atvejams" },
      logic: { technologies: ["Taisyklių variklis", "Maršrutizavimas", "Prioritetizavimas", "Workflow orchestracija"], notes: "n8n workflow variklis" },
      human: { technologies: ["Patvirtinimo UI", "Override galimybė", "Audit log"], notes: "React dashboard su patvirtinimo srautu" },
      output: { technologies: ["API kvietimas", "Pranešimai", "Užduoties priskyrimas"], notes: "Avilys SOAP API atnaujinimas" },
      storage: { technologies: ["PostgreSQL", "Supabase", "Vector DB"], notes: "Supabase (PostgreSQL + pgvector)" },
      monitoring: { technologies: ["Metrikos dashboard", "Anomalijų detektorius", "Logai", "Alertai"], notes: "Grafana + custom n8n stebėsena" },
    },
    dataFlow: "SRAUTAS 1 - AVILYS TIESIOGINIS (~300 dok./diena):\n1. Dokumentas ateina per Avilys SOAP API (Webhook trigger)\n2. OCR istraukia teksta (jei skanuotas PDF)\n3. Tekstas anonimizuojamas (PII maskavimas)\n4. Ollama klasifikatorius nustato: tipa, skyriu, prioriteta, atsakinga\n5. Jei confidence >=85% - automatinis priskyrimas\n6. Jei confidence <85% - eskalavimas zmogui su pasiulymu\n7. Rezultatas atnaujinamas Avilys per SOAP API\n\nSRAUTAS 2 - EL. PASTAS (100-150 dok./diena):\n1. El. pasto stebejimas (IMAP/Exchange trigger)\n2. Dokumento israukimas is priedo (PDF/DOC)\n3. OCR + teksto analize\n4. Automatinis ikelimas i Avilys per SOAP API su uzpildytais metaduomenimis\n5. Toliau - tas pats klasifikavimo pipeline kaip Srautui 1\n\nABIEM SRAUTAMS:\n8. Metrikos registruojamos Supabase\n9. Anomaliju detektorius stebi drift ir klaidas\n10. Savaitine ataskaita vadovybei",
    infrastructure: "hybrid",
    securityReqs: "DI modelis veikia organizacijos vidiniame tinkle (Ollama on-premise). Dokumentai nesifruojami ir nesiundiami i isorines debesijas be anonimizacijos. VPN prieiga kurejams. Audito logai visoms operacijoms. El. pasto prieiga tik per dedikuota service account.",
    scaleReqs: "Dabartinis: 400-450 dok./diena (100-150 el. pastu + ~300 Avilys).\nPiko apkrova: iki 600 dok./diena (metu pabaigos ataskaitiniai laikotarpiai).\nPlanuojamas augimas: iki 700 dok./diena per 2 metus.\nReikalingas pralaidumas: >=1 dok./10 sek. vidutiniu rezimu, >=1 dok./5 sek. piko metu.",
    risks: "Avilys SOAP API nestabilumas | Vidutine | Aukstas | Retry logika + queue buferis + offline rezimas\nModelio hallucinations | Auksta | Vidutinis | Human-in-the-loop + confidence slenkstis 85%\nDuomenu nutekejimas | Zema | Kritinis | On-premise diegimas, VPN, audit logai\nLietuviu kalbos supratimo kokybe | Vidutine | Aukstas | Fine-tuning su ZUDC specifiniais terminais\nEl. pasto formato ivairove | Auksta | Vidutinis | Universalus parser + fallback i rankini registravima\nApkrovos pikai | Vidutine | Vidutinis | Auto-scaling, queue sistema, prioritetizavimas",
  },
};

// ============================================
// STAKEHOLDER MAP
// ============================================
const STAKEHOLDER_MAP = {
  business: "Verslo vadovai",
  process: "Proceso savininkai",
  legal: "Teisininkai",
  dpo: "Duomenų apsaugos pareigūnas (DAP)",
  ethics: "Etikos komisija",
  it: "IT architektai",
  ml: "ML / DI inžinieriai",
  security: "Kibernetinio saugumo specialistai",
  users: "Galutiniai naudotojai",
  governance: "DI governance specialistai",
};

const RISK_MAP = {
  0: "Minimali rizika – rekomendacinis DI taikymo kodeksas",
  1: "Ribota rizika – skaidrumo reikalavimai (Art. 50)",
  2: "Aukšta rizika – pilna atitiktis (Art. 6-49, Annex III)",
  3: "Nepriimtina rizika – draudžiama (Art. 5)",
};

const OVERSIGHT_MAP = {
  hitl: "Human-in-the-Loop – žmogus patvirtina kiekvieną DI sprendimą prieš veiksmą",
  hotl: "Human-on-the-Loop – DI veikia autonomiškai, žmogus stebi ir gali sustabdyti",
  hocl: "Human-over-the-Loop – žmogus nustato taisykles ir periodiškai peržiūri",
  auto: "Pilnai automatinis – DI veikia be žmogiškosios priežiūros",
};

const INFRA_MAP = {
  on_premise: "On-Premise (organizacijos serveriuose)",
  private_cloud: "Privati debesija",
  public_cloud: "Viešoji debesija",
  hybrid: "Hibridinė (lokalus + debesija)",
  govai_sandbox: "VSSA GovAI reguliacinė smėliadėžė",
};

// ============================================
// STYLES
// ============================================
const BLUE = "1E40AF";
const DARK = "1E293B";
const GRAY = "64748B";
const LIGHT_BG = "F1F5F9";
const TABLE_HEADER_BG = "1E40AF";
const TABLE_ALT_BG = "F8FAFC";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

// ============================================
// HELPERS
// ============================================
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun(text)], spacing: { before: 300, after: 150 } });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, ...opts.spacing },
    alignment: opts.align,
    children: [new TextRun({ text, size: opts.size || 22, font: "Arial", color: opts.color, bold: opts.bold, italics: opts.italics })],
  });
}

function labelValue(label, value) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, size: 22, font: "Arial", bold: true, color: DARK }),
      new TextRun({ text: value || "—", size: 22, font: "Arial", color: "334155" }),
    ],
  });
}

function multilineParagraphs(text) {
  if (!text) return [para("—", { italics: true, color: GRAY })];
  return text.split("\n").filter(Boolean).map((line) => para(line.trim()));
}

function headerCell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: TABLE_HEADER_BG, type: ShadingType.CLEAR },
    margins: cellMargins,
    verticalAlign: "center",
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: "Arial", bold: true, color: "FFFFFF" })] })],
  });
}

function dataCell(text, width, opts = {}) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: opts.shade ? { fill: TABLE_ALT_BG, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text: text || "—", size: 20, font: "Arial", color: "334155" })] })],
  });
}

// ============================================
// DOCUMENT GENERATION
// ============================================
function generateDoc(data) {
  const m = data.meta || {};
  const p = data.problem || {};
  const c = data.concept || {};
  const e = data.evals || {};
  const a = data.architecture || {};

  const content = [];

  // ---- TITLE PAGE ----
  content.push(new Paragraph({ spacing: { before: 4000 } }));
  content.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: m.organization || "Organizacija", size: 28, font: "Arial", color: GRAY })],
  }));
  content.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: m.projectName || "DI Sistemos Projektas", size: 48, font: "Arial", bold: true, color: BLUE })],
  }));
  content.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: m.docType || "Techninė specifikacija", size: 26, font: "Arial", color: GRAY })],
  }));

  // Metadata table
  const metaRows = [
    ["Dokumentas", m.docType || "Techninė specifikacija / DI sistemos planavimo dokumentas"],
    ["Organizacija", m.organization || "—"],
    ["Autorius", m.author || "—"],
    ["Data", m.date || new Date().toISOString().split("T")[0]],
    ["Versija", m.version || "1.0"],
    ["Rizikos lygis", RISK_MAP[p.riskLevel] || "Nenustatytas"],
  ];

  content.push(new Table({
    width: { size: 6000, type: WidthType.DXA },
    columnWidths: [2000, 4000],
    rows: metaRows.map(([k, v]) => new TableRow({
      children: [
        new TableCell({
          borders, width: { size: 2000, type: WidthType.DXA },
          shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: k, size: 20, font: "Arial", bold: true, color: DARK })] })],
        }),
        dataCell(v, 4000),
      ],
    })),
  }));

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ---- TOC ----
  content.push(heading("Turinys"));
  content.push(new TableOfContents("Turinys", { hyperlink: true, headingStyleRange: "1-3" }));
  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ============================================================
  // 1. PROBLEMOS APRAŠYMAS
  // ============================================================
  content.push(heading("1. Problemos aprašymas ir DI taikymo pagrindimas"));

  content.push(heading("1.1. Problemos formulavimas", HeadingLevel.HEADING_2));
  content.push(...multilineParagraphs(p.description));

  content.push(heading("1.2. Dabartinė situacija (AS-IS)", HeadingLevel.HEADING_2));
  content.push(para("Dabartinis procesas:", { bold: true }));
  content.push(...multilineParagraphs(p.currentProcess));
  content.push(para("Pagrindinės problemos:", { bold: true }));
  content.push(...multilineParagraphs(p.painPoints));

  if (p.timeSpent || p.errorRate || p.volume) {
    content.push(heading("1.3. Kiekybiniai rodikliai", HeadingLevel.HEADING_2));
    content.push(new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: [4513, 4513],
      rows: [
        new TableRow({ children: [headerCell("Rodiklis", 4513), headerCell("Reikšmė", 4513)] }),
        ...[
          ["Dokumentai per dieną (bendras)", p.volume || "400-450"],
          ["  - Per Avilys tiesiogiai", "~300"],
          ["  - Per el. paštą (rankinis įkėlimas)", "100-150"],
          ["Registravimo laikas vienam dokumentui", "5-7 min."],
          ["Bendros laiko sąnaudos per dieną", (p.timeSpent || "40") + " val."],
          ["Etatų ekvivalentas (FTE)", "~5 darbuotojai"],
          ["Klaidų dažnis (%)", p.errorRate || "—"],
          ["Dokumentai per metus (apytiksliai)", "~100 000+"],
        ].map(([k, v], i) =>
          new TableRow({ children: [dataCell(k, 4513, { shade: i % 2 }), dataCell(v, 4513, { shade: i % 2 })] })
        ),
      ],
    }));
  }

  content.push(heading("1.4. DI taikymo pagrindimas", HeadingLevel.HEADING_2));
  content.push(...multilineParagraphs(p.whyAI));
  if (p.alternatives?.length) {
    content.push(labelValue("Svarstytos alternatyvos", p.alternatives.join(", ")));
  }

  content.push(heading("1.5. Rizikos klasifikacija pagal ES DI Aktą", HeadingLevel.HEADING_2));
  content.push(labelValue("Rizikos lygis", RISK_MAP[p.riskLevel] || "Nenustatytas"));

  content.push(heading("1.6. Suinteresuotosios šalys", HeadingLevel.HEADING_2));
  content.push(para("Šie dalyviai turi būti įtraukti į sprendimų priėmimo procesą kiekviename DI sistemos gyvavimo ciklo etape (⚖️ principas):"));
  if (p.stakeholders?.length) {
    content.push(new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: [3009, 6017],
      rows: [
        new TableRow({ children: [headerCell("Rolė", 3009), headerCell("Aprašymas / Atsakomybė", 6017)] }),
        ...p.stakeholders.map((s, i) => new TableRow({
          children: [
            dataCell(STAKEHOLDER_MAP[s] || s, 3009, { shade: i % 2 }),
            dataCell(getStakeholderResponsibility(s), 6017, { shade: i % 2 }),
          ],
        })),
      ],
    }));
  }

  content.push(heading("1.7. Sėkmės kriterijai (TO-BE)", HeadingLevel.HEADING_2));
  content.push(...multilineParagraphs(p.successCriteria));

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ============================================================
  // 2. SISTEMOS KONCEPTAS
  // ============================================================
  content.push(heading("2. Sistemos konceptas"));

  content.push(heading("2.1. Sistemos vizija", HeadingLevel.HEADING_2));
  content.push(...multilineParagraphs(c.vision));

  content.push(heading("2.2. Integracijos taškai", HeadingLevel.HEADING_2));
  content.push(new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [2500, 6526],
    rows: [
      new TableRow({ children: [headerCell("Kategorija", 2500), headerCell("Sistemos / Technologijos", 6526)] }),
      ...([
        ["Įvesties sistemos", c.inputSystems],
        ["Išvesties sistemos", c.outputSystems],
        ["Duomenų šaltiniai", c.dataSources],
        ["Orkestracija", c.orchestration],
      ].map(([k, v], i) => new TableRow({
        children: [dataCell(k, 2500, { shade: i % 2 }), dataCell(v, 6526, { shade: i % 2 })],
      }))),
    ],
  }));

  content.push(heading("2.3. DI modelio strategija", HeadingLevel.HEADING_2));
  if (c.modelStrategy?.length) {
    const stratMap = {
      cloud_llm: "Cloud LLM (Claude, GPT)", local_llm: "Lokalus LLM (Ollama)",
      custom_ml: "Custom ML modelis", hybrid: "Hibridinis", rag: "RAG sistema", fine_tuned: "Fine-tuned modelis"
    };
    content.push(labelValue("Pasirinktos strategijos", c.modelStrategy.map((s) => stratMap[s] || s).join(", ")));
  }
  content.push(para("Pagrindimas:", { bold: true }));
  content.push(...multilineParagraphs(c.modelRationale));

  content.push(heading("2.4. Žmogiškoji priežiūra (Art. 14 ES DI Aktas)", HeadingLevel.HEADING_2));
  content.push(labelValue("Priežiūros lygis", OVERSIGHT_MAP[c.oversightLevel] || "Nenustatytas"));
  content.push(para("Override mechanizmas:", { bold: true }));
  content.push(...multilineParagraphs(c.overrideMechanism));

  content.push(heading("2.5. Duomenų apsauga ir BDAR atitiktis", HeadingLevel.HEADING_2));
  content.push(labelValue("Tvarkomi asmens duomenys", c.personalData));
  content.push(labelValue("Duomenų minimizavimas", c.dataMinimization));
  if (c.gdprChecks?.length) {
    const gdprMap = {
      dpia: "DPIA atliktas", legal_basis: "Teisinis pagrindas apibrėžtas",
      retention: "Saugojimo terminai nustatyti", subject_rights: "Duomenų subjektų teisės užtikrintos"
    };
    content.push(para("BDAR atitikties checklist:", { bold: true }));
    c.gdprChecks.forEach((ch) => content.push(para(`  ✓ ${gdprMap[ch] || ch}`)));
  }

  content.push(heading("2.6. Diegimo etapai", HeadingLevel.HEADING_2));
  content.push(new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [2000, 7026],
    rows: [
      new TableRow({ children: [headerCell("Fazė", 2000), headerCell("Aprašymas", 7026)] }),
      ...([
        ["1: PoC / Sandbox", c.phase1],
        ["2: Pilotas", c.phase2],
        ["3: Produkcija", c.phase3],
      ].map(([k, v], i) => new TableRow({
        children: [dataCell(k, 2000, { shade: i % 2 }), dataCell(v, 7026, { shade: i % 2 })],
      }))),
    ],
  }));

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ============================================================
  // 3. VERTINIMO METRIKOS (EVALS)
  // ============================================================
  content.push(heading("3. Vertinimo metrikos ir priėmimo kriterijai"));
  content.push(para("Šios metrikos apibrėžia kiekybinius reikalavimus DI sistemai. Tiekėjas turi parodyti, kad sistema atitinka minimalius slenkščius prieš priėmimą."));

  const evalCategories = [
    { title: "Veikimo metrikos", ids: ["accuracy", "robustness", "latency"], aiActs: ["Art. 15(1)", "Art. 15(4)", "Art. 15(3)"] },
    { title: "Teisingumas ir šališkumas", ids: ["bias", "disparate"], aiActs: ["Art. 10(2)(f)", "Art. 10(2)(f)"] },
    { title: "Skaidrumas ir paaiškinamumas", ids: ["explainability", "audit_trail", "user_notice", "confidence"], aiActs: ["Art. 13", "Art. 12", "Art. 50", "Art. 13"] },
    { title: "Saugumas ir atsparumas", ids: ["adversarial", "fallback", "data_quality"], aiActs: ["Art. 15(5)", "Art. 15(4)", "Art. 10"] },
    { title: "Žmogiškoji priežiūra", ids: ["human_override", "escalation", "domain_validation"], aiActs: ["Art. 14", "Art. 14", "Art. 14"] },
    { title: "Operacinės ir stebėsenos metrikos", ids: ["uptime", "drift", "incident", "periodic_audit"], aiActs: ["", "Art. 72", "Art. 73", "Art. 9(9)"] },
  ];

  const metricNames = {
    accuracy: "Tikslumas (Accuracy)", robustness: "Patvarumas (Robustness)", latency: "Atsakymo laikas",
    bias: "Šališkumo vertinimas", disparate: "Skirtingas poveikis",
    explainability: "Paaiškinamumas", audit_trail: "Audito pėdsakas",
    user_notice: "Naudotojo informavimas", confidence: "Patikimumo rodikliai",
    adversarial: "Adversarinė atsparumas", fallback: "Fallback mechanizmas", data_quality: "Duomenų kokybės kontrolė",
    human_override: "Override galimybė", escalation: "Eskalavimo procesas", domain_validation: "Domeno ekspertų validavimas",
    uptime: "Veikimo laikas (Uptime)", drift: "Modelio drift stebėsena",
    incident: "Incidentų valdymas", periodic_audit: "Periodinis auditas",
  };

  evalCategories.forEach((cat) => {
    content.push(heading(`3.${evalCategories.indexOf(cat) + 1}. ${cat.title}`, HeadingLevel.HEADING_2));
    content.push(new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: [3000, 1500, 1500, 1513, 1513],
      rows: [
        new TableRow({
          children: [
            headerCell("Metrika", 3000), headerCell("Tikslinis", 1500),
            headerCell("Minimalus", 1500), headerCell("DI Aktas", 1513), headerCell("Statusas", 1513),
          ],
        }),
        ...cat.ids.map((id, i) => {
          const md = (e.metrics || {})[id] || {};
          const scaleLabel = (e._scaleLabels || {})[id];
          return new TableRow({
            children: [
              dataCell(metricNames[id] || id, 3000, { shade: i % 2 }),
              dataCell(md.target || "—", 1500, { shade: i % 2 }),
              dataCell(md.minimum || "—", 1500, { shade: i % 2 }),
              dataCell(cat.aiActs[i] || "—", 1513, { shade: i % 2 }),
              dataCell(scaleLabel || (md.target ? "Apibrėžta" : "Neapibrėžta"), 1513, { shade: i % 2 }),
            ],
          });
        }),
      ],
    }));
  });

  if (e.testingMethods?.length) {
    content.push(heading("3.6. Testavimo metodai", HeadingLevel.HEADING_2));
    e.testingMethods.forEach((t) => content.push(para(`  • ${t}`)));
  }

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ============================================================
  // 4. ARCHITEKTŪRA IR PROTOTIPAS
  // ============================================================
  content.push(heading("4. Sistemos architektūra ir prototipo reikalavimai"));

  content.push(heading("4.1. Architektūros komponentai", HeadingLevel.HEADING_2));
  const compNames = {
    trigger: "Trigeris / Įvestis", preprocess: "Pirminė apdoroja", ai_model: "DI modelis",
    logic: "Verslo logika", human: "Žmogiškoji priežiūra", output: "Išvestis / Veiksmas",
    storage: "Duomenų saugykla", monitoring: "Stebėsena",
  };

  if (a.selectedComponents?.length) {
    content.push(new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: [2000, 3013, 4013],
      rows: [
        new TableRow({ children: [headerCell("Komponentas", 2000), headerCell("Technologijos", 3013), headerCell("Pastabos", 4013)] }),
        ...a.selectedComponents.map((comp, i) => {
          const det = (a.componentDetails || {})[comp] || {};
          return new TableRow({
            children: [
              dataCell(compNames[comp] || comp, 2000, { shade: i % 2 }),
              dataCell((det.technologies || []).join(", "), 3013, { shade: i % 2 }),
              dataCell(det.notes || "—", 4013, { shade: i % 2 }),
            ],
          });
        }),
      ],
    }));
  }

  content.push(heading("4.2. Duomenų srautas", HeadingLevel.HEADING_2));
  content.push(...multilineParagraphs(a.dataFlow));

  content.push(heading("4.3. Infrastruktūra", HeadingLevel.HEADING_2));
  content.push(labelValue("Diegimo modelis", INFRA_MAP[a.infrastructure] || "Nenustatytas"));
  content.push(para("Saugumo reikalavimai:", { bold: true }));
  content.push(...multilineParagraphs(a.securityReqs));
  content.push(para("Mastelio reikalavimai:", { bold: true }));
  content.push(...multilineParagraphs(a.scaleReqs));

  content.push(heading("4.4. Rizikos ir mitigacijos", HeadingLevel.HEADING_2));
  if (a.risks) {
    const riskLines = a.risks.split("\n").filter(Boolean);
    content.push(new Table({
      width: { size: 9026, type: WidthType.DXA },
      columnWidths: [2800, 1400, 1400, 3426],
      rows: [
        new TableRow({ children: [headerCell("Rizika", 2800), headerCell("Tikimybė", 1400), headerCell("Poveikis", 1400), headerCell("Mitigacija", 3426)] }),
        ...riskLines.map((line, i) => {
          const parts = line.split("|").map((p) => p.trim());
          return new TableRow({
            children: [
              dataCell(parts[0] || "—", 2800, { shade: i % 2 }),
              dataCell(parts[1] || "—", 1400, { shade: i % 2 }),
              dataCell(parts[2] || "—", 1400, { shade: i % 2 }),
              dataCell(parts[3] || "—", 3426, { shade: i % 2 }),
            ],
          });
        }),
      ],
    }));
  }

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ============================================================
  // 5. ATITIKTIES SANTRAUKA
  // ============================================================
  content.push(heading("5. ES DI Akto atitikties santrauka"));
  content.push(para("Ši santrauka apibrėžia pagrindinius ES DI Akto reikalavimus, kuriuos tiekėjas/kūrėjas turi įgyvendinti:"));

  const complianceRows = [
    ["Art. 4 – DI raštingumas", "Naudotojų mokymai apie DI sistemos galimybes ir ribotumus", c.phase2 ? "Planuojama" : "—"],
    ["Art. 9 – Rizikos valdymo sistema", "Nuolatinis rizikų identifikavimas ir mitigacija", a.risks ? "Apibrėžta" : "—"],
    ["Art. 10 – Duomenų valdymas", "Duomenų kokybės ir reprezentatyvumo užtikrinimas", c.dataMinimization ? "Planuojama" : "—"],
    ["Art. 11 – Techninė dokumentacija", "Pilna techninė dokumentacija pagal Annex IV", "Šis dokumentas"],
    ["Art. 12 – Įvykių registravimas", "Automatinis visų DI sprendimų logavimas", (e.metrics || {}).audit_trail?.target ? "Reikalaujama" : (e._scaleLabels || {}).audit_trail || "—"],
    ["Art. 13 – Skaidrumas", "Naudotojo informavimas apie DI dalyvavimą", (e.metrics || {}).user_notice?.target ? "Reikalaujama" : (e._scaleLabels || {}).user_notice || "—"],
    ["Art. 14 – Žmogiškoji priežiūra", "Žmogaus galimybė kontroliuoti ir keisti DI sprendimus", OVERSIGHT_MAP[c.oversightLevel] ? "Apibrėžta" : "—"],
    ["Art. 15 – Tikslumas ir patvarumas", "Veikimo metrikos ir minimalūs slenkščiai", Object.keys(e.metrics || {}).length > 0 ? "Apibrėžta" : "—"],
    ["Art. 50 – Skaidrumo pareigos", "Naudotojas žino, kad bendrauja su DI", (e.metrics || {}).user_notice?.target ? "Reikalaujama" : (e._scaleLabels || {}).user_notice || "—"],
    ["Art. 72 – Po pateikimo stebėsena", "Nuolatinė DI sistemos veikimo stebėsena", a.selectedComponents?.includes("monitoring") ? "Planuojama" : "—"],
    ["BDAR – DPIA", "Poveikio duomenų apsaugai vertinimas", (c.gdprChecks || []).includes("dpia") ? "Atliktas" : "—"],
  ];

  content.push(new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [2800, 3613, 2613],
    rows: [
      new TableRow({ children: [headerCell("Reikalavimas", 2800), headerCell("Aprašymas", 3613), headerCell("Statusas", 2613)] }),
      ...complianceRows.map(([req, desc, status], i) => new TableRow({
        children: [
          dataCell(req, 2800, { shade: i % 2 }),
          dataCell(desc, 3613, { shade: i % 2 }),
          dataCell(status, 2613, { shade: i % 2 }),
        ],
      })),
    ],
  }));

  // ---- BUILD DOCUMENT ----
  return new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: "Arial", color: BLUE },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: DARK },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Arial", color: "475569" },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              new TextRun({ text: m.projectName || "DI Sistema", size: 16, font: "Arial", color: GRAY }),
              new TextRun("\t"),
              new TextRun({ text: m.organization || "", size: 16, font: "Arial", color: GRAY }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1", space: 1 } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: `${m.docType || "Techninė specifikacija"} v${m.version || "1.0"}`, size: 16, font: "Arial", color: GRAY }),
              new TextRun("\t"),
              new TextRun({ text: "Puslapis ", size: 16, font: "Arial", color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: GRAY }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1", space: 1 } },
          })],
        }),
      },
      children: content,
    }],
  });
}

function getStakeholderResponsibility(id) {
  const map = {
    business: "Strateginis poreikio pagrindimas, investicijos sprendimas, ROI vertinimas",
    process: "Kasdienių procesų validavimas, DI rezultatų tikrinimas, grįžtamasis ryšys",
    legal: "ES DI Akto atitiktis, sutarčių peržiūra, reguliaciniai reikalavimai",
    dpo: "DPIA atlikimas, BDAR atitiktis, asmens duomenų apsaugos užtikrinimas",
    ethics: "Etinių aspektų vertinimas, šališkumo prevencija, socialinio poveikio analizė",
    it: "Techninė architektūra, integracija, infrastruktūra, saugumas",
    ml: "Modelio kūrimas, testavimas, metrikų stebėsena, tobulinimas",
    security: "Kibernetinio saugumo vertinimas, penetraciniai testai, grėsmių analizė",
    users: "Naudojimo patirties testavimas, grįžtamasis ryšys, priėmimo validavimas",
    governance: "DI registro vedimas, atitikties stebėsena, audito koordinavimas",
  };
  return map[id] || "—";
}

// ============================================
// MAIN
// ============================================
async function main() {
  const args = process.argv.slice(2);
  let inputData, outputPath;

  if (args[0] === "--demo") {
    inputData = DEMO_DATA;
    outputPath = args[1] || "DI_Technine_Specifikacija_VILYS.docx";
    console.log("📄 Generuojama DEMO techninė specifikacija (VILYS @ ŽŪDC)...");
  } else if (args.length >= 1) {
    const jsonPath = args[0];
    outputPath = args[1] || "DI_Technine_Specifikacija.docx";
    inputData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    console.log(`📄 Generuojama techninė specifikacija iš ${jsonPath}...`);
  } else {
    console.log("Naudojimas:");
    console.log("  node generate-ts-docx.js input.json [output.docx]");
    console.log("  node generate-ts-docx.js --demo [output.docx]");
    process.exit(0);
  }

  const doc = generateDoc(inputData);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Sukurta: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

main().catch((err) => {
  console.error("❌ Klaida:", err.message);
  process.exit(1);
});
