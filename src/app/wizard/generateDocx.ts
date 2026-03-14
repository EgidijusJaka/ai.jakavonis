/**
 * Client-side DOCX generator for DI Technical Specification
 * Adapted from files/generate-ts-docx.js for browser usage
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, TabStopType, TabStopPosition,
} from "docx";
import { saveAs } from "file-saver";

// ============================================
// MAPS
// ============================================
const STAKEHOLDER_MAP: Record<string, string> = {
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

const RISK_MAP: Record<number, string> = {
  0: "Minimali rizika – rekomendacinis DI taikymo kodeksas",
  1: "Ribota rizika – skaidrumo reikalavimai (Art. 50)",
  2: "Aukšta rizika – pilna atitiktis (Art. 6-49, Annex III)",
  3: "Nepriimtina rizika – draudžiama (Art. 5)",
};

const OVERSIGHT_MAP: Record<string, string> = {
  hitl: "Human-in-the-Loop – žmogus patvirtina kiekvieną DI sprendimą prieš veiksmą",
  hotl: "Human-on-the-Loop – DI veikia autonomiškai, žmogus stebi ir gali sustabdyti",
  hocl: "Human-over-the-Loop – žmogus nustato taisykles ir periodiškai peržiūri",
  auto: "Pilnai automatinis – DI veikia be žmogiškosios priežiūros",
};

const INFRA_MAP: Record<string, string> = {
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

const ORANGE = "B45309";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

// ============================================
// FIELD GUIDANCE FOR EMPTY FIELDS (DOCX)
// ============================================
interface DocxFieldGuide {
  hint: string;
  expert: string; // "self" | "DI konsultantas" | "Teisininkas / DAP" | "DI konsultantas + Teisininkas"
  section: string;
}

const DOCX_FIELD_GUIDES: Record<string, DocxFieldGuide> = {
  "problem.description": { hint: "Organizacija turi aprašyti problemą, kurią DI sistema turėtų spręsti", expert: "Jūsų žinios", section: "1.1" },
  "problem.currentProcess": { hint: "Aprašykite dabartinį procesą (AS-IS)", expert: "Jūsų žinios", section: "1.2" },
  "problem.painPoints": { hint: "Išvardinkite pagrindines problemas", expert: "Jūsų žinios", section: "1.2" },
  "problem.whyAI": { hint: "Pagrįsti DI taikymo tikslingumą ir pranašumus prieš alternatyvas", expert: "DI konsultantas", section: "1.4" },
  "problem.successCriteria": { hint: "Apibrėžti kiekybinius sėkmės kriterijus (TO-BE)", expert: "DI konsultantas", section: "1.7" },
  "concept.vision": { hint: "Suformuluoti aukšto lygio DI sistemos viziją", expert: "DI konsultantas", section: "2.1" },
  "concept.modelStrategy": { hint: "Pasirinkti DI modelio strategiją", expert: "DI konsultantas", section: "2.3" },
  "concept.modelRationale": { hint: "Pagrįsti DI modelio strategijos pasirinkimą", expert: "DI konsultantas", section: "2.3" },
  "concept.oversightLevel": { hint: "Nustatyti žmogiškosios priežiūros lygį pagal Art. 14", expert: "DI konsultantas + Teisininkas", section: "2.4" },
  "concept.overrideMechanism": { hint: "Aprašyti override mechanizmą (Art. 14)", expert: "DI konsultantas + Teisininkas", section: "2.4" },
  "concept.personalData": { hint: "Identifikuoti tvarkomus asmens duomenis (BDAR)", expert: "Teisininkas / DAP", section: "2.5" },
  "concept.dataMinimization": { hint: "Aprašyti duomenų minimizavimo priemones (BDAR Art. 5)", expert: "DI konsultantas + Teisininkas", section: "2.5" },
  "architecture.dataFlow": { hint: "Aprašyti duomenų srautą per DI sistemą", expert: "DI konsultantas", section: "4.2" },
  "architecture.securityReqs": { hint: "Apibrėžti saugumo reikalavimus", expert: "DI konsultantas + Teisininkas", section: "4.3" },
  "architecture.scaleReqs": { hint: "Apibrėžti mastelio reikalavimus", expert: "DI konsultantas", section: "4.3" },
  "architecture.risks": { hint: "Identifikuoti rizikas ir mitigacijos priemones", expert: "DI konsultantas + Teisininkas", section: "4.4" },
};

function guidancePara(fieldKey: string): Paragraph {
  const guide = DOCX_FIELD_GUIDES[fieldKey];
  const text = guide
    ? `[UŽPILDYTI — ${guide.expert}] ${guide.hint}`
    : "[UŽPILDYTI]";
  return new Paragraph({
    spacing: { after: 120 },
    shading: { fill: "FEF3C7", type: ShadingType.CLEAR },
    children: [new TextRun({ text, size: 22, font: "Arial", color: ORANGE, bold: true, italics: true })],
  });
}

function multilineParagraphsOrGuide(text: string | undefined, fieldKey: string): Paragraph[] {
  if (!text) return [guidancePara(fieldKey)];
  return text.split("\n").filter(Boolean).map((line) => para(line.trim()));
}

function labelValueOrGuide(label: string, value: string, fieldKey: string): Paragraph {
  if (value) return labelValue(label, value);
  const guide = DOCX_FIELD_GUIDES[fieldKey];
  const hint = guide ? `[UŽPILDYTI — ${guide.expert}] ${guide.hint}` : "[UŽPILDYTI]";
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, size: 22, font: "Arial", bold: true, color: DARK }),
      new TextRun({ text: hint, size: 22, font: "Arial", color: ORANGE, bold: true, italics: true }),
    ],
  });
}

// ============================================
// HELPERS
// ============================================
function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1): Paragraph {
  return new Paragraph({ heading: level, children: [new TextRun(text)], spacing: { before: 300, after: 150 } });
}

function para(text: string, opts: { size?: number; color?: string; bold?: boolean; italics?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacing?: { after?: number; before?: number } } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: 120, ...opts.spacing },
    alignment: opts.align,
    children: [new TextRun({ text, size: opts.size || 22, font: "Arial", color: opts.color, bold: opts.bold, italics: opts.italics })],
  });
}

function labelValue(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, size: 22, font: "Arial", bold: true, color: DARK }),
      new TextRun({ text: value || "—", size: 22, font: "Arial", color: "334155" }),
    ],
  });
}

function multilineParagraphs(text: string | undefined): Paragraph[] {
  if (!text) return [para("—", { italics: true, color: GRAY })];
  return text.split("\n").filter(Boolean).map((line) => para(line.trim()));
}

function headerCell(text: string, width: number): TableCell {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: TABLE_HEADER_BG, type: ShadingType.CLEAR },
    margins: cellMargins,
    verticalAlign: "center",
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: "Arial", bold: true, color: "FFFFFF" })] })],
  });
}

function dataCell(text: string, width: number, opts: { shade?: boolean | number } = {}): TableCell {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: opts.shade ? { fill: TABLE_ALT_BG, type: ShadingType.CLEAR } : undefined,
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text: text || "—", size: 20, font: "Arial", color: "334155" })] })],
  });
}

function getStakeholderResponsibility(id: string): string {
  const map: Record<string, string> = {
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
// DOCUMENT GENERATION
// ============================================
/* eslint-disable @typescript-eslint/no-explicit-any */
function generateDoc(data: any): Document {
  const m = data.meta || {};
  const p = data.problem || {};
  const c = data.concept || {};
  const e = data.evals || {};
  const a = data.architecture || {};

  const content: (Paragraph | Table)[] = [];

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
  const metaRows: [string, string][] = [
    ["Dokumentas", m.docType || "Techninė specifikacija / DI sistemos planavimo dokumentas"],
    ["Organizacija", m.organization || "—"],
    ["Autorius", m.author || "—"],
    ["Data", m.date || new Date().toISOString().split("T")[0]],
    ["Versija", m.version || "1.0"],
    ["Rizikos lygis", RISK_MAP[p.riskLevel] || "Nenustatytas"],
  ];

  content.push(new Table({
    width: { size: 6000, type: WidthType.DXA },
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

  // ============================================================
  // 1. PROBLEMOS APRAŠYMAS
  // ============================================================
  content.push(heading("1. Problemos aprašymas ir DI taikymo pagrindimas"));

  content.push(heading("1.1. Problemos formulavimas", HeadingLevel.HEADING_2));
  content.push(...multilineParagraphsOrGuide(p.description, "problem.description"));

  content.push(heading("1.2. Dabartinė situacija (AS-IS)", HeadingLevel.HEADING_2));
  content.push(para("Dabartinis procesas:", { bold: true }));
  content.push(...multilineParagraphsOrGuide(p.currentProcess, "problem.currentProcess"));
  content.push(para("Pagrindinės problemos:", { bold: true }));
  content.push(...multilineParagraphsOrGuide(p.painPoints, "problem.painPoints"));

  if (p.timeSpent || p.errorRate || p.volume) {
    content.push(heading("1.3. Kiekybiniai rodikliai", HeadingLevel.HEADING_2));
    const qRows: [string, string][] = [
      ["Dokumentai / operacijos per dieną", p.volume || "—"],
      ["Laiko sąnaudos per dieną (val.)", p.timeSpent || "—"],
      ["Klaidų dažnis (%)", p.errorRate || "—"],
    ];
    content.push(new Table({
      width: { size: 9026, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [headerCell("Rodiklis", 4513), headerCell("Reikšmė", 4513)] }),
        ...qRows.map(([k, v], i) =>
          new TableRow({ children: [dataCell(k, 4513, { shade: i % 2 }), dataCell(v, 4513, { shade: i % 2 })] })
        ),
      ],
    }));
  }

  content.push(heading("1.4. DI taikymo pagrindimas", HeadingLevel.HEADING_2));
  content.push(...multilineParagraphsOrGuide(p.whyAI, "problem.whyAI"));
  if (p.alternatives?.length) {
    content.push(labelValue("Svarstytos alternatyvos", p.alternatives.join(", ")));
  }

  content.push(heading("1.5. Rizikos klasifikacija pagal ES DI Aktą", HeadingLevel.HEADING_2));
  content.push(labelValue("Rizikos lygis", RISK_MAP[p.riskLevel] || "Nenustatytas"));

  content.push(heading("1.6. Suinteresuotosios šalys", HeadingLevel.HEADING_2));
  content.push(para("Šie dalyviai turi būti įtraukti į sprendimų priėmimo procesą:"));
  if (p.stakeholders?.length) {
    content.push(new Table({
      width: { size: 9026, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [headerCell("Rolė", 3009), headerCell("Aprašymas / Atsakomybė", 6017)] }),
        ...p.stakeholders.map((s: string, i: number) => new TableRow({
          children: [
            dataCell(STAKEHOLDER_MAP[s] || s, 3009, { shade: i % 2 }),
            dataCell(getStakeholderResponsibility(s), 6017, { shade: i % 2 }),
          ],
        })),
      ],
    }));
  }

  content.push(heading("1.7. Sėkmės kriterijai (TO-BE)", HeadingLevel.HEADING_2));
  content.push(...multilineParagraphsOrGuide(p.successCriteria, "problem.successCriteria"));

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ============================================================
  // 2. SISTEMOS KONCEPTAS
  // ============================================================
  content.push(heading("2. Sistemos konceptas"));

  content.push(heading("2.1. Sistemos vizija", HeadingLevel.HEADING_2));
  content.push(...multilineParagraphsOrGuide(c.vision, "concept.vision"));

  content.push(heading("2.2. Integracijos taškai", HeadingLevel.HEADING_2));
  content.push(new Table({
    width: { size: 9026, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [headerCell("Kategorija", 2500), headerCell("Sistemos / Technologijos", 6526)] }),
      ...(([
        ["Įvesties sistemos", c.inputSystems],
        ["Išvesties sistemos", c.outputSystems],
        ["Duomenų šaltiniai", c.dataSources],
        ["Orkestracija", c.orchestration],
      ] as [string, string][]).map(([k, v], i) => new TableRow({
        children: [dataCell(k, 2500, { shade: i % 2 }), dataCell(v, 6526, { shade: i % 2 })],
      }))),
    ],
  }));

  content.push(heading("2.3. DI modelio strategija", HeadingLevel.HEADING_2));
  if (c.modelStrategy?.length) {
    const stratMap: Record<string, string> = {
      cloud_llm: "Cloud LLM (Claude, GPT)", local_llm: "Lokalus LLM (Ollama)",
      custom_ml: "Custom ML modelis", hybrid: "Hibridinis", rag: "RAG sistema", fine_tuned: "Fine-tuned modelis"
    };
    content.push(labelValue("Pasirinktos strategijos", c.modelStrategy.map((s: string) => stratMap[s] || s).join(", ")));
  }
  content.push(para("Pagrindimas:", { bold: true }));
  content.push(...multilineParagraphsOrGuide(c.modelRationale, "concept.modelRationale"));

  content.push(heading("2.4. Žmogiškoji priežiūra (Art. 14 ES DI Aktas)", HeadingLevel.HEADING_2));
  content.push(labelValueOrGuide("Priežiūros lygis", OVERSIGHT_MAP[c.oversightLevel] || "", "concept.oversightLevel"));
  content.push(para("Override mechanizmas:", { bold: true }));
  content.push(...multilineParagraphsOrGuide(c.overrideMechanism, "concept.overrideMechanism"));

  content.push(heading("2.5. Duomenų apsauga ir BDAR atitiktis", HeadingLevel.HEADING_2));
  content.push(labelValueOrGuide("Tvarkomi asmens duomenys", c.personalData || "", "concept.personalData"));
  content.push(labelValueOrGuide("Duomenų minimizavimas", c.dataMinimization || "", "concept.dataMinimization"));
  if (c.gdprChecks?.length) {
    const gdprMap: Record<string, string> = {
      dpia: "DPIA atliktas", legal_basis: "Teisinis pagrindas apibrėžtas",
      retention: "Saugojimo terminai nustatyti", subject_rights: "Duomenų subjektų teisės užtikrintos"
    };
    content.push(para("BDAR atitikties checklist:", { bold: true }));
    c.gdprChecks.forEach((ch: string) => content.push(para(`  [OK] ${gdprMap[ch] || ch}`)));
  }

  content.push(heading("2.6. Diegimo etapai", HeadingLevel.HEADING_2));
  content.push(new Table({
    width: { size: 9026, type: WidthType.DXA },
    rows: [
      new TableRow({ children: [headerCell("Fazė", 2000), headerCell("Aprašymas", 7026)] }),
      ...(([
        ["1: PoC / Sandbox", c.phase1],
        ["2: Pilotas", c.phase2],
        ["3: Produkcija", c.phase3],
      ] as [string, string][]).map(([k, v], i) => new TableRow({
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

  const metricNames: Record<string, string> = {
    accuracy: "Tikslumas (Accuracy)", robustness: "Patvarumas (Robustness)", latency: "Atsakymo laikas",
    bias: "Šališkumo vertinimas", disparate: "Skirtingas poveikis",
    explainability: "Paaiškinamumas", audit_trail: "Audito pėdsakas",
    user_notice: "Naudotojo informavimas", confidence: "Patikimumo rodikliai",
    adversarial: "Adversarinė atsparumas", fallback: "Fallback mechanizmas", data_quality: "Duomenų kokybės kontrolė",
    human_override: "Override galimybė", escalation: "Eskalavimo procesas", domain_validation: "Domeno ekspertų validavimas",
    uptime: "Veikimo laikas (Uptime)", drift: "Modelio drift stebėsena",
    incident: "Incidentų valdymas", periodic_audit: "Periodinis auditas",
  };

  evalCategories.forEach((cat, catIdx) => {
    content.push(heading(`3.${catIdx + 1}. ${cat.title}`, HeadingLevel.HEADING_2));
    content.push(new Table({
      width: { size: 9026, type: WidthType.DXA },
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
    content.push(heading("3.7. Testavimo metodai", HeadingLevel.HEADING_2));
    e.testingMethods.forEach((t: string) => content.push(para(`  * ${t}`)));
  }

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ============================================================
  // 4. ARCHITEKTŪRA IR PROTOTIPAS
  // ============================================================
  content.push(heading("4. Sistemos architektūra ir prototipo reikalavimai"));

  content.push(heading("4.1. Architektūros komponentai", HeadingLevel.HEADING_2));
  const compNames: Record<string, string> = {
    trigger: "Trigeris / Įvestis", preprocess: "Pirminė apdoroja", ai_model: "DI modelis",
    logic: "Verslo logika", human: "Žmogiškoji priežiūra", output: "Išvestis / Veiksmas",
    storage: "Duomenų saugykla", monitoring: "Stebėsena",
  };

  if (a.selectedComponents?.length) {
    content.push(new Table({
      width: { size: 9026, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [headerCell("Komponentas", 2000), headerCell("Technologijos", 3013), headerCell("Pastabos", 4013)] }),
        ...a.selectedComponents.map((comp: string, i: number) => {
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
  content.push(...multilineParagraphsOrGuide(a.dataFlow, "architecture.dataFlow"));

  content.push(heading("4.3. Infrastruktūra", HeadingLevel.HEADING_2));
  content.push(labelValue("Diegimo modelis", INFRA_MAP[a.infrastructure] || "Nenustatytas"));
  content.push(para("Saugumo reikalavimai:", { bold: true }));
  content.push(...multilineParagraphsOrGuide(a.securityReqs, "architecture.securityReqs"));
  content.push(para("Mastelio reikalavimai:", { bold: true }));
  content.push(...multilineParagraphsOrGuide(a.scaleReqs, "architecture.scaleReqs"));

  content.push(heading("4.4. Rizikos ir mitigacijos", HeadingLevel.HEADING_2));
  if (a.risks) {
    const riskLines = a.risks.split("\n").filter(Boolean);
    content.push(new Table({
      width: { size: 9026, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [headerCell("Rizika", 2800), headerCell("Tikimybė", 1400), headerCell("Poveikis", 1400), headerCell("Mitigacija", 3426)] }),
        ...riskLines.map((line: string, i: number) => {
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

  const complianceRows: [string, string, string][] = [
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

  // ============================================================
  // 6. RIZIKŲ REGISTRAS
  // ============================================================
  interface RiskAssessmentEntry {
    id: string;
    article: string;
    area: string;
    risk: string;
    responsible: string;
    measures: string;
    impact: string;
    likelihood: string;
    status: string;
    notes?: string;
  }

  const IMPACT_LT: Record<string, string> = { critical: "Kritinis", high: "Aukštas", medium: "Vidutinis", low: "Žemas" };
  const LIKELIHOOD_LT: Record<string, string> = { high: "Aukšta", medium: "Vidutinė", low: "Žema" };
  const STATUS_LT: Record<string, string> = { open: "Atvira", managed: "Valdoma", accepted: "Priimta", not_applicable: "Netaikoma" };

  const risksData = (data.risks as { assessments?: RiskAssessmentEntry[] })?.assessments || [];
  if (risksData.length > 0) {
    content.push(new Paragraph({ children: [new PageBreak()] }));
    content.push(heading("6. Rizikų registras (ES DI Aktas)"));
    content.push(para("Identifikuotos rizikos pagal ES DI Akto reikalavimus su vertinimu ir valdymo priemonėmis."));

    const riskTableRows = risksData.map((r: RiskAssessmentEntry, i: number) => new TableRow({
      children: [
        dataCell(r.id, 700, { shade: i % 2 }),
        dataCell(r.article, 900, { shade: i % 2 }),
        dataCell(r.risk, 3226, { shade: i % 2 }),
        dataCell(IMPACT_LT[r.impact] || r.impact, 900, { shade: i % 2 }),
        dataCell(LIKELIHOOD_LT[r.likelihood] || r.likelihood, 900, { shade: i % 2 }),
        dataCell(STATUS_LT[r.status] || r.status, 900, { shade: i % 2 }),
        dataCell(r.responsible, 1500, { shade: i % 2 }),
      ],
    }));

    content.push(new Table({
      width: { size: 9026, type: WidthType.DXA },
      rows: [
        new TableRow({
          children: [
            headerCell("ID", 700), headerCell("Str.", 900), headerCell("Rizika", 3226),
            headerCell("Poveikis", 900), headerCell("Tikimybė", 900), headerCell("Statusas", 900), headerCell("Atsakingas", 1500),
          ],
        }),
        ...riskTableRows,
      ],
    }));

    // Add detailed entries for open/managed risks with notes
    const detailedRisks = risksData.filter((r: RiskAssessmentEntry) => r.status === "open" || r.status === "managed");
    if (detailedRisks.length > 0) {
      content.push(para(""));
      content.push(para("Detalūs rizikų aprašymai:", { bold: true, spacing: { before: 200 } }));
      detailedRisks.forEach((r: RiskAssessmentEntry) => {
        content.push(para(`${r.id} — ${r.risk}`, { bold: true, spacing: { before: 150 } }));
        content.push(para(`Valdymo priemonės: ${r.measures}`));
        if (r.notes) {
          content.push(para(`Pastabos: ${r.notes}`, { color: "666666" }));
        }
      });
    }

    const openCount = risksData.filter((r: RiskAssessmentEntry) => r.status === "open").length;
    const managedCount = risksData.filter((r: RiskAssessmentEntry) => r.status === "managed" || r.status === "accepted").length;
    content.push(para(`Suvestinė: ${openCount} atviros, ${managedCount} valdomos/priimtos, ${risksData.length} iš viso.`, { bold: true, color: openCount > 0 ? ORANGE : BLUE, spacing: { before: 200 } }));
  }

  // ============================================================
  // 7. KONSULTACIJŲ POREIKIŲ SUVESTINĖ
  // ============================================================
  const fieldConsult: Record<string, boolean> = (data.fieldConsult as Record<string, boolean>) || {};
  const evalsConsult: Record<string, boolean> = (data.evalsConsult as Record<string, boolean>) || {};

  // Collect empty fields from DOCX_FIELD_GUIDES
  const emptyFields = Object.entries(DOCX_FIELD_GUIDES).filter(([key]) => {
    const [section, field] = key.split(".");
    const sectionData = data[section] || {};
    const val = sectionData[field];
    if (Array.isArray(val)) return val.length === 0;
    if (typeof val === "string") return !val.trim();
    return val === undefined || val === null;
  });

  // Collect explicitly consulted fields (user pressed "Nežinau?")
  const consultedFieldKeys = Object.keys(fieldConsult).filter((k) => fieldConsult[k]);
  const consultedMetricKeys = Object.keys(evalsConsult).filter((k) => evalsConsult[k]);
  const totalConsultItems = emptyFields.length + consultedMetricKeys.length;

  if (totalConsultItems > 0) {
    content.push(new Paragraph({ children: [new PageBreak()] }));
    content.push(heading("7. Konsultacijų poreikių suvestinė"));
    content.push(para("Šiame skyriuje pateikiami laukai, pažymėti konsultacijai arba neužpildyti, sugrupuoti pagal reikalingą ekspertizę. Naudokite šią lentelę kaip veiksmų planą — kreipkitės į atitinkamus specialistus."));

    // Group by expert type
    const grouped: Record<string, { hint: string; section: string; status: string }[]> = {};
    emptyFields.forEach(([key, guide]) => {
      if (!grouped[guide.expert]) grouped[guide.expert] = [];
      const isUserConsulted = consultedFieldKeys.includes(key);
      grouped[guide.expert].push({ hint: guide.hint, section: guide.section, status: isUserConsulted ? "Pažymėta konsultacijai" : "Neužpildyta" });
    });

    // Add evals metrics marked for consultation
    consultedMetricKeys.forEach((metricId) => {
      const expert = "DI konsultantas";
      if (!grouped[expert]) grouped[expert] = [];
      grouped[expert].push({ hint: `Metrika: ${metricId}`, section: "3", status: "Pažymėta konsultacijai" });
    });

    const expertOrder = ["DI konsultantas", "Teisininkas / DAP", "DI konsultantas + Teisininkas", "Jūsų žinios"];
    const summaryRows: TableRow[] = [];
    expertOrder.forEach((expert) => {
      const items = grouped[expert];
      if (!items) return;
      items.forEach((item, i) => {
        summaryRows.push(new TableRow({
          children: [
            dataCell(i === 0 ? expert : "", 2000, { shade: summaryRows.length % 2 }),
            dataCell(item.hint, 4526, { shade: summaryRows.length % 2 }),
            dataCell(item.section, 1000, { shade: summaryRows.length % 2 }),
            dataCell(item.status, 1500, { shade: summaryRows.length % 2 }),
          ],
        }));
      });
    });

    content.push(new Table({
      width: { size: 9026, type: WidthType.DXA },
      rows: [
        new TableRow({ children: [headerCell("Ekspertizė", 2000), headerCell("Laukas", 4526), headerCell("Skyrius", 1000), headerCell("Būsena", 1500)] }),
        ...summaryRows,
      ],
    }));

    content.push(para(`Iš viso reikalauja dėmesio: ${totalConsultItems} laukų. Užpildžius visus laukus, sugeneruokite dokumentą iš naujo.`, { bold: true, color: ORANGE, spacing: { before: 200 } }));
  }

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
/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================
// PUBLIC API
// ============================================
export async function downloadDocx(exportData: Record<string, unknown>): Promise<void> {
  const doc = generateDoc(exportData);
  const blob = await Packer.toBlob(doc);
  const meta = exportData.meta as Record<string, string> | undefined;
  const fileName = meta?.projectName
    ? `${meta.projectName.replace(/[^a-zA-ZąčęėįšųūžĄČĘĖĮŠŲŪŽ0-9\s-]/g, "").replace(/\s+/g, "_")}_TS.docx`
    : "DI_Technine_Specifikacija.docx";
  saveAs(blob, fileName);
}
