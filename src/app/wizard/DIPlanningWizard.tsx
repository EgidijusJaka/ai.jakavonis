"use client";

import { useState, useCallback, useMemo, useEffect, type CSSProperties, type ReactNode, type ChangeEvent, type MouseEvent } from "react";
import Link from "next/link";
import {
  Briefcase, ClipboardList, Scale, ShieldCheck, Landmark, Monitor, Bot, Shield, Users, BarChart3,
  Zap, RefreshCw, Brain, Settings, Eye, Upload, Database, Radio,
  TrendingUp, Search, ShieldAlert,
  FileText, Target, Lightbulb, CheckCircle, Building2, Plug, Lock, Calendar, FlaskConical, Puzzle, GitBranch,
  AlertTriangle, MessageSquare, Wrench,
  Cloud, Home, Microscope, BookOpen, Building, Globe,
  AlertCircle, Check, ArrowLeft, ArrowRight, Download, FileDown,
  type LucideIcon,
} from "lucide-react";
import { downloadDocx } from "./generateDocx";

// ============================================================
// TYPESCRIPT INTERFACES
// ============================================================

interface RiskLevel {
  id: number;
  label: string;
  color: string;
  bg: string;
  desc: string;
}

interface StakeholderRole {
  id: string;
  label: string;
  icon: LucideIcon;
  desc: string;
}

interface ArchComponent {
  id: string;
  label: string;
  icon: LucideIcon;
  examples: string[];
}

interface EvalMetric {
  id: string;
  name: string;
  question: string;
  scale: string[];
  weight: number;
  aiActRef: string;
  stakeholders: string[];
  critical?: boolean;
}

interface EvalCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  metrics: EvalMetric[];
}

interface ProblemData {
  description?: string;
  currentProcess?: string;
  painPoints?: string;
  timeSpent?: string;
  errorRate?: string;
  volume?: string;
  riskLevel?: number;
  annexCategory?: string;
  whyAI?: string;
  alternatives?: string[];
  stakeholders?: string[];
  successCriteria?: string;
  [key: string]: unknown;
}

interface ConceptData {
  vision?: string;
  inputSystems?: string;
  outputSystems?: string;
  dataSources?: string;
  orchestration?: string;
  modelStrategy?: string[];
  modelRationale?: string;
  oversightLevel?: string;
  overrideMechanism?: string;
  personalData?: string;
  dataMinimization?: string;
  gdprChecks?: string[];
  phase1?: string;
  phase2?: string;
  phase3?: string;
  [key: string]: unknown;
}

interface EvalsData {
  scores?: Record<string, number>;
  needsConsult?: Record<string, boolean>;
  testingMethods?: string[];
  testingNotes?: string;
  [key: string]: unknown;
}

interface ComponentDetail {
  technologies?: string[];
  notes?: string;
  [key: string]: unknown;
}

interface ArchitectureData {
  selectedComponents?: string[];
  componentDetails?: Record<string, ComponentDetail>;
  dataFlow?: string;
  infrastructure?: string;
  securityReqs?: string;
  scaleReqs?: string;
  risks?: string;
  [key: string]: unknown;
}

type RiskStatus = "open" | "managed" | "accepted" | "not_applicable";
type RiskImpact = "critical" | "high" | "medium" | "low";
type RiskLikelihood = "high" | "medium" | "low";

interface RiskEntry {
  id: string;
  article: string;
  area: string;
  responsible: string;
  risk: string;
  reason: string;
  impact: RiskImpact;
  likelihood: RiskLikelihood;
  measures: string;
  status: RiskStatus;
}

interface RisksData {
  assessments?: Record<string, { status: RiskStatus; impact: RiskImpact; likelihood: RiskLikelihood; notes?: string }>;
  [key: string]: unknown;
}

interface MetaData {
  projectName?: string;
  organization?: string;
  author?: string;
  [key: string]: unknown;
}

interface WizardData {
  problem: ProblemData;
  concept: ConceptData;
  evals: EvalsData;
  architecture: ArchitectureData;
  risks: RisksData;
  _meta: MetaData;
  fieldConsult?: Record<string, boolean>;
  [key: string]: unknown;
}

interface StepProps {
  data: WizardData;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
}

interface ReportStepProps {
  data: WizardData;
}

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  highlight?: boolean;
}

interface SectionTitleProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}

interface ChipOption {
  id?: string;
  label?: string;
  icon?: ReactNode;
}

interface ChipSelectProps {
  options: (ChipOption | string)[];
  selected: string[] | string;
  onToggle: (id: string) => void;
  multi?: boolean;
}

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
}

interface ReportSectionProps {
  num: string;
  title: string;
  children: ReactNode;
}

interface RFieldProps {
  label: string;
  value: string | undefined;
  fieldKey?: string;
}

interface RTableProps {
  headers: string[];
  rows: (string | ReactNode)[][];
}

interface AIActRequirement {
  art: string;
  title: string;
  check: (d: WizardData) => unknown;
}

// ============================================================
// FIELD EXPERTISE METADATA
// ============================================================
type ExpertiseType = "self" | "di" | "legal" | "di+legal";

interface FieldExpertise {
  type: ExpertiseType;
  hint: string; // Guidance text shown when empty
  docxHint: string; // Text for DOCX when empty
}

const FIELD_EXPERTISE: Record<string, FieldExpertise> = {
  // Step 1: Problema — mostly self-knowledge
  "problem.description": { type: "self", hint: "Aprašykite savo organizacijos problemą savais žodžiais", docxHint: "[UŽPILDYTI] Organizacija turi aprašyti problemą, kurią DI sistema turėtų spręsti" },
  "problem.currentProcess": { type: "self", hint: "Aprašykite, kaip šiandien vyksta procesas", docxHint: "[UŽPILDYTI] Aprašykite dabartinį procesą (AS-IS)" },
  "problem.painPoints": { type: "self", hint: "Kokios pagrindinės problemos dabartiniame procese?", docxHint: "[UŽPILDYTI] Išvardinkite pagrindines problemas" },
  "problem.timeSpent": { type: "self", hint: "Kiek valandų per dieną užima šis procesas?", docxHint: "[UŽPILDYTI] Nurodykite laiko sąnaudas" },
  "problem.errorRate": { type: "self", hint: "Koks klaidų procentas dabartiniame procese?", docxHint: "[UŽPILDYTI] Nurodykite klaidų dažnį" },
  "problem.volume": { type: "self", hint: "Kiek dokumentų/operacijų per dieną apdorojama?", docxHint: "[UŽPILDYTI] Nurodykite apimtis" },
  "problem.riskLevel": { type: "legal", hint: "Kreipkitės į teisininką/DAP — rizikos lygis priklauso nuo ES DI Akto klasifikacijos", docxHint: "[UŽPILDYTI — Teisininkas/DAP] Nustatyti rizikos lygį pagal ES DI Aktą" },
  "problem.whyAI": { type: "self", hint: "Aprašykite, kodėl DI yra tinkamas sprendimas šiai problemai", docxHint: "[UŽPILDYTI] Pagrįsti DI taikymo tikslingumą ir pranašumus prieš alternatyvas" },
  "problem.stakeholders": { type: "legal", hint: "Teisininkas/DAP padės nustatyti, kas turi dalyvauti pagal ES DI Aktą", docxHint: "[UŽPILDYTI — Teisininkas/DAP] Nustatyti suinteresuotąsias šalis pagal ES DI Akto reikalavimus" },
  "problem.successCriteria": { type: "di", hint: "DI konsultantas padės apibrėžti išmatuojamus sėkmės kriterijus", docxHint: "[UŽPILDYTI — DI konsultantas] Apibrėžti kiekybinius sėkmės kriterijus (TO-BE)" },

  // Step 2: Konceptas — mostly DI expert
  "concept.vision": { type: "di", hint: "DI konsultantas padės suformuluoti sistemos viziją", docxHint: "[UŽPILDYTI — DI konsultantas] Suformuluoti aukšto lygio DI sistemos viziją" },
  "concept.inputSystems": { type: "self", hint: "Kokias IT sistemas naudojate dabar? (DVS, el. paštas, ERP...)", docxHint: "[UŽPILDYTI] Nurodyti organizacijos IT sistemas, iš kurių DI gaus duomenis" },
  "concept.outputSystems": { type: "self", hint: "Į kokias sistemas DI turėtų grąžinti rezultatus?", docxHint: "[UŽPILDYTI] Nurodyti sistemas, į kurias DI grąžins rezultatus" },
  "concept.dataSources": { type: "self", hint: "Kokie duomenys galėtų būti naudojami DI mokymui?", docxHint: "[UŽPILDYTI] Nurodyti duomenų šaltinius DI modelio mokymui" },
  "concept.orchestration": { type: "di", hint: "DI konsultantas parinks tinkamą orkestraciją (n8n, Airflow...)", docxHint: "[UŽPILDYTI — DI konsultantas] Parinkti workflow orkestracijjos platformą" },
  "concept.modelStrategy": { type: "di", hint: "DI konsultantas padės pasirinkti modelio tipą", docxHint: "[UŽPILDYTI — DI konsultantas] Pasirinkti DI modelio strategiją (Cloud LLM, lokalus, hibridinis...)" },
  "concept.modelRationale": { type: "di", hint: "DI konsultantas pagrįs modelio pasirinkimą", docxHint: "[UŽPILDYTI — DI konsultantas] Pagrįsti DI modelio strategijos pasirinkimą" },
  "concept.oversightLevel": { type: "di+legal", hint: "DI konsultantas + teisininkas — priežiūros lygis priklauso nuo techninių galimybių ir teisinių reikalavimų", docxHint: "[UŽPILDYTI — DI konsultantas + Teisininkas] Nustatyti žmogiškosios priežiūros lygį pagal Art. 14" },
  "concept.overrideMechanism": { type: "di+legal", hint: "DI konsultantas + teisininkas — override turi būti ir techniškai įmanomas, ir teisiškai pakankamas", docxHint: "[UŽPILDYTI — DI konsultantas + Teisininkas] Aprašyti override mechanizmą (Art. 14)" },
  "concept.personalData": { type: "legal", hint: "Teisininkas/DAP padės identifikuoti tvarkomus asmens duomenis", docxHint: "[UŽPILDYTI — Teisininkas/DAP] Identifikuoti tvarkomus asmens duomenis (BDAR)" },
  "concept.dataMinimization": { type: "di+legal", hint: "DI konsultantas + DAP — techninės ir teisinės duomenų minimizavimo priemonės", docxHint: "[UŽPILDYTI — DI konsultantas + DAP] Aprašyti duomenų minimizavimo priemones (BDAR Art. 5)" },
  "concept.gdprChecks": { type: "legal", hint: "Teisininkas/DAP atliks BDAR atitikties patikrinimą", docxHint: "[UŽPILDYTI — Teisininkas/DAP] Atlikti BDAR atitikties patikrinimą" },
  "concept.phase1": { type: "di", hint: "DI konsultantas padės suplanuoti PoC etapą", docxHint: "[UŽPILDYTI — DI konsultantas] Suplanuoti PoC/Sandbox fazę" },
  "concept.phase2": { type: "di", hint: "DI konsultantas padės suplanuoti pilotą", docxHint: "[UŽPILDYTI — DI konsultantas] Suplanuoti piloto fazę" },
  "concept.phase3": { type: "di", hint: "DI konsultantas padės suplanuoti produkcinį diegimą", docxHint: "[UŽPILDYTI — DI konsultantas] Suplanuoti produkcijos fazę" },

  // Step 3: Evals — uses its own needsConsult mechanism, not FIELD_EXPERTISE

  // Step 4: Architektūra — mostly DI expert
  "architecture.selectedComponents": { type: "di", hint: "DI konsultantas padės pasirinkti sistemos komponentus", docxHint: "[UŽPILDYTI — DI konsultantas] Pasirinkti architektūros komponentus" },
  "architecture.dataFlow": { type: "di", hint: "DI konsultantas aprašys duomenų srautą per sistemą", docxHint: "[UŽPILDYTI — DI konsultantas] Aprašyti duomenų srautą per DI sistemą" },
  "architecture.infrastructure": { type: "di+legal", hint: "DI konsultantas + teisininkas — infrastruktūros pasirinkimas turi atitikti duomenų suverenumo reikalavimus", docxHint: "[UŽPILDYTI — DI konsultantas + Teisininkas] Pasirinkti diegimo infrastruktūrą" },
  "architecture.securityReqs": { type: "di+legal", hint: "DI konsultantas + teisininkas — saugumo reikalavimai apima ir techninius, ir teisinius aspektus", docxHint: "[UŽPILDYTI — DI konsultantas + Teisininkas] Apibrėžti saugumo reikalavimus" },
  "architecture.scaleReqs": { type: "di", hint: "DI konsultantas padės įvertinti mastelio reikalavimus", docxHint: "[UŽPILDYTI — DI konsultantas] Apibrėžti mastelio reikalavimus" },
  "architecture.risks": { type: "di+legal", hint: "DI konsultantas + teisininkas — rizikos apima ir techninius, ir teisinius/atitikties aspektus", docxHint: "[UŽPILDYTI — DI konsultantas + Teisininkas] Identifikuoti rizikas ir mitigacijos priemones" },
};

const EXPERTISE_LABELS: Record<ExpertiseType, { label: string; color: string; bg: string }> = {
  self: { label: "Jūsų žinios", color: "#94a3b8", bg: "#334155" },
  di: { label: "DI konsultantas", color: "#93c5fd", bg: "#1e40af25" },
  legal: { label: "Teisininkas / DAP", color: "#c4b5fd", bg: "#7c3aed25" },
  "di+legal": { label: "DI kons. + Teisininkas", color: "#fbbf24", bg: "#a16207aa" },
};

function FieldHint({ fieldKey, isEmpty, isConsulted, onConsult, onCancelConsult }: {
  fieldKey: string;
  isEmpty: boolean;
  isConsulted?: boolean;
  onConsult?: (fieldKey: string) => void;
  onCancelConsult?: (fieldKey: string) => void;
}) {
  const expertise = FIELD_EXPERTISE[fieldKey];
  if (!expertise) return null;

  // Field is consulted and still empty — show consultation badge with cancel option
  if (isConsulted && isEmpty) {
    const style = EXPERTISE_LABELS[expertise.type === "self" ? "di" : expertise.type];
    return (
      <div style={{ marginTop: 6, padding: "8px 12px", borderRadius: 8, background: `${style.color}10`, border: `1px solid ${style.color}30`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: style.color, padding: "2px 8px", borderRadius: 10, background: `${style.color}20`, whiteSpace: "nowrap" }}>
          {style.label}
        </span>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>Pažymėta konsultacijai — {expertise.hint.charAt(0).toLowerCase() + expertise.hint.slice(1)}</span>
        {onCancelConsult && (
          <button onClick={() => onCancelConsult(fieldKey)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 11, padding: "2px 6px" }}>Atšaukti</button>
        )}
      </div>
    );
  }

  // Field is filled — green checkmark
  if (!isEmpty) {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11 }}>
        <Check size={11} style={{ color: "#059669" }} />
        <span style={{ color: "#059669", fontWeight: 500 }}>Užpildyta</span>
      </div>
    );
  }

  // Field is empty — show expert badge + "Nežinau?" button
  const style = EXPERTISE_LABELS[expertise.type];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "6px 10px", borderRadius: 6, background: style.bg, border: `1px solid ${style.color}30` }}>
        <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.4 }}>{expertise.hint}</span>
      </div>
      {onConsult && (
        <button onClick={() => onConsult(fieldKey)}
          style={{ marginTop: 4, background: "#dc262612", border: "1px solid #dc262640", borderRadius: 6, color: "#fca5a5", cursor: "pointer", fontSize: 11, fontWeight: 500, padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4, transition: "all 0.15s" }}
          onMouseEnter={(ev) => { ev.currentTarget.style.background = "#dc262625"; ev.currentTarget.style.borderColor = "#dc262680"; }}
          onMouseLeave={(ev) => { ev.currentTarget.style.background = "#dc262612"; ev.currentTarget.style.borderColor = "#dc262640"; }}>
          <AlertCircle size={11} /> Nežinau
        </button>
      )}
    </div>
  );
}

interface StepDefinition {
  id: string;
  title: string;
  icon: LucideIcon;
  desc: string;
  component: React.ComponentType<StepProps> | React.ComponentType<ReportStepProps>;
}

// ============================================================
// DATA STRUCTURES
// ============================================================

const RISK_LEVELS: RiskLevel[] = [
  { id: 0, label: "Minimali rizika", color: "#059669", bg: "#05966915", desc: "Rekomendacinis DI taikymo kodeksas" },
  { id: 1, label: "Ribota rizika", color: "#d97706", bg: "#d9770615", desc: "Skaidrumo reikalavimai (Art. 50)" },
  { id: 2, label: "Auksta rizika", color: "#ea580c", bg: "#ea580c15", desc: "Pilna atitiktis (Art. 6-49, Annex III)" },
  { id: 3, label: "Nepriimtina rizika", color: "#dc2626", bg: "#dc262615", desc: "Draudziama (Art. 5)" },
];

const ANNEX_III_CATEGORIES: string[] = [
  "Biometrinė identifikacija ir kategorizavimas",
  "Kritines infrastruktūros valdymas",
  "Švietimas ir profesinis mokymas",
  "Įdarbinimas ir darbo santykiai",
  "Esminės privačios ir viešosios paslaugos",
  "Teisėsauga",
  "Migracija, prieglobstis ir sienu kontrolė",
  "Teisingumo administravimas ir demokratiniai procesai",
];

const STAKEHOLDER_ROLES: StakeholderRole[] = [
  { id: "business", label: "Verslo vadovai", icon: Briefcase, desc: "Strateginis poreikis, ROI" },
  { id: "process", label: "Proceso savininkai", icon: ClipboardList, desc: "Kasdieniai procesai, validavimas" },
  { id: "legal", label: "Teisininkai", icon: Scale, desc: "DI Aktas, BDAR, reguliavimas" },
  { id: "dpo", label: "DAP (DPO)", icon: ShieldCheck, desc: "Asmens duomenų apsauga" },
  { id: "ethics", label: "Etikos komisija", icon: Landmark, desc: "Etiniai aspektai, šališkumas" },
  { id: "it", label: "IT architektai", icon: Monitor, desc: "Infrastruktūra, integracija" },
  { id: "ml", label: "ML inžinieriai", icon: Bot, desc: "Modeliai, duomenys, eval" },
  { id: "security", label: "Saugumo spec.", icon: Shield, desc: "Kibernetinis saugumas" },
  { id: "users", label: "Galutiniai naudotojai", icon: Users, desc: "Naudojimo patirtis" },
  { id: "governance", label: "DI governance", icon: BarChart3, desc: "Atitiktis, auditas, stebėsena" },
];

const ARCH_COMPONENTS: ArchComponent[] = [
  { id: "trigger", label: "Trigeris / Ivestis", icon: Zap, examples: ["Webhook", "SOAP API", "Cron", "El. pastas", "Forma", "Failu stebėjimas"] },
  { id: "preprocess", label: "Pirminė apdoroja", icon: RefreshCw, examples: ["OCR", "NLP tokenizacija", "Duomenu validavimas", "Formato konvertavimas", "Anonimizacija"] },
  { id: "ai_model", label: "DI modelis", icon: Brain, examples: ["LLM (Claude/GPT)", "Klasifikatorius", "NER", "OCR modelis", "Embedding", "Fine-tuned", "Ollama lokalus"] },
  { id: "logic", label: "Verslo logika", icon: Settings, examples: ["Taisykliu variklis", "Marsrutizavimas", "Prioritetizavimas", "Eskalavimas", "Workflow orkestracija"] },
  { id: "human", label: "Žmogiškoji priežiūra", icon: Eye, examples: ["Patvirtinimo UI", "Klaidu peržiūra", "Override galimybė", "Eskalavimo taisyklės", "Audit log"] },
  { id: "output", label: "Išvestis / Veiksmas", icon: Upload, examples: ["Dokumentų sukurimas", "Pranesimai", "DB irasas", "API kvietimas", "Ataskaita", "Uzduoties priskyrimas"] },
  { id: "storage", label: "Duomenų saugykla", icon: Database, examples: ["PostgreSQL", "Supabase", "Vector DB", "Failu sistema", "Redis cache"] },
  { id: "monitoring", label: "Stebėsena", icon: Radio, examples: ["Metrikos dashboard", "Anomalijų detektorius", "Drift stebėjimas", "Logai", "Alertai"] },
];

const EVAL_CATEGORIES: EvalCategory[] = [
  {
    id: "performance",
    title: "Veikimo metrikos",
    icon: TrendingUp,
    metrics: [
      { id: "accuracy", name: "Tikslumas (Accuracy)", question: "Ar apibrėžtos ir pamatuojamos tikslumas/precision/recall metrikos?", scale: ["Neapibrėžtos", "Orientacinės", "Su slenkščiais", "Stebimos realiu laiku"], weight: 4, aiActRef: "Art. 15(1) – tikslumas", stakeholders: ["ML inžinieriai", "Domeno ekspertai"] },
      { id: "robustness", name: "Patvarumas (Robustness)", question: "Ar sistema testuota su nestandartiniais/adversariniais duomenimis?", scale: ["Netestuota", "Baziniai testai", "Adversariniai testai", "Raudonoji komanda"], weight: 4, aiActRef: "Art. 15(4) – patvarumas", stakeholders: ["Saugumo specialistai", "ML inžinieriai"] },
      { id: "latency", name: "Atsakymo laikas", question: "Ar sistemos atsakymo laikas atitinka naudotojų lūkesčius?", scale: [">30s", "10-30s", "2-10s", "<2s"], weight: 3, aiActRef: "Art. 15(3)", stakeholders: ["IT architektai", "Naudotojai"] },
    ],
  },
  {
    id: "fairness",
    title: "Teisingumas ir šališkumas",
    icon: Scale,
    metrics: [
      { id: "bias", name: "Šališkumo vertinimas", question: "Ar tikrintas modelio šališkumas pagal saugomas grupes?", scale: ["Netikrintas", "Bazinė analizė", "Statistiniai testai", "Nuolatinė stebėsena"], weight: 5, aiActRef: "Art. 10(2)(f) – šališkumo aptikimas", stakeholders: ["Etikos komisija", "Domeno ekspertai", "Teisininkai"], critical: true },
      { id: "disparate", name: "Skirtingas poveikis", question: "Ar DI sprendimai nedaro neproporcinio poveikio tam tikroms grupėms?", scale: ["Netikrinta", "Identifikuota", "Matuojama", "Kompensuojama"], weight: 4, aiActRef: "Art. 10(2)(f)", stakeholders: ["Etikos komisija", "Teisininkai"] },
    ],
  },
  {
    id: "transparency",
    title: "Skaidrumas ir paaiškinamumas",
    icon: Search,
    metrics: [
      { id: "explainability", name: "Paaiškinamumas", question: "Ar DI sprendimai bus paaiškinami naudotojams?", scale: ["Juoda dėžė", "Techniniai logai", "Suprantami paaiškinimai", "Interaktyvus"], weight: 4, aiActRef: "Art. 13 – skaidrumas ir informacijos teikimas", stakeholders: ["UX dizaineriai", "Naudotojai", "Teisininkai"] },
      { id: "audit_trail", name: "Audito pėdsakas", question: "Ar visi DI sprendimai automatiškai registruojami?", scale: ["Neregistruojami", "Daliniai logai", "Pilni logai", "Su analize ir alertais"], weight: 5, aiActRef: "Art. 12 – įvykių registravimas", stakeholders: ["DI governance", "Auditoriai"], critical: true },
      { id: "user_notice", name: "Naudotojo informavimas", question: "Ar naudotojas žino, kad bendrauja su DI sistema?", scale: ["Neinformuotas", "Terms of Service", "Aktyvus pranešimas", "Interaktyvus paaiškinimas"], weight: 4, aiActRef: "Art. 50 – skaidrumo pareigos", stakeholders: ["UX", "Teisininkai"] },
      { id: "confidence", name: "Patikimumo rodikliai", question: "Ar sistema nurodo savo sprendimu patikimuma (confidence)?", scale: ["Nenurodo", "Vidinis", "Rodomas specialistui", "Rodomas visiems naudotojams"], weight: 3, aiActRef: "Art. 13", stakeholders: ["ML inžinieriai", "UX"] },
    ],
  },
  {
    id: "safety",
    title: "Saugumas ir atsparumas",
    icon: ShieldAlert,
    metrics: [
      { id: "adversarial", name: "Adversarinis atsparumas", question: "Ar sistema apsaugota nuo tyciniu manipuliavimu?", scale: ["Neapsaugota", "Bazine validacija", "Adversariniai testai", "Nuolatinis monitoringas"], weight: 4, aiActRef: "Art. 15(5) – kibernetinis saugumas", stakeholders: ["Saugumo specialistai"] },
      { id: "fallback", name: "Fallback mechanizmas", question: "Kas nutinka kai DI sistema klysta arba neveikia?", scale: ["Sistema sustoja", "Klaidos pranešimas", "Graceful degradation", "Auto-failover su žmogumi"], weight: 5, aiActRef: "Art. 15(4) – patvarumas", stakeholders: ["IT architektai", "Proceso savininkai"], critical: true },
      { id: "data_quality", name: "Duomenų kokybės kontrolė", question: "Ar uztikrinama ivesties duomenų kokybe?", scale: ["Nekontroliuojama", "Bazine validacija", "Statistine kontrolė", "Su anomaliju aptikimu"], weight: 4, aiActRef: "Art. 10 – duomenų valdymas", stakeholders: ["Duomenu inžinieriai", "Domeno ekspertai"] },
    ],
  },
  {
    id: "oversight",
    title: "Žmogiškoji priežiūra",
    icon: Eye,
    metrics: [
      { id: "human_override", name: "Override galimybė", question: "Ar žmogus gali bet kada pakeisti DI sprendimą?", scale: ["Negali", "Techninė galimybė", "Lengvai pasiekiama", "Vienu mygtuku + audit"], weight: 5, aiActRef: "Art. 14 – žmogiškoji priežiūra", stakeholders: ["Proceso savininkai", "Naudotojai"], critical: true },
      { id: "escalation", name: "Eskalavimo procesas", question: "Ar apibrėžtas procesas kai DI negali priimti sprendimo?", scale: ["Neapibrėžtas", "Ad hoc", "Struktūrizuotas", "Automatinis su SLA"], weight: 4, aiActRef: "Art. 14", stakeholders: ["Proceso savininkai", "Vadovybė"] },
      { id: "domain_validation", name: "Domeno ekspertų validavimas", question: "Ar ne-techniniai ekspertai validavo DI rezultatus?", scale: ["Nevalidavo", "Informuoti", "Peržiūrėjo", "Aktyviai testavo"], weight: 5, aiActRef: "Art. 14 – žmogiškoji priežiūra", stakeholders: ["Proceso savininkai", "Vadovybė", "Naudotojai"], critical: true },
    ],
  },
  {
    id: "operational",
    title: "Operacines ir stebesenos metrikos",
    icon: Radio,
    metrics: [
      { id: "uptime", name: "Veikimo laikas (Uptime)", question: "Koks sistemos prieinamumo reikalavimas?", scale: ["<95%", "95-99%", "99-99.5%", "99.9%+"], weight: 3, aiActRef: "", stakeholders: ["IT architektai", "DevOps"] },
      { id: "drift", name: "Modelio drift stebėsena", question: "Ar stebimas modelio veikimo pablogėjimas laikui bėgant?", scale: ["Nestebimas", "Rankinė peržiūra", "Automatinis aptikimas", "Su auto-retrain"], weight: 4, aiActRef: "Art. 72 – po pateikimo stebėsena", stakeholders: ["ML inžinieriai", "Domeno ekspertai"] },
      { id: "incident", name: "Incidentų valdymas", question: "Ar yra incidentų registravimo ir eskalavimo procesas?", scale: ["Nėra", "Ad hoc", "Struktūrizuotas", "Su automatiniais alertais"], weight: 5, aiActRef: "Art. 73 – rimtu incidentų pranešimas", stakeholders: ["Operacijų komanda", "Vadovybė", "Teisininkai"], critical: true },
      { id: "periodic_audit", name: "Periodinis auditas", question: "Ar atliekamas periodinis DI sistemos auditas?", scale: ["Nėra", "Kasmetis vidinis", "Kasmetis + išorinis", "Nuolatinis + išorinis"], weight: 4, aiActRef: "Art. 9(9) – dokumentavimas ir peržiūra", stakeholders: ["DI governance", "Išoriniai auditoriai"] },
    ],
  },
];

// ============================================================
// HELPER COMPONENTS
// ============================================================

const Card = ({ children, style = {}, highlight = false }: CardProps) => (
  <div style={{
    background: "#1e293b",
    border: `1px solid ${highlight ? "#3b82f6" : "#334155"}`,
    borderRadius: 10,
    padding: 20,
    marginBottom: 12,
    transition: "border-color 0.2s",
    ...style,
  }}>
    {children}
  </div>
);

const SectionTitle = ({ icon, title, subtitle }: SectionTitleProps) => (
  <div style={{ marginBottom: 20 }}>
    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
      {icon} {title}
    </h3>
    {subtitle && <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{subtitle}</p>}
  </div>
);

const TextArea = ({ value, onChange, placeholder, rows = 3 }: TextAreaProps) => (
  <textarea
    value={value}
    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{
      width: "100%",
      background: "#0f172a",
      border: "1px solid #334155",
      borderRadius: 8,
      color: "#e2e8f0",
      padding: "10px 14px",
      fontSize: 14,
      fontFamily: "inherit",
      resize: "vertical",
      lineHeight: 1.5,
      boxSizing: "border-box",
    }}
  />
);

const Input = ({ value, onChange, placeholder, style = {} }: InputProps) => (
  <input
    value={value}
    onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      background: "#0f172a",
      border: "1px solid #334155",
      borderRadius: 6,
      color: "#e2e8f0",
      padding: "8px 12px",
      fontSize: 14,
      fontFamily: "inherit",
      boxSizing: "border-box",
      ...style,
    }}
  />
);

const ChipSelect = ({ options, selected, onToggle, multi = true }: ChipSelectProps) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
    {options.map((opt) => {
      const optId = typeof opt === "string" ? opt : (opt.id || opt.label || "");
      const isSelected = multi ? (selected as string[]).includes(optId) : selected === optId;
      const label = typeof opt === "string" ? opt : (opt.label || opt.id || "");
      const icon = typeof opt === "string" ? null : (opt.icon || null);
      return (
        <button
          key={optId}
          onClick={() => onToggle(optId)}
          style={{
            padding: "6px 14px",
            borderRadius: 20,
            border: `1px solid ${isSelected ? "#3b82f6" : "#334155"}`,
            background: isSelected ? "#1e40af30" : "#0f172a",
            color: isSelected ? "#93c5fd" : "#94a3b8",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: isSelected ? 600 : 400,
            transition: "all 0.15s",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {icon}{label}
        </button>
      );
    })}
  </div>
);

const ProgressBar = ({ value, max, color }: ProgressBarProps) => (
  <div style={{ background: "#0f172a", borderRadius: 6, height: 6, overflow: "hidden", flex: 1 }}>
    <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: "100%", background: color || "#3b82f6", borderRadius: 6, transition: "width 0.4s ease" }} />
  </div>
);

// ============================================================
// STEP 1: PROBLEMA
// ============================================================

function StepProblem({ data, setData }: StepProps) {
  const update = (key: string, val: unknown) => setData((d) => ({ ...d, problem: { ...d.problem, [key]: val } }));
  const p = data.problem || {};
  const fc = data.fieldConsult || {};
  const markConsult = (key: string) => setData((d) => ({ ...d, fieldConsult: { ...(d.fieldConsult || {}), [key]: true } }));
  const cancelConsult = (key: string) => setData((d) => { const c = { ...(d.fieldConsult || {}) }; delete c[key]; return { ...d, fieldConsult: c }; });
  const toggleStakeholder = (id: string) => {
    const list = p.stakeholders || [];
    update("stakeholders", list.includes(id) ? list.filter((s) => s !== id) : [...list, id]);
  };

  return (
    <div>
      <Card>
        <SectionTitle icon={<FileText size={18} />} title="Problemos aprašymas" subtitle="Apibrėžkite problemą, kurią DI sistema turėtų spręsti" />
        <TextArea value={p.description || ""} onChange={(v: string) => update("description", v)} placeholder="Pvz.: ŽŪDC kasdien gauna 50-100 dokumentų per @vilys DVS. Kanceliarijos darbuotojai rankiniu būdu skirsto dokumentus pagal skyrius, priskirdami atsakingus asmenis. Procesas užima ~2h/diena, klaidos dažnis ~15%, terminų praleidimas ~8%." rows={4} />
        <FieldHint fieldKey="problem.description" isEmpty={!p.description?.trim()} />
      </Card>

      <Card>
        <SectionTitle icon={<Target size={18} />} title="Dabartinė situacija (AS-IS)" subtitle="Kaip problema sprendžiama dabar?" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Dabartinis procesas</label>
            <TextArea value={p.currentProcess || ""} onChange={(v: string) => update("currentProcess", v)} placeholder="Rankinis dokumentų skirstymas..." rows={3} />
            <FieldHint fieldKey="problem.currentProcess" isEmpty={!p.currentProcess?.trim()} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Pagrindinės problemos</label>
            <TextArea value={p.painPoints || ""} onChange={(v: string) => update("painPoints", v)} placeholder={"1. Lėtas procesas\n2. Žmogiškosios klaidos\n3. Terminų praleidimas"} rows={3} />
            <FieldHint fieldKey="problem.painPoints" isEmpty={!p.painPoints?.trim()} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Laikas (val./dieną)</label>
            <Input value={p.timeSpent || ""} onChange={(v: string) => update("timeSpent", v)} placeholder="2" style={{ width: "100%" }} />
            <FieldHint fieldKey="problem.timeSpent" isEmpty={!p.timeSpent?.trim()} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Klaidų dažnis (%)</label>
            <Input value={p.errorRate || ""} onChange={(v: string) => update("errorRate", v)} placeholder="15" style={{ width: "100%" }} />
            <FieldHint fieldKey="problem.errorRate" isEmpty={!p.errorRate?.trim()} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Apimtis (vnt./dieną)</label>
            <Input value={p.volume || ""} onChange={(v: string) => update("volume", v)} placeholder="75" style={{ width: "100%" }} />
            <FieldHint fieldKey="problem.volume" isEmpty={!p.volume?.trim()} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<Scale size={18} />} title="Rizikos klasifikacija pagal ES DI Akta" subtitle="Nustatykite sistemos rizikos lygį" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {RISK_LEVELS.map((r) => (
            <button
              key={r.id}
              onClick={() => update("riskLevel", r.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                borderRadius: 8,
                border: `2px solid ${p.riskLevel === r.id ? r.color : "#334155"}`,
                background: p.riskLevel === r.id ? r.bg : "#0f172a",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <div style={{ width: 16, height: 16, borderRadius: 8, border: `2px solid ${r.color}`, background: p.riskLevel === r.id ? r.color : "transparent", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: p.riskLevel === r.id ? r.color : "#94a3b8" }}>{r.label}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{r.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <FieldHint fieldKey="problem.riskLevel" isEmpty={p.riskLevel === undefined} isConsulted={fc["problem.riskLevel"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
        {p.riskLevel === 2 && (
          <div style={{ marginTop: 16, padding: 16, background: "#ea580c10", borderRadius: 8, border: "1px solid #ea580c33" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fdba74", marginBottom: 8 }}>Annex III kategorija (jei taikoma):</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ANNEX_III_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => update("annexCategory", cat)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: `1px solid ${p.annexCategory === cat ? "#ea580c" : "#334155"}`,
                    background: p.annexCategory === cat ? "#ea580c20" : "transparent",
                    color: p.annexCategory === cat ? "#fdba74" : "#94a3b8",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle icon={<Lightbulb size={18} />} title="Kodėl DI?" subtitle="Pagriskite, kodėl DI yra tinkamas sprendimąs" />
        <TextArea value={p.whyAI || ""} onChange={(v: string) => update("whyAI", v)} placeholder="Pvz.: Dokumentų klasifikavimas pagal turinį reikalauja natūralios kalbos supratimo, kurio neįmanoma realizuoti taisyklėmis. DI gali pasiekti >90% tikslumą su žmogiškąja priežiūra (human-in-the-loop)." rows={3} />
        <FieldHint fieldKey="problem.whyAI" isEmpty={!p.whyAI?.trim()} />
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Ar svarstyete alternatyvas be DI?</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["Taisyklėmis pagrįstas", "RPA (automatizacija)", "Papildomas personalas", "Proceso pertvarka"].map((alt) => {
              const isSelected = (p.alternatives || []).includes(alt);
              return (
                <button
                  key={alt}
                  onClick={() => {
                    const list = p.alternatives || [];
                    update("alternatives", isSelected ? list.filter((a) => a !== alt) : [...list, alt]);
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: `1px solid ${isSelected ? "#3b82f6" : "#334155"}`,
                    background: isSelected ? "#1e40af20" : "#0f172a",
                    color: isSelected ? "#93c5fd" : "#94a3b8",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {alt}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<Users size={18} />} title="Suinteresuotosios šalys" subtitle={<span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>Kas turi dalyvauti sprendimų priėmime? (<Scale size={12} /> = ne tik technikai!)</span> as unknown as string} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          {STAKEHOLDER_ROLES.map((s) => {
            const isSelected = (p.stakeholders || []).includes(s.id);
            const IconComp = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => toggleStakeholder(s.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${isSelected ? "#3b82f6" : "#334155"}`,
                  background: isSelected ? "#1e40af15" : "#0f172a",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <IconComp size={20} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? "#93c5fd" : "#94a3b8" }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
        <FieldHint fieldKey="problem.stakeholders" isEmpty={!(p.stakeholders?.length)} isConsulted={fc["problem.stakeholders"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
      </Card>

      <Card>
        <SectionTitle icon={<CheckCircle size={18} />} title="Sėkmės kriterijai (TO-BE)" subtitle="Kaip atrodys sėkmė?" />
        <TextArea value={p.successCriteria || ""} onChange={(v: string) => update("successCriteria", v)} placeholder={"1. Dokumentų klasifikavimo tikslumas >=90%\n2. Apdorojimo laikas <30 sek./dokumentas\n3. Terminų praleidimas sumažėja iki <2%\n4. Darbuotojų laikas sutaupomas >=1.5 val./diena"} rows={4} />
        <FieldHint fieldKey="problem.successCriteria" isEmpty={!p.successCriteria?.trim()} isConsulted={fc["problem.successCriteria"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
      </Card>
    </div>
  );
}

// ============================================================
// STEP 2: SISTEMOS KONCEPTAS
// ============================================================

function StepConcept({ data, setData }: StepProps) {
  const update = (key: string, val: unknown) => setData((d) => ({ ...d, concept: { ...d.concept, [key]: val } }));
  const c = data.concept || {};
  const fc = data.fieldConsult || {};
  const markConsult = (key: string) => setData((d) => ({ ...d, fieldConsult: { ...(d.fieldConsult || {}), [key]: true } }));
  const cancelConsult = (key: string) => setData((d) => { const cc = { ...(d.fieldConsult || {}) }; delete cc[key]; return { ...d, fieldConsult: cc }; });

  return (
    <div>
      <Card>
        <SectionTitle icon={<Building2 size={18} />} title="Sistemos vizija" subtitle="Aukšto lygio sistemos aprašymas" />
        <TextArea value={c.vision || ""} onChange={(v: string) => update("vision", v)} placeholder="Pvz.: Multi-agentu DI sistema, kuri automatiškai klasifikuoja gaunamus dokumentus ŽŪDC @vilys DVS sistemoje, priskiria atsakingus skyrius ir specialistus, stebi terminųs ir aptinka anomalijas organizacijos dokumentų srautuose." rows={3} />
        <FieldHint fieldKey="concept.vision" isEmpty={!c.vision?.trim()} isConsulted={fc["concept.vision"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
      </Card>

      <Card>
        <SectionTitle icon={<Plug size={18} />} title="Integracijos taskai" subtitle="Su kokiomis sistemomis DI tures saveikauti?" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { key: "inputSystems", label: "Įvesties sistemos", placeholder: "Pvz.: @vilys DVS (SOAP API), El. pastas" },
            { key: "outputSystems", label: "Išvesties sistemos", placeholder: "Pvz.: @vilys DVS, Pranešimų sistema" },
            { key: "dataSources", label: "Duomenų šaltiniai", placeholder: "Pvz.: Istoriniai dokumentai, Org. struktūra" },
            { key: "orchestration", label: "Orkestracija", placeholder: "Pvz.: n8n, Apache Airflow, Custom" },
          ].map((f) => {
            const isSelf = FIELD_EXPERTISE[`concept.${f.key}`]?.type === "self";
            return (
              <div key={f.key}>
                <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{f.label}</label>
                <TextArea value={(c[f.key] as string) || ""} onChange={(v: string) => update(f.key, v)} placeholder={f.placeholder} rows={2} />
                <FieldHint fieldKey={`concept.${f.key}`} isEmpty={!((c[f.key] as string) || "").trim()} {...(isSelf ? {} : { isConsulted: fc[`concept.${f.key}`], onConsult: markConsult, onCancelConsult: cancelConsult })} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<Bot size={18} />} title="DI modelio strategija" subtitle="Koks DI modelis bus naudojamas?" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {[
            { id: "cloud_llm", label: "Cloud LLM (Claude, GPT)", icon: Cloud },
            { id: "local_llm", label: "Lokalus LLM (Ollama)", icon: Home },
            { id: "custom_ml", label: "Custom ML modelis", icon: Microscope },
            { id: "hybrid", label: "Hibridinis", icon: GitBranch },
            { id: "rag", label: "RAG sistema", icon: BookOpen },
            { id: "fine_tuned", label: "Fine-tuned modelis", icon: Target },
          ].map((opt) => {
            const isSelected = (c.modelStrategy || []).includes(opt.id);
            const OptIcon = opt.icon;
            return (
              <button key={opt.id} onClick={() => {
                const list = c.modelStrategy || [];
                update("modelStrategy", isSelected ? list.filter((x) => x !== opt.id) : [...list, opt.id]);
              }} style={{
                padding: "8px 16px", borderRadius: 8,
                border: `1px solid ${isSelected ? "#3b82f6" : "#334155"}`,
                background: isSelected ? "#1e40af20" : "#0f172a",
                color: isSelected ? "#93c5fd" : "#94a3b8",
                cursor: "pointer", fontSize: 13, fontWeight: isSelected ? 600 : 400,
                display: "flex", alignItems: "center", gap: 6,
              }}><OptIcon size={14} /> {opt.label}</button>
            );
          })}
        </div>
        <FieldHint fieldKey="concept.modelStrategy" isEmpty={!(c.modelStrategy?.length)} isConsulted={fc["concept.modelStrategy"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
        <TextArea value={c.modelRationale || ""} onChange={(v: string) => update("modelRationale", v)} placeholder="Pagrindimas: Kodėl pasirinkta ši modelio strategija? Duomenų saugumo, kainos, veikimo aspektai..." rows={2} />
        <FieldHint fieldKey="concept.modelRationale" isEmpty={!c.modelRationale?.trim()} isConsulted={fc["concept.modelRationale"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
      </Card>

      <Card>
        <SectionTitle icon={<Eye size={18} />} title="Žmogiškoji priežiūra (Human Oversight)" subtitle="Art. 14 -- kaip žmogus kontroliuos DI sprendimus?" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { id: "hitl", label: "Human-in-the-Loop", desc: "Žmogus patvirtina kiekviena DI sprendimą pries veiksma", level: "Auksciausias" },
            { id: "hotl", label: "Human-on-the-Loop", desc: "DI veikia autonomiskai, žmogus stebi ir gali sustabdyti", level: "Vidutinis" },
            { id: "hocl", label: "Human-over-the-Loop", desc: "Žmogus nustato taisyklės ir periodiskai peržiūri", level: "Bazinis" },
            { id: "auto", label: "Pilnai automatinis", desc: "DI veikia be žmogiškosios priežiūros", level: "Nėra" },
          ].map((opt) => {
            const isSelected = c.oversightLevel === opt.id;
            const isRisky = opt.id === "auto" && (data.problem?.riskLevel || 0) >= 2;
            return (
              <button key={opt.id} onClick={() => update("oversightLevel", opt.id)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 8,
                border: `2px solid ${isRisky ? "#dc2626" : isSelected ? "#3b82f6" : "#334155"}`,
                background: isSelected ? "#1e40af15" : "#0f172a",
                cursor: "pointer", textAlign: "left",
              }}>
                <div style={{ width: 14, height: 14, borderRadius: 7, border: `2px solid ${isSelected ? "#3b82f6" : "#475569"}`, background: isSelected ? "#3b82f6" : "transparent", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? "#93c5fd" : "#94a3b8" }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{opt.desc}</div>
                </div>
                <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 10, background: "#334155", color: "#94a3b8" }}>{opt.level}</span>
                {isRisky && <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 10, background: "#dc262630", color: "#fca5a5", display: "inline-flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12} /> Nerekomenduojama aukštai rizikai</span>}
              </button>
            );
          })}
        </div>
        <FieldHint fieldKey="concept.oversightLevel" isEmpty={!c.oversightLevel} isConsulted={fc["concept.oversightLevel"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Override mechanizmas</label>
          <TextArea value={c.overrideMechanism || ""} onChange={(v: string) => update("overrideMechanism", v)} placeholder="Aprašykite, kaip naudotojas gales pakeisti DI sprendimą..." rows={2} />
          <FieldHint fieldKey="concept.overrideMechanism" isEmpty={!c.overrideMechanism?.trim()} isConsulted={fc["concept.overrideMechanism"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<Lock size={18} />} title="Duomenų apsauga ir BDAR" subtitle="Asmens duomenų tvarkymas DI sistemoje" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Tvarkomi asmens duomenys</label>
            <TextArea value={c.personalData || ""} onChange={(v: string) => update("personalData", v)} placeholder="Vardai, pareigos, el. pasto adresai dokumentuose..." rows={2} />
            <FieldHint fieldKey="concept.personalData" isEmpty={!c.personalData?.trim()} isConsulted={fc["concept.personalData"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Duomenu minimizavimas</label>
            <TextArea value={c.dataMinimization || ""} onChange={(v: string) => update("dataMinimization", v)} placeholder="Kaip uztikriname, kad naudojami tik butini duomenys..." rows={2} />
            <FieldHint fieldKey="concept.dataMinimization" isEmpty={!c.dataMinimization?.trim()} isConsulted={fc["concept.dataMinimization"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
          </div>
        </div>
        <FieldHint fieldKey="concept.gdprChecks" isEmpty={!(c.gdprChecks?.length)} isConsulted={fc["concept.gdprChecks"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {[
            { id: "dpia", label: "DPIA atliktas" },
            { id: "legal_basis", label: "Teisinis pagrindas apibrėžtas" },
            { id: "retention", label: "Saugojimo terminai nustatyti" },
            { id: "subject_rights", label: "Duomenu subjektu teises" },
          ].map((check) => {
            const isChecked = (c.gdprChecks || []).includes(check.id);
            return (
              <button key={check.id} onClick={() => {
                const list = c.gdprChecks || [];
                update("gdprChecks", isChecked ? list.filter((x) => x !== check.id) : [...list, check.id]);
              }} style={{
                padding: "6px 14px", borderRadius: 20,
                border: `1px solid ${isChecked ? "#059669" : "#334155"}`,
                background: isChecked ? "#05966920" : "#0f172a",
                color: isChecked ? "#6ee7b7" : "#94a3b8",
                cursor: "pointer", fontSize: 12, fontWeight: isChecked ? 600 : 400,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {isChecked ? <><Check size={12} /> </> : <span style={{ marginRight: 2 }}>{"o"} </span>}{check.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<Calendar size={18} />} title="Diegimo planas" subtitle="Etapai ir laiko planas" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { key: "phase1", label: "1 faze: PoC / Sandbox", placeholder: "Trukmė, apimtis..." },
            { key: "phase2", label: "2 faze: Pilotas", placeholder: "Ribota aplinka, testavimas..." },
            { key: "phase3", label: "3 faze: Produkcija", placeholder: "Pilnas diegimas..." },
          ].map((f) => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{f.label}</label>
              <TextArea value={(c[f.key] as string) || ""} onChange={(v: string) => update(f.key, v)} placeholder={f.placeholder} rows={3} />
              <FieldHint fieldKey={`concept.${f.key}`} isEmpty={!((c[f.key] as string) || "").trim()} isConsulted={fc[`concept.${f.key}`]} onConsult={markConsult} onCancelConsult={cancelConsult} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// STEP 3: EVALS / METRIKOS
// ============================================================

function StepEvals({ data, setData }: StepProps) {
  const update = (key: string, val: unknown) => setData((d) => ({ ...d, evals: { ...d.evals, [key]: val } }));
  const e = data.evals || {};
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const handleScore = useCallback((metricId: string, value: number) => {
    const scores = { ...(e.scores || {}), [metricId]: value };
    // Clear consultation flag when scoring
    const consult = { ...(e.needsConsult || {}) };
    delete consult[metricId];
    update("scores", scores);
    setData((d) => ({ ...d, evals: { ...d.evals, scores, needsConsult: consult } }));
  }, [e.scores, e.needsConsult]);

  const handleConsult = useCallback((metricId: string) => {
    const consult = { ...(e.needsConsult || {}), [metricId]: true };
    // Remove from scores when marking for consultation
    const scores = { ...(e.scores || {}) };
    delete scores[metricId];
    setData((d) => ({ ...d, evals: { ...d.evals, scores, needsConsult: consult } }));
  }, [e.scores, e.needsConsult]);

  const scores = e.scores || {};
  const needsConsult = e.needsConsult || {};
  const allMetrics = EVAL_CATEGORIES.flatMap((c) => c.metrics);
  const answeredCount = allMetrics.filter((m) => scores[m.id] !== undefined || needsConsult[m.id]).length;
  const criticalMetrics = allMetrics.filter((m) => m.critical);
  const criticalIssues = criticalMetrics.filter((m) => scores[m.id] !== undefined && scores[m.id] <= 1);

  const totalWeighted = allMetrics.reduce((sum, m) => sum + (scores[m.id] !== undefined ? m.weight * scores[m.id] : 0), 0);
  const maxWeighted = allMetrics.reduce((sum, m) => sum + m.weight * 3, 0);
  const overallPct = maxWeighted > 0 ? Math.round((totalWeighted / maxWeighted) * 100) : 0;

  const getColor = (pct: number): string => pct >= 75 ? "#059669" : pct >= 50 ? "#d97706" : pct >= 25 ? "#ea580c" : "#dc2626";
  const btnColors = [
    { bg: "#dc262620", border: "#dc2626", text: "#fca5a5" },
    { bg: "#ea580c20", border: "#ea580c", text: "#fdba74" },
    { bg: "#d9770620", border: "#d97706", text: "#fcd34d" },
    { bg: "#05966920", border: "#059669", text: "#6ee7b7" },
  ];

  return (
    <div>
      {/* Score header */}
      <Card style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <SectionTitle icon={<BarChart3 size={18} />} title="DI Sistemos Vertinimo Metrikos" subtitle="Įvertinkite kiekvieną metriką 4 lygių skalėje (0-3). Kritinės metrikos pažymėtos raudonai." />
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: getColor(overallPct) }}>{overallPct}%</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Bendras balas</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#3b82f6" }}>{answeredCount}/{allMetrics.length}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Atsakyta</div>
            </div>
            {Object.keys(needsConsult).length > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#93c5fd" }}>{Object.keys(needsConsult).length}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Konsultacijai</div>
              </div>
            )}
          </div>
        </div>
        {criticalIssues.length > 0 && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#dc262615", border: "1px solid #dc2626", borderRadius: 8 }}>
            <span style={{ fontSize: 13, color: "#fca5a5", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><AlertCircle size={14} style={{ color: "#fca5a5" }} /> Kritinės spragos: </span>
            <span style={{ fontSize: 13, color: "#fca5a5" }}>{criticalIssues.map((m) => m.name).join(", ")}</span>
          </div>
        )}
      </Card>

      {/* Categories */}
      {EVAL_CATEGORIES.map((cat) => {
        const catScore = cat.metrics.reduce((s, m) => s + (scores[m.id] !== undefined ? m.weight * scores[m.id] : 0), 0);
        const catMax = cat.metrics.reduce((s, m) => s + m.weight * 3, 0);
        const catPct = catMax > 0 ? Math.round((catScore / catMax) * 100) : 0;
        const CatIcon = cat.icon;

        return (
          <Card key={cat.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <SectionTitle icon={<CatIcon size={18} />} title={cat.title} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 80, background: "#0f172a", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${catPct}%`, height: "100%", background: getColor(catPct), borderRadius: 4, transition: "width 0.4s" }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: getColor(catPct), minWidth: 36 }}>{catPct}%</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cat.metrics.map((metric) => {
                const val = scores[metric.id];
                const isExpanded = expandedMetric === metric.id;
                return (
                  <div key={metric.id} style={{
                    background: needsConsult[metric.id] ? "#1e40af08" : "#0f172a",
                    border: `1px solid ${metric.critical && val !== undefined && val <= 1 ? "#dc2626" : needsConsult[metric.id] ? "#93c5fd40" : "#334155"}`,
                    borderRadius: 10, padding: "16px 18px", transition: "border-color 0.3s",
                  }}>
                    {/* Metric header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          {metric.critical && (
                            <span style={{ fontSize: 10, background: "#dc262630", color: "#fca5a5", padding: "1px 8px", borderRadius: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Kritinis</span>
                          )}
                          <span style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{metric.name}</span>
                          <span style={{ fontSize: 11, color: "#475569" }}>svoris x{metric.weight}</span>
                        </div>
                        <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>{metric.question}</p>
                      </div>
                      <button onClick={() => setExpandedMetric(isExpanded ? null : metric.id)}
                        style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12, padding: "4px 8px", flexShrink: 0 }}>
                        {isExpanded ? "\u25B2" : "\u25BC"} Info
                      </button>
                    </div>

                    {/* Scale buttons */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {metric.scale.map((label, si) => {
                        const isSelected = val === si;
                        const bc = btnColors[si];
                        return (
                          <button key={si} onClick={() => handleScore(metric.id, si)}
                            style={{
                              flex: 1, minWidth: 110, padding: "8px 10px", borderRadius: 8,
                              border: `2px solid ${isSelected ? bc.border : "#334155"}`,
                              background: isSelected ? bc.bg : "#1e293b",
                              color: isSelected ? bc.text : "#64748b",
                              cursor: "pointer", fontSize: 12, fontWeight: isSelected ? 700 : 400,
                              transition: "all 0.15s", textAlign: "center",
                            }}>
                            <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 2 }}>{si}/3</div>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {/* Consultation option */}
                    {needsConsult[metric.id] ? (
                      <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#1e40af15", border: "1px solid #93c5fd30", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#93c5fd", padding: "2px 8px", borderRadius: 10, background: "#1e40af25", whiteSpace: "nowrap" }}>DI konsultantas</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>Ši metrika bus pažymėta konsultacijai su DI ekspertu</span>
                        <button onClick={() => {
                          const c2 = { ...(e.needsConsult || {}) }; delete c2[metric.id];
                          setData((d) => ({ ...d, evals: { ...d.evals, needsConsult: c2 } }));
                        }} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 11, padding: "2px 6px" }}>Atšaukti</button>
                      </div>
                    ) : val === undefined ? (
                      <button onClick={() => handleConsult(metric.id)}
                        style={{ marginTop: 8, background: "none", border: "1px solid #334155", borderRadius: 6, color: "#64748b", cursor: "pointer", fontSize: 11, padding: "4px 12px", display: "flex", alignItems: "center", gap: 4 }}>
                        <Search size={11} /> Nežinau? Pažymėti konsultacijai
                      </button>
                    ) : null}

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #334155" }}>
                        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 12 }}>
                          <div>
                            <span style={{ color: "#64748b" }}>DI Akto nuoroda: </span>
                            <span style={{ color: "#93c5fd", fontWeight: 500 }}>{metric.aiActRef}</span>
                          </div>
                          <div>
                            <span style={{ color: "#64748b" }}>Suinteresuotieji: </span>
                            {metric.stakeholders.map((s, si) => (
                              <span key={si} style={{ background: "#334155", padding: "2px 8px", borderRadius: 10, fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {/* Testing strategy */}
      <Card>
        <SectionTitle icon={<FlaskConical size={18} />} title="Testavimo strategija" subtitle="Kaip bus tikrinamos metrikos?" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {["Unit testai", "Integraciniai testai", "A/B testavimas", "Adversariniai testai", "Raudonoji komanda", "Naudotoju testavimas", "Streso testai", "Regresijos testai"].map((t) => {
            const isSelected = (e.testingMethods || []).includes(t);
            return (
              <button key={t} onClick={() => {
                const list = e.testingMethods || [];
                update("testingMethods", isSelected ? list.filter((x) => x !== t) : [...list, t]);
              }} style={{
                padding: "6px 14px", borderRadius: 20,
                border: `1px solid ${isSelected ? "#3b82f6" : "#334155"}`,
                background: isSelected ? "#1e40af20" : "#0f172a",
                color: isSelected ? "#93c5fd" : "#94a3b8",
                cursor: "pointer", fontSize: 12, fontWeight: isSelected ? 600 : 400,
                display: "flex", alignItems: "center", gap: 4,
              }}>{isSelected ? <><Check size={12} /> </> : ""}{t}</button>
            );
          })}
        </div>
        <TextArea value={e.testingNotes || ""} onChange={(v: string) => update("testingNotes", v)} placeholder="Papildomi testavimo reikalavimai ar pastabos..." rows={2} />
      </Card>
    </div>
  );
}

// ============================================================
// STEP 4: SISTEMOS PROTOTIPAS (ARCHITEKTURA)
// ============================================================

function StepArchitecture({ data, setData }: StepProps) {
  const update = (key: string, val: unknown) => setData((d) => ({ ...d, architecture: { ...d.architecture, [key]: val } }));
  const a = data.architecture || {};
  const fc = data.fieldConsult || {};
  const markConsult = (key: string) => setData((d) => ({ ...d, fieldConsult: { ...(d.fieldConsult || {}), [key]: true } }));
  const cancelConsult = (key: string) => setData((d) => { const cc = { ...(d.fieldConsult || {}) }; delete cc[key]; return { ...d, fieldConsult: cc }; });
  const [selectedComp, setSelectedComp] = useState<string | null>(null);

  const setCompDetail = (compId: string, field: string, val: unknown) => {
    const details = { ...(a.componentDetails || {}) };
    details[compId] = { ...(details[compId] || {}), [field]: val };
    update("componentDetails", details);
  };

  const toggleComponent = (compId: string) => {
    const list = a.selectedComponents || [];
    update("selectedComponents", list.includes(compId) ? list.filter((x) => x !== compId) : [...list, compId]);
  };

  return (
    <div>
      <Card>
        <SectionTitle icon={<Puzzle size={18} />} title="Architektūros komponentai" subtitle="Pasirinkite ir sukonfigūruokite sistemos komponentus" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {ARCH_COMPONENTS.map((comp) => {
            const isSelected = (a.selectedComponents || []).includes(comp.id);
            const isOpen = selectedComp === comp.id;
            const details = (a.componentDetails || {})[comp.id] || {};
            const CompIcon = comp.icon;
            return (
              <div key={comp.id} style={{
                background: isSelected ? "#1e40af10" : "#0f172a",
                border: `2px solid ${isSelected ? "#3b82f6" : "#334155"}`,
                borderRadius: 10, overflow: "hidden", transition: "all 0.2s",
              }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer" }}
                  onClick={() => toggleComponent(comp.id)}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, border: `2px solid ${isSelected ? "#3b82f6" : "#475569"}`,
                    background: isSelected ? "#3b82f6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: "#fff", flexShrink: 0,
                  }}>{isSelected ? <Check size={12} /> : ""}</div>
                  <CompIcon size={20} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? "#93c5fd" : "#94a3b8" }}>{comp.label}</div>
                  </div>
                  {isSelected && (
                    <button onClick={(ev: MouseEvent<HTMLButtonElement>) => { ev.stopPropagation(); setSelectedComp(isOpen ? null : comp.id); }}
                      style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12, padding: "4px 8px" }}>
                      {isOpen ? "\u25B2" : "\u25BC"} Detales
                    </button>
                  )}
                </div>
                {isSelected && isOpen && (
                  <div style={{ padding: "0 16px 14px", borderTop: "1px solid #334155" }}>
                    <div style={{ marginTop: 10 }}>
                      <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Technologija / Įrankis</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                        {comp.examples.map((ex) => {
                          const isSel = (details.technologies || []).includes(ex);
                          return (
                            <button key={ex} onClick={() => {
                              const list = details.technologies || [];
                              setCompDetail(comp.id, "technologies", isSel ? list.filter((x) => x !== ex) : [...list, ex]);
                            }} style={{
                              padding: "3px 10px", borderRadius: 12, fontSize: 11,
                              border: `1px solid ${isSel ? "#3b82f6" : "#334155"}`,
                              background: isSel ? "#1e40af30" : "transparent",
                              color: isSel ? "#93c5fd" : "#64748b", cursor: "pointer",
                            }}>{ex}</button>
                          );
                        })}
                      </div>
                      <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Pastabos</label>
                      <TextArea value={details.notes || ""} onChange={(v: string) => setCompDetail(comp.id, "notes", v)} placeholder="Konfigūracija, specifika..." rows={2} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <FieldHint fieldKey="architecture.selectedComponents" isEmpty={!(a.selectedComponents?.length)} isConsulted={fc["architecture.selectedComponents"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
      </Card>

      <Card>
        <SectionTitle icon={<GitBranch size={18} />} title="Duomenų srautas (Data Flow)" subtitle="Aprašykite, kaip duomenys keliauja per sistema" />
        <TextArea value={a.dataFlow || ""} onChange={(v: string) => update("dataFlow", v)} placeholder={"1. Dokumentas ateina per @vilys SOAP API (Webhook)\n2. OCR istraukia teksta is PDF/skanuoto dokumento\n3. LLM klasifikuoja: tipas, skyrius, prioritetas, atsakingas\n4. Verslo taisyklės patikrina ir marsrutuoja\n5. Žmogus patvirtina (jei confidence < 85%)\n6. Rezultatas grazinamas i @vilys per SOAP\n7. Metrikos registruojamos Supabase"} rows={7} />
        <FieldHint fieldKey="architecture.dataFlow" isEmpty={!a.dataFlow?.trim()} isConsulted={fc["architecture.dataFlow"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
      </Card>

      <Card>
        <SectionTitle icon={<Building2 size={18} />} title="Infrastruktūros planas" subtitle="Kur ir kaip bus diegiama sistema?" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {[
            { id: "on_premise", label: "On-Premise", icon: Building },
            { id: "private_cloud", label: "Privati debesija", icon: Cloud },
            { id: "public_cloud", label: "Viešoji debesija", icon: Globe },
            { id: "hybrid", label: "Hibridinė", icon: GitBranch },
            { id: "govai_sandbox", label: "GovAI smėliadėžė", icon: Landmark },
          ].map((opt) => {
            const isSelected = a.infrastructure === opt.id;
            const OptIcon = opt.icon;
            return (
              <button key={opt.id} onClick={() => update("infrastructure", opt.id)} style={{
                padding: "8px 18px", borderRadius: 8,
                border: `2px solid ${isSelected ? "#3b82f6" : "#334155"}`,
                background: isSelected ? "#1e40af20" : "#0f172a",
                color: isSelected ? "#93c5fd" : "#94a3b8",
                cursor: "pointer", fontSize: 13, fontWeight: isSelected ? 600 : 400,
                display: "flex", alignItems: "center", gap: 6,
              }}><OptIcon size={14} /> {opt.label}</button>
            );
          })}
        </div>
        <FieldHint fieldKey="architecture.infrastructure" isEmpty={!a.infrastructure} isConsulted={fc["architecture.infrastructure"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Saugumo reikalavimai</label>
            <TextArea value={a.securityReqs || ""} onChange={(v: string) => update("securityReqs", v)} placeholder="Tinklo izoliacija, sifravimas, prieigos kontrole..." rows={3} />
            <FieldHint fieldKey="architecture.securityReqs" isEmpty={!a.securityReqs?.trim()} isConsulted={fc["architecture.securityReqs"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Mastelio reikalavimai</label>
            <TextArea value={a.scaleReqs || ""} onChange={(v: string) => update("scaleReqs", v)} placeholder="Apkrovos lukesciai, augimo planas..." rows={3} />
            <FieldHint fieldKey="architecture.scaleReqs" isEmpty={!a.scaleReqs?.trim()} isConsulted={fc["architecture.scaleReqs"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<AlertTriangle size={18} />} title="Rizikos ir mitigacijos" subtitle="Techninės ir organizacines rizikos" />
        <TextArea value={a.risks || ""} onChange={(v: string) => update("risks", v)} placeholder={"Rizika | Tikimybe | Poveikis | Mitigacija\n------|----------|---------|----------\n@vilys API nestabilumas | Vidutine | Aukstas | Retry logika + cache\nModelio hallucinations | Auksta | Vidutinis | Human-in-the-loop + confidence threshold\nDuomenu nutekejimas | Zema | Kritinis | On-premise diegimas, VPN, audit logai"} rows={6} />
        <FieldHint fieldKey="architecture.risks" isEmpty={!a.risks?.trim()} isConsulted={fc["architecture.risks"]} onConsult={markConsult} onCancelConsult={cancelConsult} />
      </Card>
    </div>
  );
}

// ============================================================
// STEP 5: RIZIKŲ REGISTRAS (ES DI AKTAS)
// ============================================================

const RISK_STATUS_LABELS: Record<RiskStatus, { label: string; color: string }> = {
  open: { label: "Atvira", color: "#f97316" },
  managed: { label: "Valdoma", color: "#3b82f6" },
  accepted: { label: "Priimta", color: "#22c55e" },
  not_applicable: { label: "Netaikoma", color: "#64748b" },
};

const RISK_IMPACT_LABELS: Record<RiskImpact, { label: string; color: string }> = {
  critical: { label: "Kritinis", color: "#ef4444" },
  high: { label: "Aukštas", color: "#f97316" },
  medium: { label: "Vidutinis", color: "#f59e0b" },
  low: { label: "Žemas", color: "#22c55e" },
};

const RISK_LIKELIHOOD_LABELS: Record<RiskLikelihood, { label: string; color: string }> = {
  high: { label: "Aukšta", color: "#ef4444" },
  medium: { label: "Vidutinė", color: "#f97316" },
  low: { label: "Žema", color: "#22c55e" },
};

const ARTICLE_COLORS: Record<string, string> = {
  "Art. 9": "#f97316",
  "Art. 10": "#3b82f6",
  "Art. 11": "#8b5cf6",
  "Art. 12": "#06b6d4",
  "Art. 13": "#10b981",
  "Art. 14": "#ef4444",
  "Art. 15": "#f59e0b",
  "Art. 50": "#ec4899",
  "BDAR": "#6366f1",
};

const DEFAULT_RISKS: RiskEntry[] = [
  { id: "R-01", article: "Art. 9", area: "Rizikos valdymas", responsible: "Tiekėjas / Diegėjas", risk: "Nėra nustatytos rizikų valdymo sistemos", reason: "Art. 9 reikalauja iteratyvaus rizikų identifikavimo, vertinimo ir mažinimo proceso per visą gyvavimo ciklą", impact: "high", likelihood: "medium", measures: "Sukurti rizikų valdymo planą, paskirti atsakingą asmenį, reguliarūs auditai", status: "open" },
  { id: "R-02", article: "Art. 9", area: "Rizikos valdymas", responsible: "Tiekėjas", risk: "Numatomo netinkamo naudojimo (foreseeable misuse) neįvertinimas", reason: "Sistemos gali būti naudojamos ne pagal paskirtį; tiekėjas privalo tai numatyti ir sumažinti riziką", impact: "high", likelihood: "medium", measures: "Naudojimo scenarijų analizė, apribojimų dokumentavimas, naudotojų mokymai", status: "open" },
  { id: "R-03", article: "Art. 10", area: "Duomenų valdymas", responsible: "Tiekėjas", risk: "Mokymo duomenys su šališkumu (bias) ar nekokybiškomis imtimis", reason: "Šališki duomenys lemia diskriminacinius sprendimus; Art. 10 reikalauja duomenų kokybės užtikrinimo", impact: "critical", likelihood: "high", measures: "Duomenų auditas, bias testai, reprezentatyvių imčių užtikrinimas", status: "open" },
  { id: "R-04", article: "Art. 10", area: "Duomenų valdymas", responsible: "Tiekėjas / Diegėjas", risk: "Nepakankamai dokumentuoti duomenų šaltiniai ir transformacijos", reason: "Negalima įrodyti duomenų kilmės ir kokybės; pažeidžia skaidrumo reikalavimus", impact: "medium", likelihood: "high", measures: "Data lineage dokumentacija, versijų kontrolė, duomenų katalogai", status: "open" },
  { id: "R-05", article: "Art. 11", area: "Techninė dokumentacija", responsible: "Tiekėjas", risk: "Nepilna arba neaktuali techninė dokumentacija", reason: "Rinkos priežiūros institucijos turi turėti prieigą prie pilnos sistemos dokumentacijos", impact: "high", likelihood: "medium", measures: "Dokumentacijos šablonas pagal Annex IV, reguliarus atnaujinimas, versijų kontrolė", status: "open" },
  { id: "R-06", article: "Art. 12", area: "Įvykių registravimas", responsible: "Tiekėjas / Diegėjas", risk: "Automatinis įvykių žurnalas (log) neveikia arba jo nėra", reason: "Art. 12 reikalauja automatinio logavimo visam sistemos veikimo laikotarpiui atsekamumo tikslais", impact: "high", likelihood: "medium", measures: "Automatinis logavimas, log saugojimas min. 6 mėn., prieigos kontrolė", status: "open" },
  { id: "R-07", article: "Art. 12", area: "Įvykių registravimas", responsible: "Diegėjas", risk: "Logai neapima visų sprendimų sekų", reason: "Incidento atveju negali būti atkurta sprendimo grandinė; pažeidžia atskaitomybės principą", impact: "high", likelihood: "medium", measures: "Input/output logavimas, timestamp, naudotojo ID, konteksto duomenys", status: "open" },
  { id: "R-08", article: "Art. 13", area: "Skaidrumas", responsible: "Diegėjas", risk: "Naudotojai neinformuojami, kad sąveikauja su DI sistema", reason: "Art. 13 reikalauja aiškiai informuoti naudotojus apie sistemos galimybes ir ribas", impact: "medium", likelihood: "high", measures: "UI žymos 'DI sistema', naudotojo instrukcija, onboarding mokymai", status: "open" },
  { id: "R-09", article: "Art. 13", area: "Skaidrumas", responsible: "Tiekėjas / Diegėjas", risk: "Naudojimo instrukcija nepasiekiama arba nesuprantama galutiniam naudotojui", reason: "Naudotojai turi suprasti sistemos apribojimus, kad galėtų priimti informuotus sprendimus", impact: "medium", likelihood: "medium", measures: "Paprastų žodžių instrukcija, FAQ, mokymo medžiaga lietuvių kalba", status: "open" },
  { id: "R-10", article: "Art. 14", area: "Žmogiškoji priežiūra", responsible: "Diegėjas", risk: "Sistema veikia be realios žmogaus priežiūros (rubber stamp)", reason: "Art. 14 reikalauja, kad žmonės galėtų suprasti, stebėti ir nutraukti sistemos veiklą", impact: "critical", likelihood: "high", measures: "Aiški eskalacijos procedūra, 'stop' mechanizmas, atsakingo asmens paskyrimas", status: "open" },
  { id: "R-11", article: "Art. 14", area: "Žmogiškoji priežiūra", responsible: "Diegėjas", risk: "Automation bias — darbuotojai aklai pasitiki sistemos sprendimais", reason: "Žmogiškoji priežiūra turi būti reali, ne formali; automatizacijos šališkumas kelia sisteminę riziką", impact: "high", likelihood: "high", measures: "Mokymai apie automation bias, kritinio vertinimo kultūra, periodinis override auditas", status: "open" },
  { id: "R-12", article: "Art. 15", area: "Tikslumas ir patvarumas", responsible: "Tiekėjas", risk: "Modelio tikslumas blogėja laikui bėgant (model drift)", reason: "Art. 15 reikalauja palaikyti deklaruotą tikslumo lygį per visą eksploatacijos laikotarpį", impact: "high", likelihood: "high", measures: "Reguliarus veikimo stebėjimas, drift detekavimas, automatiniai įspėjimai", status: "open" },
  { id: "R-13", article: "Art. 15", area: "Tikslumas ir patvarumas", responsible: "Tiekėjas / Diegėjas", risk: "Sistema neatspari kibernetinėms atakoms (adversarial inputs)", reason: "Kenkėjiški įvesties duomenys gali manipuliuoti sistemos sprendimais", impact: "critical", likelihood: "medium", measures: "Saugumo testavimas, input validacija, anomalijų aptikimas", status: "open" },
  { id: "R-14", article: "Art. 50", area: "Skaidrumo pareigos", responsible: "Diegėjas", risk: "Deepfake ar sintetinis turinys nepažymėtas", reason: "Art. 50 reikalauja žymėti DI generuotą turinį, ypač veidus, balsus, tekstą", impact: "high", likelihood: "low", measures: "Automatinis turinio žymėjimas, metaduomenų įterpimas, watermarking", status: "not_applicable" },
  { id: "R-15", article: "BDAR", area: "Duomenų apsauga", responsible: "Duomenų valdytojas", risk: "DPIA (PPPV) neatliktas prieš diegiant sistemą", reason: "BDAR 35 str. reikalauja DPIA kai DI apdoroja asmens duomenis dideliu mastu arba priima automatizuotus sprendimus", impact: "critical", likelihood: "high", measures: "DPIA atlikimas, DPO konsultavimas, VDAI notifikavimas jei reikia", status: "open" },
  { id: "R-16", article: "BDAR", area: "Duomenų apsauga", responsible: "Duomenų valdytojas", risk: "Nepakankamas duomenų saugojimo laikotarpio apibrėžimas", reason: "Asmens duomenys negali būti saugomi ilgiau nei būtina; pažeidimas = BDAR sankcijos", impact: "medium", likelihood: "medium", measures: "Duomenų gyvavimo ciklo politika, automatinio ištrynimo procedūros", status: "open" },
];

function StepRisks({ data, setData }: StepProps) {
  const assessments = data.risks?.assessments || {};
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [filterArticle, setFilterArticle] = useState("Visi");
  const [searchText, setSearchText] = useState("");

  const updateAssessment = (riskId: string, field: string, val: unknown) => {
    setData((d) => ({
      ...d,
      risks: {
        ...d.risks,
        assessments: {
          ...(d.risks?.assessments || {}),
          [riskId]: { ...(d.risks?.assessments || {})[riskId], [field]: val },
        },
      },
    }));
  };

  const getRisk = (r: RiskEntry) => {
    const a = assessments[r.id];
    return {
      status: a?.status || r.status,
      impact: a?.impact || r.impact,
      likelihood: a?.likelihood || r.likelihood,
      notes: a?.notes || "",
    };
  };

  const articles = ["Visi", ...Array.from(new Set(DEFAULT_RISKS.map((r) => r.article)))];
  const filtered = DEFAULT_RISKS.filter((r) =>
    (filterArticle === "Visi" || r.article === filterArticle) &&
    (searchText === "" || r.risk.toLowerCase().includes(searchText.toLowerCase()) || r.area.toLowerCase().includes(searchText.toLowerCase()) || r.responsible.toLowerCase().includes(searchText.toLowerCase()))
  );

  const allRisks = DEFAULT_RISKS.map((r) => getRisk(r));
  const stats = {
    critical: allRisks.filter((r) => r.impact === "critical" && r.status !== "not_applicable").length,
    high: allRisks.filter((r) => r.impact === "high" && r.status !== "not_applicable").length,
    managed: allRisks.filter((r) => r.status === "managed" || r.status === "accepted").length,
    open: allRisks.filter((r) => r.status === "open").length,
  };

  const selected = selectedRisk ? DEFAULT_RISKS.find((r) => r.id === selectedRisk) : null;
  const selData = selected ? getRisk(selected) : null;

  return (
    <div>
      <Card>
        <SectionTitle icon={<ShieldAlert size={18} />} title="ES DI Akto rizikų registras" subtitle="Įvertinkite kiekvieną riziką pagal jūsų sistemos kontekstą. Keiskite statusą, poveikį ir tikimybę." />

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Kritinės", count: stats.critical, color: "#ef4444" },
            { label: "Aukšto poveikio", count: stats.high, color: "#f97316" },
            { label: "Valdomos", count: stats.managed, color: "#22c55e" },
            { label: "Atviros", count: stats.open, color: "#f59e0b" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#0f172a", borderRadius: 8, padding: "12px 16px", border: "1px solid #334155" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Ieškoti rizikų..."
            style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "6px 12px", color: "#e2e8f0", fontSize: 12, fontFamily: "inherit", width: 200 }}
          />
          {articles.map((a) => (
            <button key={a} onClick={() => setFilterArticle(a)} style={{
              padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              border: `1px solid ${filterArticle === a ? "#3b82f6" : "#334155"}`,
              background: filterArticle === a ? "#1e40af30" : "transparent",
              color: filterArticle === a ? "#93c5fd" : "#64748b",
            }}>{a}</button>
          ))}
        </div>

        {/* Risk table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #334155" }}>
                {["ID", "Straipsnis", "Sritis", "Atsakingas", "Rizika", "Poveikis", "Tikimybė", "Statusas", ""].map((h, i) => (
                  <th key={i} style={{ padding: "8px 10px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const rd = getRisk(r);
                const impactStyle = RISK_IMPACT_LABELS[rd.impact];
                const likelihoodStyle = RISK_LIKELIHOOD_LABELS[rd.likelihood];
                const statusStyle = RISK_STATUS_LABELS[rd.status];
                const artColor = ARTICLE_COLORS[r.article] || "#64748b";
                return (
                  <tr key={r.id} onClick={() => setSelectedRisk(r.id)}
                    style={{ borderBottom: "1px solid #1e293b", background: i % 2 === 0 ? "transparent" : "#0f172a08", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#334155"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "#0f172a08"; }}
                  >
                    <td style={{ padding: "10px", color: "#93c5fd", fontWeight: 600 }}>{r.id}</td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: artColor + "18", color: artColor, border: `1px solid ${artColor}40` }}>{r.article}</span>
                    </td>
                    <td style={{ padding: "10px", color: "#94a3b8", fontSize: 11 }}>{r.area}</td>
                    <td style={{ padding: "10px", color: "#7dd3fc", fontSize: 11 }}>{r.responsible}</td>
                    <td style={{ padding: "10px", color: "#e2e8f0", maxWidth: 260, fontSize: 12 }}>{r.risk}</td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: impactStyle.color + "18", color: impactStyle.color }}>{impactStyle.label}</span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: likelihoodStyle.color + "18", color: likelihoodStyle.color }}>{likelihoodStyle.label}</span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: statusStyle.color + "18", color: statusStyle.color }}>{statusStyle.label}</span>
                    </td>
                    <td style={{ padding: "10px", color: "#475569", fontSize: 16 }}>›</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail modal */}
      {selected && selData && (
        <div onClick={() => setSelectedRisk(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, maxWidth: 640, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            {/* Modal header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ color: "#93c5fd", fontWeight: 700 }}>{selected.id}</span>
                  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: (ARTICLE_COLORS[selected.article] || "#666") + "18", color: ARTICLE_COLORS[selected.article] || "#999" }}>{selected.article}</span>
                  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: "#334155", color: "#7dd3fc" }}>{selected.area}</span>
                </div>
                <h2 style={{ fontSize: 15, color: "#e2e8f0", fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{selected.risk}</h2>
              </div>
              <button onClick={() => setSelectedRisk(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20, padding: "0 0 0 16px" }}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Kas atsakingas</div>
                <div style={{ color: "#7dd3fc", fontSize: 13 }}>{selected.responsible}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Kodėl tai rizika</div>
                <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>{selected.reason}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Rekomenduojamos valdymo priemonės</div>
                <div style={{ color: "#34d399", fontSize: 13, lineHeight: 1.6 }}>{selected.measures}</div>
              </div>

              {/* Editable fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, paddingTop: 12, borderTop: "1px solid #334155" }}>
                <div>
                  <label style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Poveikis</label>
                  <select value={selData.impact} onChange={(e) => updateAssessment(selected.id, "impact", e.target.value)}
                    style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, color: RISK_IMPACT_LABELS[selData.impact].color, padding: "8px 10px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {(Object.entries(RISK_IMPACT_LABELS) as [RiskImpact, { label: string; color: string }][]).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Tikimybė</label>
                  <select value={selData.likelihood} onChange={(e) => updateAssessment(selected.id, "likelihood", e.target.value)}
                    style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, color: RISK_LIKELIHOOD_LABELS[selData.likelihood].color, padding: "8px 10px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {(Object.entries(RISK_LIKELIHOOD_LABELS) as [RiskLikelihood, { label: string; color: string }][]).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Statusas</label>
                  <select value={selData.status} onChange={(e) => updateAssessment(selected.id, "status", e.target.value)}
                    style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, color: RISK_STATUS_LABELS[selData.status].color, padding: "8px 10px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {(Object.entries(RISK_STATUS_LABELS) as [RiskStatus, { label: string; color: string }][]).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* User notes */}
              <div>
                <label style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Jūsų pastabos</label>
                <textarea
                  value={selData.notes}
                  onChange={(e) => updateAssessment(selected.id, "notes", e.target.value)}
                  placeholder="Aprašykite, kaip ši rizika taikoma jūsų situacijai, kokias priemones planuojate..."
                  rows={3}
                  style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", padding: "10px 14px", fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STEP 6: ATASKAITA / TECHNINE SPECIFIKACIJA
// ============================================================

const RISK_MAP: Record<number, string> = { 0: "Minimali rizika", 1: "Ribota rizika (Art. 50)", 2: "Auksta rizika (Art. 6-49)", 3: "Nepriimtina (Art. 5)" };
const OVERSIGHT_MAP: Record<string, string> = { hitl: "Human-in-the-Loop", hotl: "Human-on-the-Loop", hocl: "Human-over-the-Loop", auto: "Pilnai automatinis" };
const INFRA_MAP: Record<string, string> = { on_premise: "On-Premise", private_cloud: "Privati debesija", public_cloud: "Viešoji debesija", hybrid: "Hibridinė", govai_sandbox: "GovAI smėliadėžė" };
const STAKEHOLDER_MAP: Record<string, string> = { business: "Verslo vadovai", process: "Proceso savininkai", legal: "Teisininkai", dpo: "DAP", ethics: "Etikos komisija", it: "IT architektai", ml: "ML inžinieriai", security: "Saugumo spec.", users: "Naudotojai", governance: "DI governance" };
const MODEL_MAP: Record<string, string> = { cloud_llm: "Cloud LLM", local_llm: "Lokalus LLM", custom_ml: "Custom ML", hybrid: "Hibridinis", rag: "RAG", fine_tuned: "Fine-tuned" };
const COMP_MAP: Record<string, string> = { trigger: "Trigeris", preprocess: "Pirminė apdoroja", ai_model: "DI modelis", logic: "Verslo logika", human: "Žmogiškoji priežiūra", output: "Išvestis", storage: "Duomenų saugykla", monitoring: "Stebėsena" };

const AI_ACT_REQUIREMENTS: AIActRequirement[] = [
  { art: "Art. 4", title: "DI raštingumas", check: (d) => d.concept?.phase2 },
  { art: "Art. 9", title: "Rizikos valdymo sistema", check: (d) => d.problem?.riskLevel !== undefined },
  { art: "Art. 10", title: "Duomenų valdymas", check: (d) => d.concept?.dataMinimization },
  { art: "Art. 11", title: "Techninė dokumentacija", check: () => true },
  { art: "Art. 12", title: "Įvykių registravimas", check: (d) => (d.evals?.scores || {})[("audit_trail" as string)] !== undefined },
  { art: "Art. 13", title: "Skaidrumas", check: (d) => (d.evals?.scores || {})[("explainability" as string)] !== undefined },
  { art: "Art. 14", title: "Žmogiškoji priežiūra", check: (d) => d.concept?.oversightLevel },
  { art: "Art. 15", title: "Tikslumas ir patvarumas", check: (d) => (d.evals?.scores || {})[("accuracy" as string)] !== undefined },
  { art: "Art. 50", title: "Skaidrumo pareigos", check: (d) => (d.evals?.scores || {})[("user_notice" as string)] !== undefined },
  { art: "Art. 72", title: "Po pateikimo stebėsena", check: (d) => d.architecture?.selectedComponents?.includes("monitoring") },
  { art: "BDAR", title: "DPIA atliktas", check: (d) => (d.concept?.gdprChecks || []).includes("dpia") },
];

function ReportSection({ num, title, children }: ReportSectionProps) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#93c5fd", margin: "0 0 12px", paddingBottom: 8, borderBottom: "1px solid #334155" }}>
        {num}. {title}
      </h3>
      {children}
    </div>
  );
}

function RField({ label, value, fieldKey }: RFieldProps) {
  if (!value && !fieldKey) return null;
  if (!value && fieldKey) {
    const expertise = FIELD_EXPERTISE[fieldKey];
    if (!expertise) return null;
    const style = EXPERTISE_LABELS[expertise.type];
    return (
      <div style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{label}: </span>
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: style.bg, color: style.color, fontWeight: 600 }}>{style.label}</span>
        <span style={{ fontSize: 11, color: "#475569", fontStyle: "italic" }}>{expertise.hint}</span>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{label}: </span>
      <span style={{ fontSize: 13, color: "#e2e8f0" }}>{value}</span>
    </div>
  );
}

function RTable({ headers, rows }: RTableProps) {
  return (
    <div style={{ overflowX: "auto", marginBottom: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>{headers.map((h, i) => <th key={i} style={{ background: "#1e40af", color: "#fff", padding: "8px 12px", textAlign: "left", fontWeight: 600, border: "1px solid #334155" }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => <td key={ci} style={{ padding: "6px 12px", border: "1px solid #334155", background: ri % 2 ? "#0f172a" : "#1e293b", color: "#cbd5e1" }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ScaleMapping {
  target: string;
  minimum: string;
}

function StepReport({ data }: ReportStepProps) {
  const p = data.problem || {};
  const c = data.concept || {};
  const e = data.evals || {};
  const a = data.architecture || {};
  const filledMetrics = Object.entries(e.scores || {}).filter(([, v]) => v !== undefined);
  const compliance = AI_ACT_REQUIREMENTS.map((r) => ({ ...r, met: r.check(data) }));
  const compliancePct = Math.round((compliance.filter((c) => c.met).length / compliance.length) * 100);

  const downloadJSON = () => {
    // Transform wizard evals scores (0-3) into DOCX generator metrics format
    const scaleToMetric = (metricId: string, scoreVal: number | undefined): ScaleMapping => {
      // Map known metric IDs to meaningful target/minimum values based on score level
      const mappings: Record<string, ScaleMapping[]> = {
        accuracy: [{ target: "", minimum: "" }, { target: "70", minimum: "60" }, { target: "85", minimum: "75" }, { target: "95", minimum: "90" }],
        robustness: [{ target: "", minimum: "" }, { target: "60", minimum: "50" }, { target: "80", minimum: "70" }, { target: "95", minimum: "85" }],
        latency: [{ target: "", minimum: "" }, { target: "30000", minimum: "60000" }, { target: "10000", minimum: "30000" }, { target: "2000", minimum: "5000" }],
        bias: [{ target: "", minimum: "" }, { target: "pradėta", minimum: "" }, { target: "<5%", minimum: "<10%" }, { target: "<2%", minimum: "<5%" }],
        disparate: [{ target: "", minimum: "" }, { target: "identifikuota", minimum: "" }, { target: "matuojama", minimum: "" }, { target: "kompensuojama", minimum: "" }],
        explainability: [{ target: "", minimum: "" }, { target: "2", minimum: "1" }, { target: "4", minimum: "3" }, { target: "5", minimum: "4" }],
        audit_trail: [{ target: "", minimum: "" }, { target: "daliniai", minimum: "" }, { target: "taip", minimum: "taip" }, { target: "taip+analizė", minimum: "taip" }],
        user_notice: [{ target: "", minimum: "" }, { target: "ToS", minimum: "" }, { target: "taip", minimum: "taip" }, { target: "interaktyvus", minimum: "taip" }],
        confidence: [{ target: "", minimum: "" }, { target: "vidinis", minimum: "" }, { target: "specialistui", minimum: "" }, { target: "visiems", minimum: "specialistui" }],
        adversarial: [{ target: "", minimum: "" }, { target: "bazinė", minimum: "" }, { target: "testai", minimum: "bazinė" }, { target: "nuolatinis", minimum: "testai" }],
        fallback: [{ target: "", minimum: "" }, { target: "klaida", minimum: "" }, { target: "graceful", minimum: "klaida" }, { target: "auto-failover", minimum: "graceful" }],
        data_quality: [{ target: "", minimum: "" }, { target: "validacija", minimum: "" }, { target: "statistinė", minimum: "validacija" }, { target: "anomalijos", minimum: "statistinė" }],
        human_override: [{ target: "", minimum: "" }, { target: "techninė", minimum: "" }, { target: "lengva", minimum: "techninė" }, { target: "1-click+audit", minimum: "lengva" }],
        escalation: [{ target: "", minimum: "" }, { target: "ad-hoc", minimum: "" }, { target: "struktūrizuotas", minimum: "" }, { target: "auto+SLA", minimum: "struktūrizuotas" }],
        domain_validation: [{ target: "", minimum: "" }, { target: "informuoti", minimum: "" }, { target: "peržiūrėjo", minimum: "" }, { target: "testavo", minimum: "peržiūrėjo" }],
        uptime: [{ target: "", minimum: "" }, { target: "95", minimum: "90" }, { target: "99.5", minimum: "99" }, { target: "99.9", minimum: "99.5" }],
        drift: [{ target: "", minimum: "" }, { target: "rankinė", minimum: "" }, { target: "auto", minimum: "" }, { target: "auto+retrain", minimum: "auto" }],
        incident: [{ target: "", minimum: "" }, { target: "ad-hoc", minimum: "" }, { target: "struktūrizuotas", minimum: "" }, { target: "auto+alertai", minimum: "struktūrizuotas" }],
        periodic_audit: [{ target: "", minimum: "" }, { target: "kasmetis", minimum: "" }, { target: "kasmetis+išorinis", minimum: "kasmetis" }, { target: "nuolatinis+išorinis", minimum: "kasmetis+išorinis" }],
      };
      const m = mappings[metricId];
      if (m && scoreVal !== undefined) return m[scoreVal] || { target: String(scoreVal), minimum: "" };
      return { target: String(scoreVal || ""), minimum: "" };
    };

    // Build DOCX-compatible metrics from scores
    const evalsScores = data.evals?.scores || {};
    const docxMetrics: Record<string, ScaleMapping> = {};
    Object.entries(evalsScores).forEach(([id, val]) => {
      docxMetrics[id] = scaleToMetric(id, val);
    });

    // Build the export object matching DOCX generator structure exactly
    const exportData = {
      meta: {
        projectName: data._meta?.projectName || "DI Sistema",
        organization: data._meta?.organization || "",
        author: data._meta?.author || "",
        date: new Date().toISOString().split("T")[0],
        version: "1.0",
        docType: "Techninė specifikacija / DI sistemos planavimo dokumentas",
      },
      problem: { ...data.problem },
      concept: { ...data.concept },
      evals: {
        metrics: docxMetrics,
        testingMethods: data.evals?.testingMethods || [],
        testingNotes: data.evals?.testingNotes || "",
        // Also include raw scores for reference
        _scores: evalsScores,
        _scaleLabels: Object.fromEntries(
          EVAL_CATEGORIES.flatMap((c) => c.metrics.map((m) => [m.id, evalsScores[m.id] !== undefined ? m.scale[evalsScores[m.id] as number] : null])).filter(([, v]) => v !== null)
        ),
      },
      architecture: { ...data.architecture },
      risks: {
        assessments: DEFAULT_RISKS.map((r) => {
          const a = (data.risks?.assessments || {})[r.id];
          return { id: r.id, article: r.article, area: r.area, risk: r.risk, reason: r.reason, responsible: r.responsible, measures: r.measures, impact: a?.impact || r.impact, likelihood: a?.likelihood || r.likelihood, status: a?.status || r.status, notes: a?.notes || "" };
        }),
      },
      fieldConsult: data.fieldConsult || {},
      evalsConsult: data.evals?.needsConsult || {},
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "di-techninė-specifikacija.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = () => {
    // Reuse the same export data structure as JSON download
    const scaleToMetric = (metricId: string, scoreVal: number | undefined): ScaleMapping => {
      const mappings: Record<string, ScaleMapping[]> = {
        accuracy: [{ target: "", minimum: "" }, { target: "70", minimum: "60" }, { target: "85", minimum: "75" }, { target: "95", minimum: "90" }],
        robustness: [{ target: "", minimum: "" }, { target: "60", minimum: "50" }, { target: "80", minimum: "70" }, { target: "95", minimum: "85" }],
        latency: [{ target: "", minimum: "" }, { target: "30000", minimum: "60000" }, { target: "10000", minimum: "30000" }, { target: "2000", minimum: "5000" }],
        bias: [{ target: "", minimum: "" }, { target: "pradėta", minimum: "" }, { target: "<5%", minimum: "<10%" }, { target: "<2%", minimum: "<5%" }],
        disparate: [{ target: "", minimum: "" }, { target: "identifikuota", minimum: "" }, { target: "matuojama", minimum: "" }, { target: "kompensuojama", minimum: "" }],
        explainability: [{ target: "", minimum: "" }, { target: "2", minimum: "1" }, { target: "4", minimum: "3" }, { target: "5", minimum: "4" }],
        audit_trail: [{ target: "", minimum: "" }, { target: "daliniai", minimum: "" }, { target: "taip", minimum: "taip" }, { target: "taip+analizė", minimum: "taip" }],
        user_notice: [{ target: "", minimum: "" }, { target: "ToS", minimum: "" }, { target: "taip", minimum: "taip" }, { target: "interaktyvus", minimum: "taip" }],
        confidence: [{ target: "", minimum: "" }, { target: "vidinis", minimum: "" }, { target: "specialistui", minimum: "" }, { target: "visiems", minimum: "specialistui" }],
        adversarial: [{ target: "", minimum: "" }, { target: "bazinė", minimum: "" }, { target: "testai", minimum: "bazinė" }, { target: "nuolatinis", minimum: "testai" }],
        fallback: [{ target: "", minimum: "" }, { target: "klaida", minimum: "" }, { target: "graceful", minimum: "klaida" }, { target: "auto-failover", minimum: "graceful" }],
        data_quality: [{ target: "", minimum: "" }, { target: "validacija", minimum: "" }, { target: "statistinė", minimum: "validacija" }, { target: "anomalijos", minimum: "statistinė" }],
        human_override: [{ target: "", minimum: "" }, { target: "techninė", minimum: "" }, { target: "lengva", minimum: "techninė" }, { target: "1-click+audit", minimum: "lengva" }],
        escalation: [{ target: "", minimum: "" }, { target: "ad-hoc", minimum: "" }, { target: "struktūrizuotas", minimum: "" }, { target: "auto+SLA", minimum: "struktūrizuotas" }],
        domain_validation: [{ target: "", minimum: "" }, { target: "informuoti", minimum: "" }, { target: "peržiūrėjo", minimum: "" }, { target: "testavo", minimum: "peržiūrėjo" }],
        uptime: [{ target: "", minimum: "" }, { target: "95", minimum: "90" }, { target: "99.5", minimum: "99" }, { target: "99.9", minimum: "99.5" }],
        drift: [{ target: "", minimum: "" }, { target: "rankinė", minimum: "" }, { target: "auto", minimum: "" }, { target: "auto+retrain", minimum: "auto" }],
        incident: [{ target: "", minimum: "" }, { target: "ad-hoc", minimum: "" }, { target: "struktūrizuotas", minimum: "" }, { target: "auto+alertai", minimum: "struktūrizuotas" }],
        periodic_audit: [{ target: "", minimum: "" }, { target: "kasmetis", minimum: "" }, { target: "kasmetis+išorinis", minimum: "kasmetis" }, { target: "nuolatinis+išorinis", minimum: "kasmetis+išorinis" }],
      };
      const m = mappings[metricId];
      if (m && scoreVal !== undefined) return m[scoreVal] || { target: String(scoreVal), minimum: "" };
      return { target: String(scoreVal || ""), minimum: "" };
    };

    const evalsScores = data.evals?.scores || {};
    const docxMetrics: Record<string, ScaleMapping> = {};
    Object.entries(evalsScores).forEach(([id, val]) => {
      docxMetrics[id] = scaleToMetric(id, val as number | undefined);
    });

    const exportData = {
      meta: {
        projectName: data._meta?.projectName || "DI Sistema",
        organization: data._meta?.organization || "",
        author: data._meta?.author || "",
        date: new Date().toISOString().split("T")[0],
        version: "1.0",
        docType: "Techninė specifikacija / DI sistemos planavimo dokumentas",
      },
      problem: { ...data.problem },
      concept: { ...data.concept },
      evals: {
        metrics: docxMetrics,
        testingMethods: data.evals?.testingMethods || [],
        testingNotes: data.evals?.testingNotes || "",
        _scaleLabels: Object.fromEntries(
          EVAL_CATEGORIES.flatMap((c) => c.metrics.map((m) => [m.id, evalsScores[m.id] !== undefined ? m.scale[evalsScores[m.id] as number] : null])).filter(([, v]) => v !== null)
        ),
      },
      architecture: { ...data.architecture },
      risks: {
        assessments: DEFAULT_RISKS.map((r) => {
          const a = (data.risks?.assessments || {})[r.id];
          return { id: r.id, article: r.article, area: r.area, risk: r.risk, reason: r.reason, responsible: r.responsible, measures: r.measures, impact: a?.impact || r.impact, likelihood: a?.likelihood || r.likelihood, status: a?.status || r.status, notes: a?.notes || "" };
        }),
      },
      fieldConsult: data.fieldConsult || {},
      evalsConsult: data.evals?.needsConsult || {},
    };

    downloadDocx(exportData);
  };

  return (
    <div>
      {/* Header bar */}
      <Card style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid #1e40af" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1.5 }}>
              {data._meta?.organization ? `${data._meta.organization} -- ` : ""}Techninė specifikacija
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: "6px 0 0" }}>
              {data._meta?.projectName || "DI Sistema"} -- Ataskaitos peržiūra
            </h2>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={downloadJSON} style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid #3b82f6",
              background: "#1e40af30", color: "#93c5fd", cursor: "pointer", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Download size={14} /> Atsisiųsti JSON
            </button>
            <button onClick={handleDownloadDocx} style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid #059669",
              background: "#05966930", color: "#6ee7b7", cursor: "pointer", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <FileDown size={14} /> Generuoti DOCX
            </button>
          </div>
        </div>

        {/* Compliance score */}
        <div style={{ display: "flex", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
          <div style={{ background: "#0f172a", borderRadius: 10, padding: "16px 24px", textAlign: "center", minWidth: 120 }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: compliancePct >= 70 ? "#059669" : compliancePct >= 40 ? "#d97706" : "#dc2626" }}>{compliancePct}%</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>DI Akto atitiktis</div>
          </div>
          <div style={{ background: "#0f172a", borderRadius: 10, padding: "16px 24px", textAlign: "center", minWidth: 120 }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#3b82f6" }}>{filledMetrics.length}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Metrikų apibrėžta</div>
          </div>
          <div style={{ background: "#0f172a", borderRadius: 10, padding: "16px 24px", textAlign: "center", minWidth: 120 }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#8b5cf6" }}>{(p.stakeholders || []).length}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Suinteresuotieji</div>
          </div>
          <div style={{ background: "#0f172a", borderRadius: 10, padding: "16px 24px", textAlign: "center", minWidth: 120 }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#06b6d4" }}>{(a.selectedComponents || []).length}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Arch. komponentai</div>
          </div>
          {(() => {
            const ra = data.risks?.assessments || {};
            const openRisks = DEFAULT_RISKS.filter((r) => (ra[r.id]?.status || r.status) === "open").length;
            return (
              <div style={{ background: "#0f172a", borderRadius: 10, padding: "16px 24px", textAlign: "center", minWidth: 120 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: openRisks > 0 ? "#f97316" : "#059669" }}>{openRisks}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Atviros rizikos</div>
              </div>
            );
          })()}
        </div>
      </Card>

      {/* 1. PROBLEMA */}
      <Card>
        <ReportSection num="1" title="Problemos aprašymas ir DI taikymo pagrindimas">
          <RField label="Problema" value={p.description} fieldKey="problem.description" />
          <RField label="Dabartinis procesas" value={p.currentProcess} fieldKey="problem.currentProcess" />
          {(p.timeSpent || p.errorRate || p.volume) && (
            <RTable headers={["Rodiklis", "Reiksme"]} rows={[
              ...(p.timeSpent ? [["Laiko sanaudos", `${p.timeSpent} val./diena`]] : []),
              ...(p.errorRate ? [["Klaidų dažnis", `${p.errorRate}%`]] : []),
              ...(p.volume ? [["Apimtis", `${p.volume} vnt./diena`]] : []),
            ]} />
          )}
          <RField label="Rizikos lygis" value={p.riskLevel !== undefined ? RISK_MAP[p.riskLevel] : undefined} fieldKey="problem.riskLevel" />
          <RField label="DI pagrindimas" value={p.whyAI} fieldKey="problem.whyAI" />
          {(p.stakeholders?.length ?? 0) > 0 && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>Suinteresuotieji (<Scale size={12} />): </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {(p.stakeholders || []).map((s) => (
                  <span key={s} style={{ padding: "3px 10px", borderRadius: 12, background: "#334155", fontSize: 12, color: "#94a3b8" }}>{STAKEHOLDER_MAP[s] || s}</span>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: 10 }}><RField label="Sėkmės kriterijai" value={p.successCriteria} fieldKey="problem.successCriteria" /></div>
        </ReportSection>
      </Card>

      {/* 2. KONCEPTAS */}
      <Card>
        <ReportSection num="2" title="Sistemos konceptas">
          <RField label="Vizija" value={c.vision} fieldKey="concept.vision" />
          {(c.inputSystems || c.outputSystems) && (
            <RTable headers={["Kategorija", "Sistemos"]} rows={[
              ...(c.inputSystems ? [["Ivestis", c.inputSystems]] : []),
              ...(c.outputSystems ? [["Išvestis", c.outputSystems]] : []),
              ...(c.dataSources ? [["Duomenu šaltiniai", c.dataSources]] : []),
              ...(c.orchestration ? [["Orkestracija", c.orchestration]] : []),
            ]} />
          )}
          <RField label="DI modelio strategija" value={(c.modelStrategy || []).length > 0 ? (c.modelStrategy || []).map((s) => MODEL_MAP[s] || s).join(", ") : undefined} fieldKey="concept.modelStrategy" />
          <RField label="Žmogiškoji priežiūra" value={c.oversightLevel ? OVERSIGHT_MAP[c.oversightLevel] : undefined} fieldKey="concept.oversightLevel" />
          <RField label="Override mechanizmas" value={c.overrideMechanism} fieldKey="concept.overrideMechanism" />
          {(c.gdprChecks?.length ?? 0) > 0 && <RField label="BDAR checklist" value={(c.gdprChecks?.length ?? 0) + "/4 reikalavimai atitikti"} />}
          {(c.phase1 || c.phase2 || c.phase3) && (
            <RTable headers={["Faze", "Aprasymas"]} rows={[
              ...(c.phase1 ? [["1: PoC/Sandbox", c.phase1]] : []),
              ...(c.phase2 ? [["2: Pilotas", c.phase2]] : []),
              ...(c.phase3 ? [["3: Produkcija", c.phase3]] : []),
            ]} />
          )}
        </ReportSection>
      </Card>

      {/* 3. METRIKOS */}
      <Card>
        <ReportSection num="3" title="Vertinimo metrikos (Evals)">
          {filledMetrics.length > 0 ? (
            <RTable headers={["Metrika", "Vertinimas", "Lygis", "Kritinis?"]} rows={
              EVAL_CATEGORIES.flatMap((cat) => cat.metrics.filter((m) => (e.scores || {})[m.id] !== undefined).map((m) => {
                const val = (e.scores || {})[m.id];
                return [m.name, m.scale[val], `${val}/3`, m.critical ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12} /> Taip</span> : ""];
              }))
            } />
          ) : (
            <div style={{ color: "#64748b", fontSize: 13, fontStyle: "italic" }}>Metrikos neivertintos - grizkite i 3 zingsni</div>
          )}
          {(() => {
            const crits = EVAL_CATEGORIES.flatMap((cat) => cat.metrics.filter((m) => m.critical && (e.scores || {})[m.id] !== undefined && (e.scores || {})[m.id] <= 1));
            return crits.length > 0 ? (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "#dc262615", border: "1px solid #dc2626", borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: "#fca5a5", fontWeight: 600 }}>Kritinės spragos: </span>
                <span style={{ fontSize: 13, color: "#fca5a5" }}>{crits.map((m) => m.name).join(", ")}</span>
              </div>
            ) : null;
          })()}
          {(e.testingMethods?.length ?? 0) > 0 && <div style={{ marginTop: 10 }}><RField label="Testavimo metodai" value={(e.testingMethods || []).join(", ")} /></div>}
          {e.testingNotes?.trim() && <div style={{ marginTop: 6 }}><RField label="Testavimo pastabos" value={e.testingNotes} /></div>}
        </ReportSection>
      </Card>

      {/* 4. ARCHITEKTURA */}
      <Card>
        <ReportSection num="4" title="Architektūra ir prototipo reikalavimai">
          {(a.selectedComponents?.length ?? 0) > 0 && (
            <RTable headers={["Komponentas", "Technologijos", "Pastabos"]} rows={(a.selectedComponents || []).map((comp) => {
              const det = (a.componentDetails || {})[comp] || {};
              return [COMP_MAP[comp] || comp, (det.technologies || []).join(", "), det.notes || "---"];
            })} />
          )}
          {a.dataFlow && <div style={{ marginTop: 8 }}><RField label="Duomenų srautas" value="" /><pre style={{ background: "#0f172a", padding: 12, borderRadius: 6, fontSize: 12, color: "#94a3b8", whiteSpace: "pre-wrap", margin: "4px 0" }}>{a.dataFlow}</pre></div>}
          <RField label="Infrastruktūra" value={a.infrastructure ? INFRA_MAP[a.infrastructure] : undefined} fieldKey="architecture.infrastructure" />
          <RField label="Saugumo reikalavimai" value={a.securityReqs} fieldKey="architecture.securityReqs" />
        </ReportSection>
      </Card>

      {/* 5. ATITIKTIS */}
      <Card style={{ border: "1px solid #1e40af33" }}>
        <ReportSection num="5" title="ES DI Akto atitikties santrauka">
          <RTable headers={["Reikalavimas", "Aprasymas", "Statusas"]} rows={compliance.map((c) => [
            c.art, c.title, c.met ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#6ee7b7" }}><CheckCircle size={14} /> Apibrėžta</span> : <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#fcd34d" }}><AlertTriangle size={14} /> Reikia</span>,
          ])} />
        </ReportSection>
      </Card>

      {/* 6. RIZIKŲ REGISTRAS */}
      <Card>
        <ReportSection num="6" title="Rizikų registras (ES DI Aktas)">
          {(() => {
            const ra = data.risks?.assessments || {};
            const riskRows = DEFAULT_RISKS.map((r) => {
              const a = ra[r.id];
              const status = a?.status || r.status;
              const impact = a?.impact || r.impact;
              const likelihood = a?.likelihood || r.likelihood;
              return [
                r.id,
                r.article,
                r.risk,
                RISK_IMPACT_LABELS[impact].label,
                RISK_LIKELIHOOD_LABELS[likelihood].label,
                <span key={r.id} style={{ color: RISK_STATUS_LABELS[status].color, fontWeight: 600 }}>{RISK_STATUS_LABELS[status].label}</span>,
              ];
            });
            const openCount = DEFAULT_RISKS.filter((r) => (ra[r.id]?.status || r.status) === "open").length;
            const managedCount = DEFAULT_RISKS.filter((r) => {
              const s = ra[r.id]?.status || r.status;
              return s === "managed" || s === "accepted";
            }).length;
            return (
              <>
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: "#f97316" }}>Atviros: <strong>{openCount}</strong></span>
                  <span style={{ fontSize: 13, color: "#22c55e" }}>Valdomos/Priimtos: <strong>{managedCount}</strong></span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>Iš viso: <strong>{DEFAULT_RISKS.length}</strong></span>
                </div>
                <RTable headers={["ID", "Str.", "Rizika", "Poveikis", "Tikimybė", "Statusas"]} rows={riskRows} />
              </>
            );
          })()}
        </ReportSection>
      </Card>

      {/* TS naudojimo instrukcija */}
      <Card style={{ background: "#065f4615", border: "1px solid #065f46" }}>
        <SectionTitle icon={<ClipboardList size={18} />} title="Kaip naudoti kaip pirkimo TS?" subtitle="" />
        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 8px" }}><strong style={{ color: "#6ee7b7" }}>1.</strong> Atsisiųskite JSON arba sugeneruokite DOCX su mygtukais aukščiau</p>
          <p style={{ margin: "0 0 8px" }}><strong style={{ color: "#6ee7b7" }}>2.</strong> DOCX failas generuojamas tiesiogiai naršyklėje — jokių papildomų įrankių nereikia</p>
          <p style={{ margin: "0 0 8px" }}><strong style={{ color: "#6ee7b7" }}>3.</strong> Gausite profesionalų Word dokumentą su 6 skyriais: Problema &rarr; Konceptas &rarr; Metrikos &rarr; Architektūra &rarr; DI Akto atitiktis &rarr; Rizikų registras</p>
          <p style={{ margin: "0 0 8px" }}><strong style={{ color: "#6ee7b7" }}>4.</strong> Evals balai (0-3) automatiškai konvertuojami į konkrečius tikslinius rodiklius ir minimalius slenksčius</p>
          <p style={{ margin: 0, color: "#64748b", fontStyle: "italic" }}>Dokumentas atitinka ES DI Akto Art. 11 / Annex IV techninės dokumentacijos struktūrą ir gali būti naudojamas kaip pagrindas viešajam pirkimui.</p>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

const STEPS: StepDefinition[] = [
  { id: "problem", title: "Problema", icon: AlertTriangle, desc: "Problemos apibrėžimas ir DI pagrindimas", component: StepProblem },
  { id: "concept", title: "Sistemos konceptas", icon: MessageSquare, desc: "Architektūra ir žmogiškoji priežiūra", component: StepConcept },
  { id: "evals", title: "Evals / Metrikos", icon: BarChart3, desc: "Vertinimo kriterijai ir slenkščiai", component: StepEvals },
  { id: "architecture", title: "Sistemos prototipas", icon: Wrench, desc: "Komponentai ir infrastruktūra", component: StepArchitecture },
  { id: "risks", title: "Rizikų registras", icon: ShieldAlert, desc: "ES DI Akto rizikų vertinimas", component: StepRisks },
  { id: "report", title: "Ataskaita / TS", icon: ClipboardList, desc: "Techninė specifikacija ir eksportas", component: StepReport },
];

export default function DIPlanningWizard() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [data, setData] = useState<WizardData>({ problem: {}, concept: {}, evals: {}, architecture: {}, risks: {}, _meta: {}, fieldConsult: {} });

  // Get all required field keys for a step from FIELD_EXPERTISE
  const getStepFieldKeys = useCallback((stepId: string): string[] => {
    return Object.keys(FIELD_EXPERTISE).filter((k) => k.startsWith(stepId + "."));
  }, []);

  // Check if a single field is "handled" (filled or consulted)
  const isFieldHandled = useCallback((fieldKey: string): boolean => {
    if ((data.fieldConsult || {})[fieldKey]) return true;
    const [section, field] = fieldKey.split(".");
    const sectionData = (data[section] || {}) as Record<string, unknown>;
    const val = sectionData[field];
    if (typeof val === "string") return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "number") return true;
    return val !== undefined && val !== null;
  }, [data]);

  // Is every field in a step handled?
  const isStepComplete = useCallback((stepId: string): boolean => {
    if (stepId === "report") return ["problem", "concept", "evals", "architecture", "risks"].every((s) => isStepComplete(s));
    if (stepId === "evals") {
      const allMetrics = EVAL_CATEGORIES.flatMap((c) => c.metrics);
      const scores = data.evals?.scores || {};
      const nc = data.evals?.needsConsult || {};
      return allMetrics.every((m) => scores[m.id] !== undefined || nc[m.id]);
    }
    if (stepId === "risks") {
      const assessments = data.risks?.assessments || {};
      return DEFAULT_RISKS.every((r) => assessments[r.id] !== undefined);
    }
    return getStepFieldKeys(stepId).every((k) => isFieldHandled(k));
  }, [data, getStepFieldKeys, isFieldHandled]);

  const getStepCompleteness = useCallback((stepId: string): number => {
    if (stepId === "report") {
      const steps = ["problem", "concept", "evals", "architecture", "risks"];
      const avg = steps.reduce((sum, s) => sum + getStepCompleteness(s), 0) / steps.length;
      return Math.round(avg);
    }
    if (stepId === "evals") {
      const allMetrics = EVAL_CATEGORIES.flatMap((c) => c.metrics);
      const scores = data.evals?.scores || {};
      const nc = data.evals?.needsConsult || {};
      const answered = allMetrics.filter((m) => scores[m.id] !== undefined || nc[m.id]).length;
      return Math.round((answered / allMetrics.length) * 100);
    }
    if (stepId === "risks") {
      const assessments = data.risks?.assessments || {};
      const reviewed = DEFAULT_RISKS.filter((r) => assessments[r.id] !== undefined).length;
      return Math.round((reviewed / DEFAULT_RISKS.length) * 100);
    }
    const keys = getStepFieldKeys(stepId);
    if (keys.length === 0) return 0;
    const handled = keys.filter((k) => isFieldHandled(k)).length;
    return Math.round((handled / keys.length) * 100);
  }, [data, getStepFieldKeys, isFieldHandled]);

  const StepComponent = STEPS[activeStep].component;

  return (
    <div style={{ fontFamily: "'Source Sans 3', 'Segoe UI', system-ui, sans-serif", background: "#0f172a", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderBottom: "1px solid #334155", padding: "20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 2 }}>
          <Link href="/" style={{ fontSize: 13, color: "#93c5fd", textDecoration: "none", padding: "2px 10px", borderRadius: 4, border: "1px solid #334155", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ArrowLeft size={12} /> Grizti
          </Link>
          <span style={{ fontSize: 13, background: "#1e40af", color: "#93c5fd", padding: "2px 10px", borderRadius: 4, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase" }}>Framework</span>
          <span style={{ fontSize: 13, background: "#065f46", color: "#6ee7b7", padding: "2px 10px", borderRadius: 4, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase" }}>EU AI Act</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "8px 0 4px", color: "#f1f5f9", letterSpacing: -0.5, display: "flex", alignItems: "center", gap: 8 }}>
          <Scale size={24} /> DI Sistemos Planavimo Vedlys
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          Nuo problemos iki prototipo -- struktūrizuotas DI sistemos kūrimo procesas su ES DI Akto atitiktimi ir techninės specifikacijos generavimu
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <input value={data._meta?.projectName || ""} onChange={(ev: ChangeEvent<HTMLInputElement>) => setData((d) => ({ ...d, _meta: { ...d._meta, projectName: ev.target.value } }))}
            placeholder="Projekto pavadinimas (pvz., VILYS)" style={{ background: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", padding: "6px 12px", borderRadius: 6, fontSize: 13, width: 240 }} />
          <input value={data._meta?.organization || ""} onChange={(ev: ChangeEvent<HTMLInputElement>) => setData((d) => ({ ...d, _meta: { ...d._meta, organization: ev.target.value } }))}
            placeholder="Organizacija (pvz., ŽŪDC)" style={{ background: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", padding: "6px 12px", borderRadius: 6, fontSize: 13, width: 200 }} />
          <input value={data._meta?.author || ""} onChange={(ev: ChangeEvent<HTMLInputElement>) => setData((d) => ({ ...d, _meta: { ...d._meta, author: ev.target.value } }))}
            placeholder="Autorius" style={{ background: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", padding: "6px 12px", borderRadius: 6, fontSize: 13, width: 200 }} />
        </div>
      </div>

      {/* Horizontal step indicator */}
      <div style={{ display: "flex", alignItems: "center", padding: "12px 24px", background: "#1e293b", borderBottom: "1px solid #334155", gap: 0 }}>
        {STEPS.map((step, i) => {
          const completeness = getStepCompleteness(step.id);
          const isActive = activeStep === i;
          const isDone = completeness > 60;
          const StepIcon = step.icon;
          // Can navigate: back always, forward only if all prior steps complete
          const canNavigate = i <= activeStep || Array.from({ length: i }, (_, idx) => STEPS[idx].id).every((sid) => isStepComplete(sid));
          return (
            <div key={step.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
              <button
                onClick={() => canNavigate && setActiveStep(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8,
                  background: isActive ? "#334155" : "transparent",
                  border: isActive ? "1px solid #3b82f6" : "1px solid transparent",
                  cursor: canNavigate ? "pointer" : "not-allowed", transition: "all 0.15s", whiteSpace: "nowrap",
                  opacity: canNavigate ? 1 : 0.5,
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                  background: isDone ? "#059669" : isActive ? "#3b82f6" : "#334155",
                  color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {isDone ? <Check size={14} /> : <StepIcon size={14} />}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#f1f5f9" : isDone ? "#6ee7b7" : "#94a3b8" }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 10, color: isDone ? "#059669" : isActive ? "#3b82f6" : "#475569", fontWeight: 600 }}>
                    {completeness}%
                  </div>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, margin: "0 4px", background: isDone ? "#059669" : "#334155", borderRadius: 1, minWidth: 16 }} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 170px)" }}>
        {/* Side navigation */}
        <div style={{ width: 220, minWidth: 220, background: "#1e293b", borderRight: "1px solid #334155", padding: "16px 0" }}>
          {STEPS.map((step, i) => {
            const completeness = getStepCompleteness(step.id);
            const isActive = activeStep === i;
            const StepIcon = step.icon;
            const canNavigate = i <= activeStep || Array.from({ length: i }, (_, idx) => STEPS[idx].id).every((sid) => isStepComplete(sid));
            return (
              <button
                key={step.id}
                onClick={() => canNavigate && setActiveStep(i)}
                style={{
                  width: "100%", display: "flex", flexDirection: "column", gap: 4,
                  padding: "14px 18px",
                  background: isActive ? "#334155" : "transparent",
                  border: "none",
                  borderLeftWidth: 3, borderLeftStyle: "solid", borderLeftColor: isActive ? "#3b82f6" : "transparent",
                  color: isActive ? "#f1f5f9" : "#94a3b8",
                  cursor: canNavigate ? "pointer" : "not-allowed", textAlign: "left", transition: "all 0.15s",
                  opacity: canNavigate ? 1 : 0.5,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StepIcon size={18} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{i + 1}. {step.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{step.desc}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, marginLeft: 26 }}>
                  <ProgressBar value={completeness} max={100} color={completeness > 60 ? "#059669" : completeness > 30 ? "#d97706" : "#475569"} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: completeness > 60 ? "#059669" : completeness > 30 ? "#d97706" : "#475569", minWidth: 32 }}>
                    {completeness}%
                  </span>
                </div>
              </button>
            );
          })}

          {/* Visual flow */}
          <div style={{ padding: "20px 18px", borderTop: "1px solid #334155", marginTop: 16 }}>
            <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>Proceso srautas</div>
            {STEPS.map((step, i) => (
              <div key={step.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    background: getStepCompleteness(step.id) > 60 ? "#059669" : activeStep === i ? "#3b82f6" : "#334155",
                    color: "#fff",
                  }}>
                    {getStepCompleteness(step.id) > 60 ? <Check size={12} /> : i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: activeStep === i ? "#f1f5f9" : "#64748b" }}>{step.title}</span>
                  <span style={{ fontSize: 12, marginLeft: "auto" }}><Scale size={12} /></span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 1, height: 14, background: "#334155", marginLeft: 11 }} />
                )}
              </div>
            ))}
            <div style={{ fontSize: 11, color: "#475569", marginTop: 8, fontStyle: "italic", display: "flex", alignItems: "center", gap: 4 }}>
              <Scale size={11} /> = teisinis vertinimas kiekviename etape
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "24px 32px", overflowY: "auto", maxHeight: "calc(100vh - 170px)" }} className="wizard-scroll">
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            {activeStep === STEPS.length - 1 ? (
              <StepReport data={data} />
            ) : (
              <StepComponent data={data} setData={setData} />
            )}

            {/* Navigation */}
            {(() => {
              const currentStepId = STEPS[activeStep].id;
              const canGoNext = activeStep === STEPS.length - 1 || isStepComplete(currentStepId);
              const unhandled = (() => {
                if (canGoNext || activeStep === STEPS.length - 1) return 0;
                if (currentStepId === "evals") {
                  const allMetrics = EVAL_CATEGORIES.flatMap((cc) => cc.metrics);
                  const scores = data.evals?.scores || {};
                  const nc = data.evals?.needsConsult || {};
                  return allMetrics.filter((m) => scores[m.id] === undefined && !nc[m.id]).length;
                }
                if (currentStepId === "risks") {
                  const ra = data.risks?.assessments || {};
                  return DEFAULT_RISKS.filter((r) => ra[r.id] === undefined).length;
                }
                return getStepFieldKeys(currentStepId).filter((k) => !isFieldHandled(k)).length;
              })();
              return (
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #334155" }}>
                  {!canGoNext && activeStep < STEPS.length - 1 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 14px", borderRadius: 8, background: "#dc262610", border: "1px solid #dc262630" }}>
                      <AlertTriangle size={14} style={{ color: "#fca5a5", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#fca5a5" }}>
                        {currentStepId === "risks"
                          ? `Liko ${unhandled} neįvertintų rizikų. Paspauskite ant kiekvienos rizikos ir nustatykite statusą.`
                          : `Liko ${unhandled} neužpildytų laukų. Užpildykite arba pažymėkite „Nežinau".`}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button
                      onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                      disabled={activeStep === 0}
                      style={{
                        padding: "10px 24px", borderRadius: 8, border: "1px solid #334155",
                        background: "#1e293b", color: activeStep === 0 ? "#475569" : "#e2e8f0",
                        cursor: activeStep === 0 ? "default" : "pointer", fontSize: 14, fontWeight: 500,
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <ArrowLeft size={14} /> {activeStep > 0 ? STEPS[activeStep - 1].title : ""}
                    </button>
                    <button
                      onClick={() => canGoNext && setActiveStep(Math.min(STEPS.length - 1, activeStep + 1))}
                      disabled={activeStep === STEPS.length - 1 || !canGoNext}
                      style={{
                        padding: "10px 24px", borderRadius: 8, border: "none",
                        background: !canGoNext || activeStep === STEPS.length - 1 ? "#334155" : "#1e40af",
                        color: !canGoNext || activeStep === STEPS.length - 1 ? "#475569" : "#fff",
                        cursor: !canGoNext || activeStep === STEPS.length - 1 ? "default" : "pointer",
                        fontSize: 14, fontWeight: 600,
                        display: "flex", alignItems: "center", gap: 6,
                        opacity: !canGoNext ? 0.5 : 1,
                      }}
                    >
                      {activeStep < STEPS.length - 1 ? <>{STEPS[activeStep + 1].title} <ArrowRight size={14} /></> : <><CheckCircle size={14} /> Dokumentas paruostas</>}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
