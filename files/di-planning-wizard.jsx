import { useState, useCallback, useMemo, useEffect } from "react";

// ============================================================
// DATA STRUCTURES
// ============================================================

const RISK_LEVELS = [
  { id: 0, label: "Minimali rizika", color: "#059669", bg: "#05966915", desc: "Rekomendacinis DI taikymo kodeksas" },
  { id: 1, label: "Ribota rizika", color: "#d97706", bg: "#d9770615", desc: "Skaidrumo reikalavimai (Art. 50)" },
  { id: 2, label: "Aukšta rizika", color: "#ea580c", bg: "#ea580c15", desc: "Pilna atitiktis (Art. 6-49, Annex III)" },
  { id: 3, label: "Nepriimtina rizika", color: "#dc2626", bg: "#dc262615", desc: "Draudžiama (Art. 5)" },
];

const ANNEX_III_CATEGORIES = [
  "Biometrinė identifikacija ir kategorizavimas",
  "Kritinės infrastruktūros valdymas",
  "Švietimas ir profesinis mokymas",
  "Įdarbinimas ir darbo santykiai",
  "Esminės privačios ir viešosios paslaugos",
  "Teisėsauga",
  "Migracija, prieglobstis ir sienų kontrolė",
  "Teisingumo administravimas ir demokratiniai procesai",
];

const STAKEHOLDER_ROLES = [
  { id: "business", label: "Verslo vadovai", icon: "👔", desc: "Strateginis poreikis, ROI" },
  { id: "process", label: "Proceso savininkai", icon: "📋", desc: "Kasdieniai procesai, validavimas" },
  { id: "legal", label: "Teisininkai", icon: "⚖️", desc: "DI Aktas, BDAR, reguliavimas" },
  { id: "dpo", label: "DAP (DPO)", icon: "🔒", desc: "Asmens duomenų apsauga" },
  { id: "ethics", label: "Etikos komisija", icon: "🏛️", desc: "Etiniai aspektai, šališkumas" },
  { id: "it", label: "IT architektai", icon: "🖥️", desc: "Infrastruktūra, integracija" },
  { id: "ml", label: "ML inžinieriai", icon: "🤖", desc: "Modeliai, duomenys, eval" },
  { id: "security", label: "Saugumo spec.", icon: "🛡️", desc: "Kibernetinis saugumas" },
  { id: "users", label: "Galutiniai naudotojai", icon: "👥", desc: "Naudojimo patirtis" },
  { id: "governance", label: "DI governance", icon: "📊", desc: "Atitiktis, auditas, stebėsena" },
];

const ARCH_COMPONENTS = [
  { id: "trigger", label: "Trigeris / Įvestis", icon: "⚡", examples: ["Webhook", "SOAP API", "Cron", "El. paštas", "Forma", "Failų stebėjimas"] },
  { id: "preprocess", label: "Pirminė apdoroja", icon: "🔄", examples: ["OCR", "NLP tokenizacija", "Duomenų validavimas", "Formato konvertavimas", "Anonimizacija"] },
  { id: "ai_model", label: "DI modelis", icon: "🧠", examples: ["LLM (Claude/GPT)", "Klasifikatorius", "NER", "OCR modelis", "Embedding", "Fine-tuned", "Ollama lokalus"] },
  { id: "logic", label: "Verslo logika", icon: "⚙️", examples: ["Taisyklių variklis", "Maršrutizavimas", "Prioritetizavimas", "Eskalavimas", "Workflow orchestracija"] },
  { id: "human", label: "Žmogiškoji priežiūra", icon: "👁️", examples: ["Patvirtinimo UI", "Klaidų peržiūra", "Override galimybė", "Eskalavimo taisyklės", "Audit log"] },
  { id: "output", label: "Išvestis / Veiksmas", icon: "📤", examples: ["Dokumentų sukūrimas", "Pranešimai", "DB įrašas", "API kvietimas", "Ataskaita", "Užduoties priskyrimas"] },
  { id: "storage", label: "Duomenų saugykla", icon: "💾", examples: ["PostgreSQL", "Supabase", "Vector DB", "Failų sistema", "Redis cache"] },
  { id: "monitoring", label: "Stebėsena", icon: "📡", examples: ["Metrikos dashboard", "Anomalijų detektorius", "Drift stebėjimas", "Logai", "Alertai"] },
];

const EVAL_CATEGORIES = [
  {
    id: "performance",
    title: "Veikimo metrikos",
    icon: "📈",
    metrics: [
      { id: "accuracy", name: "Tikslumas (Accuracy)", question: "Ar apibrėžtos ir pamatuojamos tikslumas/precision/recall metrikos?", scale: ["Neapibrėžtos", "Orientacinės", "Su slenkščiais", "Stebimos realiu laiku"], weight: 4, aiActRef: "Art. 15(1) – tikslumas", stakeholders: ["ML inžinieriai", "Domeno ekspertai"] },
      { id: "robustness", name: "Patvarumas (Robustness)", question: "Ar sistema testuota su nestandartiniais/adversariniais duomenimis?", scale: ["Netestuota", "Baziniai testai", "Adversariniai testai", "Raudonoji komanda"], weight: 4, aiActRef: "Art. 15(4) – patvarumas", stakeholders: ["Saugumo specialistai", "ML inžinieriai"] },
      { id: "latency", name: "Atsakymo laikas", question: "Ar sistemos atsakymo laikas atitinka naudotojų lūkesčius?", scale: [">30s", "10-30s", "2-10s", "<2s"], weight: 3, aiActRef: "Art. 15(3)", stakeholders: ["IT architektai", "Naudotojai"] },
    ],
  },
  {
    id: "fairness",
    title: "Teisingumas ir šališkumas",
    icon: "⚖️",
    metrics: [
      { id: "bias", name: "Šališkumo vertinimas", question: "Ar tikrintas modelio šališkumas pagal saugomas grupes?", scale: ["Netikrintas", "Bazinė analizė", "Statistiniai testai", "Nuolatinė stebėsena"], weight: 5, aiActRef: "Art. 10(2)(f) – šališkumo aptikimas", stakeholders: ["Etikos komisija", "Domeno ekspertai", "Teisininkai"], critical: true },
      { id: "disparate", name: "Skirtingas poveikis", question: "Ar DI sprendimai nedaro neproporcinio poveikio tam tikroms grupėms?", scale: ["Netikrinta", "Identifikuota", "Matuojama", "Kompensuojama"], weight: 4, aiActRef: "Art. 10(2)(f)", stakeholders: ["Etikos komisija", "Teisininkai"] },
    ],
  },
  {
    id: "transparency",
    title: "Skaidrumas ir paaiškinamumas",
    icon: "🔍",
    metrics: [
      { id: "explainability", name: "Paaiškinamumas", question: "Ar DI sprendimai bus paaiškinami naudotojams?", scale: ["Juoda dėžė", "Techniniai logai", "Suprantami paaiškinimai", "Interaktyvūs"], weight: 4, aiActRef: "Art. 13 – skaidrumas ir informacijos teikimas", stakeholders: ["UX dizaineriai", "Naudotojai", "Teisininkai"] },
      { id: "audit_trail", name: "Audito pėdsakas", question: "Ar visi DI sprendimai automatiškai registruojami?", scale: ["Neregistruojami", "Daliniai logai", "Pilni logai", "Su analize ir alertais"], weight: 5, aiActRef: "Art. 12 – įvykių registravimas", stakeholders: ["DI governance", "Auditoriai"], critical: true },
      { id: "user_notice", name: "Naudotojo informavimas", question: "Ar naudotojas žino, kad bendrauja su DI sistema?", scale: ["Neinformuotas", "Terms of Service", "Aktyvus pranešimas", "Interaktyvus paaiškinimas"], weight: 4, aiActRef: "Art. 50 – skaidrumo pareigos", stakeholders: ["UX", "Teisininkai"] },
      { id: "confidence", name: "Patikimumo rodikliai", question: "Ar sistema nurodo savo sprendimų patikimumą (confidence)?", scale: ["Nenurodo", "Vidinis", "Rodomas specialistui", "Rodomas visiems naudotojams"], weight: 3, aiActRef: "Art. 13", stakeholders: ["ML inžinieriai", "UX"] },
    ],
  },
  {
    id: "safety",
    title: "Saugumas ir atsparumas",
    icon: "🛡️",
    metrics: [
      { id: "adversarial", name: "Adversarinė atsparumas", question: "Ar sistema apsaugota nuo tyčinių manipuliavimų?", scale: ["Neapsaugota", "Bazinė validacija", "Adversariniai testai", "Nuolatinis monitoringas"], weight: 4, aiActRef: "Art. 15(5) – kibernetinis saugumas", stakeholders: ["Saugumo specialistai"] },
      { id: "fallback", name: "Fallback mechanizmas", question: "Kas nutinka kai DI sistema klysta arba neveikia?", scale: ["Sistema sustoja", "Klaidos pranešimas", "Graceful degradation", "Auto-failover su žmogumi"], weight: 5, aiActRef: "Art. 15(4) – patvarumas", stakeholders: ["IT architektai", "Proceso savininkai"], critical: true },
      { id: "data_quality", name: "Duomenų kokybės kontrolė", question: "Ar užtikrinama įvesties duomenų kokybė?", scale: ["Nekontroliuojama", "Bazinė validacija", "Statistinė kontrolė", "Su anomalijų aptikimu"], weight: 4, aiActRef: "Art. 10 – duomenų valdymas", stakeholders: ["Duomenų inžinieriai", "Domeno ekspertai"] },
    ],
  },
  {
    id: "oversight",
    title: "Žmogiškoji priežiūra",
    icon: "👁️",
    metrics: [
      { id: "human_override", name: "Override galimybė", question: "Ar žmogus gali bet kada pakeisti DI sprendimą?", scale: ["Negali", "Techninė galimybė", "Lengvai pasiekiama", "Vienu mygtuku + audit"], weight: 5, aiActRef: "Art. 14 – žmogiškoji priežiūra", stakeholders: ["Proceso savininkai", "Naudotojai"], critical: true },
      { id: "escalation", name: "Eskalavimo procesas", question: "Ar apibrėžtas procesas kai DI negali priimti sprendimo?", scale: ["Neapibrėžtas", "Ad hoc", "Struktūrizuotas", "Automatinis su SLA"], weight: 4, aiActRef: "Art. 14", stakeholders: ["Proceso savininkai", "Vadovybė"] },
      { id: "domain_validation", name: "Domeno ekspertų validavimas", question: "Ar ne-techniniai ekspertai validavo DI rezultatus?", scale: ["Nevalidavo", "Informuoti", "Peržiūrėjo", "Aktyviai testavo"], weight: 5, aiActRef: "Art. 14 – žmogiškoji priežiūra", stakeholders: ["Proceso savininkai", "Vadovybė", "Naudotojai"], critical: true },
    ],
  },
  {
    id: "operational",
    title: "Operacinės ir stebėsenos metrikos",
    icon: "📡",
    metrics: [
      { id: "uptime", name: "Veikimo laikas (Uptime)", question: "Koks sistemos prieinamumo reikalavimas?", scale: ["<95%", "95-99%", "99-99.5%", "99.9%+"], weight: 3, aiActRef: "", stakeholders: ["IT architektai", "DevOps"] },
      { id: "drift", name: "Modelio drift stebėsena", question: "Ar stebimas modelio veikimo pablogėjimas laikui bėgant?", scale: ["Nestebimas", "Rankinė peržiūra", "Automatinis aptikimas", "Su auto-retrain"], weight: 4, aiActRef: "Art. 72 – po pateikimo stebėsena", stakeholders: ["ML inžinieriai", "Domeno ekspertai"] },
      { id: "incident", name: "Incidentų valdymas", question: "Ar yra incidentų registravimo ir eskalavimo procesas?", scale: ["Nėra", "Ad hoc", "Struktūrizuotas", "Su automatiniais alertais"], weight: 5, aiActRef: "Art. 73 – rimtų incidentų pranešimas", stakeholders: ["Operacijų komanda", "Vadovybė", "Teisininkai"], critical: true },
      { id: "periodic_audit", name: "Periodinis auditas", question: "Ar atliekamas periodinis DI sistemos auditas?", scale: ["Nėra", "Kasmetis vidinis", "Kasmetis + išorinis", "Nuolatinis + išorinis"], weight: 4, aiActRef: "Art. 9(9) – dokumentavimas ir peržiūra", stakeholders: ["DI governance", "Išoriniai auditoriai"] },
    ],
  },
];

// ============================================================
// HELPER COMPONENTS
// ============================================================

const Card = ({ children, style = {}, highlight = false }) => (
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

const SectionTitle = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: 20 }}>
    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 18 }}>{icon}</span> {title}
    </h3>
    {subtitle && <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{subtitle}</p>}
  </div>
);

const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
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

const Input = ({ value, onChange, placeholder, style = {} }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
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

const ChipSelect = ({ options, selected, onToggle, multi = true }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
    {options.map((opt) => {
      const isSelected = multi ? selected.includes(opt.id || opt) : selected === (opt.id || opt);
      const label = opt.label || opt;
      return (
        <button
          key={opt.id || opt}
          onClick={() => onToggle(opt.id || opt)}
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
          }}
        >
          {opt.icon ? `${opt.icon} ` : ""}{label}
        </button>
      );
    })}
  </div>
);

const ProgressBar = ({ value, max, color }) => (
  <div style={{ background: "#0f172a", borderRadius: 6, height: 6, overflow: "hidden", flex: 1 }}>
    <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: "100%", background: color || "#3b82f6", borderRadius: 6, transition: "width 0.4s ease" }} />
  </div>
);

// ============================================================
// STEP 1: PROBLEMA
// ============================================================

function StepProblem({ data, setData }) {
  const update = (key, val) => setData((d) => ({ ...d, problem: { ...d.problem, [key]: val } }));
  const p = data.problem || {};
  const toggleStakeholder = (id) => {
    const list = p.stakeholders || [];
    update("stakeholders", list.includes(id) ? list.filter((s) => s !== id) : [...list, id]);
  };

  return (
    <div>
      <Card>
        <SectionTitle icon="📝" title="Problemos aprašymas" subtitle="Apibrėžkite problemą, kurią DI sistema turėtų spręsti" />
        <TextArea value={p.description || ""} onChange={(v) => update("description", v)} placeholder="Pvz.: ŽŪDC kasdien gauna 50-100 dokumentų per Avilys DVS. Kanceliarijos darbuotojai rankiniu būdu skirsto dokumentus pagal skyrius, priskirdami atsakingus asmenis. Procesas užima ~2h/dieną, klaidos dažnis ~15%, terminų praleidimas ~8%." rows={4} />
      </Card>

      <Card>
        <SectionTitle icon="🎯" title="Dabartinė situacija (AS-IS)" subtitle="Kaip problema sprendžiama dabar?" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Dabartinis procesas</label>
            <TextArea value={p.currentProcess || ""} onChange={(v) => update("currentProcess", v)} placeholder="Rankinis dokumentų skirstymas..." rows={3} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Pagrindinės problemos</label>
            <TextArea value={p.painPoints || ""} onChange={(v) => update("painPoints", v)} placeholder="1. Lėtas procesas&#10;2. Žmogiškosios klaidos&#10;3. Terminų praleidimas" rows={3} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Laikas (val./dieną)</label>
            <Input value={p.timeSpent || ""} onChange={(v) => update("timeSpent", v)} placeholder="2" style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Klaidų dažnis (%)</label>
            <Input value={p.errorRate || ""} onChange={(v) => update("errorRate", v)} placeholder="15" style={{ width: "100%" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Apimtis (vnt./dieną)</label>
            <Input value={p.volume || ""} onChange={(v) => update("volume", v)} placeholder="75" style={{ width: "100%" }} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon="⚖️" title="Rizikos klasifikacija pagal ES DI Aktą" subtitle="Nustatykite sistemos rizikos lygį" />
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
        <SectionTitle icon="💡" title="Kodėl DI?" subtitle="Pagrįskite, kodėl DI yra tinkamas sprendimas" />
        <TextArea value={p.whyAI || ""} onChange={(v) => update("whyAI", v)} placeholder="Pvz.: Dokumentų klasifikavimas pagal turinį reikalauja natūralios kalbos supratimo, kurio neįmanoma realizuoti taisyklėmis. DI gali pasiekti >90% tikslumą su žmogiškąja priežiūra (human-in-the-loop)." rows={3} />
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Ar svarstėte alternatyvas be DI?</label>
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
        <SectionTitle icon="👥" title="Suinteresuotieji šalys" subtitle="Kas turi dalyvauti sprendimų priėmime? (⚖️ = ne tik technikai!)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {STAKEHOLDER_ROLES.map((s) => {
            const isSelected = (p.stakeholders || []).includes(s.id);
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
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? "#93c5fd" : "#94a3b8" }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle icon="✅" title="Sėkmės kriterijai (TO-BE)" subtitle="Kaip atrodys sėkmė?" />
        <TextArea value={p.successCriteria || ""} onChange={(v) => update("successCriteria", v)} placeholder="1. Dokumentų klasifikavimo tikslumas ≥90%&#10;2. Apdorojimo laikas <30 sek./dokumentas&#10;3. Terminų praleidimas sumažėja iki <2%&#10;4. Darbuotojų laikas sutaupomas ≥1.5 val./dieną" rows={4} />
      </Card>
    </div>
  );
}

// ============================================================
// STEP 2: SISTEMOS KONCEPTAS
// ============================================================

function StepConcept({ data, setData }) {
  const update = (key, val) => setData((d) => ({ ...d, concept: { ...d.concept, [key]: val } }));
  const c = data.concept || {};

  return (
    <div>
      <Card>
        <SectionTitle icon="🏗️" title="Sistemos vizija" subtitle="Aukšto lygio sistemos aprašymas" />
        <TextArea value={c.vision || ""} onChange={(v) => update("vision", v)} placeholder="Pvz.: Multi-agentų DI sistema, kuri automatiškai klasifikuoja gaunamus dokumentus ŽŪDC Avilys DVS sistemoje, priskiria atsakingus skyrius ir specialistus, stebi terminus ir aptinka anomalijas organizacijos dokumentų srautuose." rows={3} />
      </Card>

      <Card>
        <SectionTitle icon="🔌" title="Integracijos taškai" subtitle="Su kokiomis sistemomis DI turės sąveikauti?" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { key: "inputSystems", label: "Įvesties sistemos", placeholder: "Pvz.: Avilys DVS (SOAP API), El. paštas" },
            { key: "outputSystems", label: "Išvesties sistemos", placeholder: "Pvz.: Avilys DVS, Pranešimų sistema" },
            { key: "dataSources", label: "Duomenų šaltiniai", placeholder: "Pvz.: Istoriniai dokumentai, Org. struktūra" },
            { key: "orchestration", label: "Orkestracija", placeholder: "Pvz.: n8n, Apache Airflow, Custom" },
          ].map((f) => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{f.label}</label>
              <TextArea value={c[f.key] || ""} onChange={(v) => update(f.key, v)} placeholder={f.placeholder} rows={2} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle icon="🤖" title="DI modelio strategija" subtitle="Koks DI modelis bus naudojamas?" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {[
            { id: "cloud_llm", label: "☁️ Cloud LLM (Claude, GPT)" },
            { id: "local_llm", label: "🏠 Lokalus LLM (Ollama)" },
            { id: "custom_ml", label: "🔬 Custom ML modelis" },
            { id: "hybrid", label: "🔀 Hibridinis" },
            { id: "rag", label: "📚 RAG sistema" },
            { id: "fine_tuned", label: "🎯 Fine-tuned modelis" },
          ].map((opt) => {
            const isSelected = (c.modelStrategy || []).includes(opt.id);
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
              }}>{opt.label}</button>
            );
          })}
        </div>
        <TextArea value={c.modelRationale || ""} onChange={(v) => update("modelRationale", v)} placeholder="Pagrindimas: Kodėl pasirinkta ši modelio strategija? Duomenų saugumo, kainos, veikimo aspektai..." rows={2} />
      </Card>

      <Card>
        <SectionTitle icon="👁️" title="Žmogiškoji priežiūra (Human Oversight)" subtitle="Art. 14 – kaip žmogus kontroliuos DI sprendimus?" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { id: "hitl", label: "Human-in-the-Loop", desc: "Žmogus patvirtina kiekvieną DI sprendimą prieš veiksmą", level: "Aukščiausias" },
            { id: "hotl", label: "Human-on-the-Loop", desc: "DI veikia autonomiškai, žmogus stebi ir gali sustabdyti", level: "Vidutinis" },
            { id: "hocl", label: "Human-over-the-Loop", desc: "Žmogus nustato taisykles ir periodiškai peržiūri", level: "Bazinis" },
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
                {isRisky && <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 10, background: "#dc262630", color: "#fca5a5" }}>⚠️ Nerekomenduojama aukštai rizikai</span>}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Override mechanizmas</label>
          <TextArea value={c.overrideMechanism || ""} onChange={(v) => update("overrideMechanism", v)} placeholder="Aprašykite, kaip naudotojas galės pakeisti DI sprendimą..." rows={2} />
        </div>
      </Card>

      <Card>
        <SectionTitle icon="🔒" title="Duomenų apsauga ir BDAR" subtitle="Asmens duomenų tvarkymas DI sistemoje" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Tvarkomi asmens duomenys</label>
            <TextArea value={c.personalData || ""} onChange={(v) => update("personalData", v)} placeholder="Vardai, pareigos, el. pašto adresai dokumentuose..." rows={2} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Duomenų minimizavimas</label>
            <TextArea value={c.dataMinimization || ""} onChange={(v) => update("dataMinimization", v)} placeholder="Kaip užtikriname, kad naudojami tik būtini duomenys..." rows={2} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {[
            { id: "dpia", label: "DPIA atliktas" },
            { id: "legal_basis", label: "Teisinis pagrindas apibrėžtas" },
            { id: "retention", label: "Saugojimo terminai nustatyti" },
            { id: "subject_rights", label: "Duomenų subjektų teisės" },
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
              }}>
                {isChecked ? "✓ " : "○ "}{check.label}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle icon="📅" title="Diegimo planas" subtitle="Etapai ir laiko planas" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { key: "phase1", label: "1 fazė: PoC / Sandbox", placeholder: "Trukmė, apimtis..." },
            { key: "phase2", label: "2 fazė: Pilotas", placeholder: "Ribota aplinka, testavimas..." },
            { key: "phase3", label: "3 fazė: Produkcija", placeholder: "Pilnas diegimas..." },
          ].map((f) => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>{f.label}</label>
              <TextArea value={c[f.key] || ""} onChange={(v) => update(f.key, v)} placeholder={f.placeholder} rows={3} />
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

function StepEvals({ data, setData }) {
  const update = (key, val) => setData((d) => ({ ...d, evals: { ...d.evals, [key]: val } }));
  const e = data.evals || {};
  const [expandedMetric, setExpandedMetric] = useState(null);

  const handleScore = useCallback((metricId, value) => {
    const scores = { ...(e.scores || {}), [metricId]: value };
    update("scores", scores);
  }, [e.scores]);

  const scores = e.scores || {};
  const allMetrics = EVAL_CATEGORIES.flatMap((c) => c.metrics);
  const answeredCount = allMetrics.filter((m) => scores[m.id] !== undefined).length;
  const criticalMetrics = allMetrics.filter((m) => m.critical);
  const criticalIssues = criticalMetrics.filter((m) => scores[m.id] !== undefined && scores[m.id] <= 1);

  const totalWeighted = allMetrics.reduce((sum, m) => sum + (scores[m.id] !== undefined ? m.weight * scores[m.id] : 0), 0);
  const maxWeighted = allMetrics.reduce((sum, m) => sum + m.weight * 3, 0);
  const overallPct = maxWeighted > 0 ? Math.round((totalWeighted / maxWeighted) * 100) : 0;

  const getColor = (pct) => pct >= 75 ? "#059669" : pct >= 50 ? "#d97706" : pct >= 25 ? "#ea580c" : "#dc2626";
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
            <SectionTitle icon="📊" title="DI Sistemos Vertinimo Metrikos" subtitle="Įvertinkite kiekvieną metriką 4 lygių skalėje (0-3). Kritinės metrikos pažymėtos raudonai." />
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
          </div>
        </div>
        {criticalIssues.length > 0 && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#dc262615", border: "1px solid #dc2626", borderRadius: 8 }}>
            <span style={{ fontSize: 13, color: "#fca5a5", fontWeight: 600 }}>🚨 Kritinės spragos: </span>
            <span style={{ fontSize: 13, color: "#fca5a5" }}>{criticalIssues.map((m) => m.name).join(", ")}</span>
          </div>
        )}
      </Card>

      {/* Categories */}
      {EVAL_CATEGORIES.map((cat) => {
        const catScore = cat.metrics.reduce((s, m) => s + (scores[m.id] !== undefined ? m.weight * scores[m.id] : 0), 0);
        const catMax = cat.metrics.reduce((s, m) => s + m.weight * 3, 0);
        const catPct = catMax > 0 ? Math.round((catScore / catMax) * 100) : 0;

        return (
          <Card key={cat.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <SectionTitle icon={cat.icon} title={cat.title} />
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
                    background: "#0f172a",
                    border: `1px solid ${metric.critical && val !== undefined && val <= 1 ? "#dc2626" : "#334155"}`,
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
                          <span style={{ fontSize: 11, color: "#475569" }}>svoris ×{metric.weight}</span>
                        </div>
                        <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>{metric.question}</p>
                      </div>
                      <button onClick={() => setExpandedMetric(isExpanded ? null : metric.id)}
                        style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12, padding: "4px 8px", flexShrink: 0 }}>
                        {isExpanded ? "▲" : "▼"} Info
                      </button>
                    </div>

                    {/* Scale buttons */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {metric.scale.map((label, si) => {
                        const isSelected = val === si;
                        const c = btnColors[si];
                        return (
                          <button key={si} onClick={() => handleScore(metric.id, si)}
                            style={{
                              flex: 1, minWidth: 110, padding: "8px 10px", borderRadius: 8,
                              border: `2px solid ${isSelected ? c.border : "#334155"}`,
                              background: isSelected ? c.bg : "#1e293b",
                              color: isSelected ? c.text : "#64748b",
                              cursor: "pointer", fontSize: 12, fontWeight: isSelected ? 700 : 400,
                              transition: "all 0.15s", textAlign: "center",
                            }}>
                            <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 2 }}>{si}/3</div>
                            {label}
                          </button>
                        );
                      })}
                    </div>

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
        <SectionTitle icon="🧪" title="Testavimo strategija" subtitle="Kaip bus tikrinamos metrikos?" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {["Unit testai", "Integraciniai testai", "A/B testavimas", "Adversariniai testai", "Raudonoji komanda", "Naudotojų testavimas", "Streso testai", "Regresijos testai"].map((t) => {
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
              }}>{isSelected ? "✓ " : ""}{t}</button>
            );
          })}
        </div>
        <TextArea value={e.testingNotes || ""} onChange={(v) => update("testingNotes", v)} placeholder="Papildomi testavimo reikalavimai ar pastabos..." rows={2} />
      </Card>
    </div>
  );
}

// ============================================================
// STEP 4: SISTEMOS PROTOTIPAS (ARCHITEKTŪRA)
// ============================================================

function StepArchitecture({ data, setData }) {
  const update = (key, val) => setData((d) => ({ ...d, architecture: { ...d.architecture, [key]: val } }));
  const a = data.architecture || {};
  const [selectedComp, setSelectedComp] = useState(null);

  const setCompDetail = (compId, field, val) => {
    const details = { ...(a.componentDetails || {}) };
    details[compId] = { ...(details[compId] || {}), [field]: val };
    update("componentDetails", details);
  };

  const toggleComponent = (compId) => {
    const list = a.selectedComponents || [];
    update("selectedComponents", list.includes(compId) ? list.filter((x) => x !== compId) : [...list, compId]);
  };

  return (
    <div>
      <Card>
        <SectionTitle icon="🧩" title="Architektūros komponentai" subtitle="Pasirinkite ir sukonfigūruokite sistemos komponentus" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {ARCH_COMPONENTS.map((comp) => {
            const isSelected = (a.selectedComponents || []).includes(comp.id);
            const isOpen = selectedComp === comp.id;
            const details = (a.componentDetails || {})[comp.id] || {};
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
                  }}>{isSelected ? "✓" : ""}</div>
                  <span style={{ fontSize: 20 }}>{comp.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? "#93c5fd" : "#94a3b8" }}>{comp.label}</div>
                  </div>
                  {isSelected && (
                    <button onClick={(ev) => { ev.stopPropagation(); setSelectedComp(isOpen ? null : comp.id); }}
                      style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12, padding: "4px 8px" }}>
                      {isOpen ? "▲" : "▼"} Detalės
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
                      <TextArea value={details.notes || ""} onChange={(v) => setCompDetail(comp.id, "notes", v)} placeholder="Konfigūracija, specifika..." rows={2} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle icon="🔀" title="Duomenų srautas (Data Flow)" subtitle="Aprašykite, kaip duomenys keliauja per sistemą" />
        <TextArea value={a.dataFlow || ""} onChange={(v) => update("dataFlow", v)} placeholder={"1. Dokumentas ateina per Avilys SOAP API (Webhook)\n2. OCR ištraukia tekstą iš PDF/skanuoto dokumento\n3. LLM klasifikuoja: tipas, skyrius, prioritetas, atsakingas\n4. Verslo taisyklės patikrina ir maršrutuoja\n5. Žmogus patvirtina (jei confidence < 85%)\n6. Rezultatas grąžinamas į Avilys per SOAP\n7. Metrikos registruojamos Supabase"} rows={7} />
      </Card>

      <Card>
        <SectionTitle icon="🏗️" title="Infrastruktūros planas" subtitle="Kur ir kaip bus diegiama sistema?" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {[
            { id: "on_premise", label: "🏢 On-Premise" },
            { id: "private_cloud", label: "☁️ Privati debesija" },
            { id: "public_cloud", label: "🌐 Viešoji debesija" },
            { id: "hybrid", label: "🔀 Hibridinė" },
            { id: "govai_sandbox", label: "🏛️ GovAI smėliadėžė" },
          ].map((opt) => {
            const isSelected = a.infrastructure === opt.id;
            return (
              <button key={opt.id} onClick={() => update("infrastructure", opt.id)} style={{
                padding: "8px 18px", borderRadius: 8,
                border: `2px solid ${isSelected ? "#3b82f6" : "#334155"}`,
                background: isSelected ? "#1e40af20" : "#0f172a",
                color: isSelected ? "#93c5fd" : "#94a3b8",
                cursor: "pointer", fontSize: 13, fontWeight: isSelected ? 600 : 400,
              }}>{opt.label}</button>
            );
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Saugumo reikalavimai</label>
            <TextArea value={a.securityReqs || ""} onChange={(v) => update("securityReqs", v)} placeholder="Tinklo izoliacija, šifravimas, prieigos kontrolė..." rows={3} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Mastelio reikalavimai</label>
            <TextArea value={a.scaleReqs || ""} onChange={(v) => update("scaleReqs", v)} placeholder="Apkrovos lūkesčiai, augimo planas..." rows={3} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon="⚠️" title="Rizikos ir mitigacijos" subtitle="Techninės ir organizacinės rizikos" />
        <TextArea value={a.risks || ""} onChange={(v) => update("risks", v)} placeholder={"Rizika | Tikimybė | Poveikis | Mitigacija\n------|----------|---------|----------\nAvilys API nestabilumas | Vidutinė | Aukštas | Retry logika + cache\nModelio hallucinations | Aukšta | Vidutinis | Human-in-the-loop + confidence threshold\nDuomenų nutekėjimas | Žema | Kritinis | On-premise diegimas, VPN, audit logai"} rows={6} />
      </Card>
    </div>
  );
}

// ============================================================
// STEP 5: ATASKAITA / TECHNINĖ SPECIFIKACIJA
// ============================================================

const RISK_MAP = { 0: "Minimali rizika", 1: "Ribota rizika (Art. 50)", 2: "Aukšta rizika (Art. 6-49)", 3: "Nepriimtina (Art. 5)" };
const OVERSIGHT_MAP = { hitl: "Human-in-the-Loop", hotl: "Human-on-the-Loop", hocl: "Human-over-the-Loop", auto: "Pilnai automatinis" };
const INFRA_MAP = { on_premise: "On-Premise", private_cloud: "Privati debesija", public_cloud: "Viešoji debesija", hybrid: "Hibridinė", govai_sandbox: "GovAI smėliadėžė" };
const STAKEHOLDER_MAP = { business: "Verslo vadovai", process: "Proceso savininkai", legal: "Teisininkai", dpo: "DAP", ethics: "Etikos komisija", it: "IT architektai", ml: "ML inžinieriai", security: "Saugumo spec.", users: "Naudotojai", governance: "DI governance" };
const MODEL_MAP = { cloud_llm: "Cloud LLM", local_llm: "Lokalus LLM", custom_ml: "Custom ML", hybrid: "Hibridinis", rag: "RAG", fine_tuned: "Fine-tuned" };
const COMP_MAP = { trigger: "Trigeris", preprocess: "Pirminė apdoroja", ai_model: "DI modelis", logic: "Verslo logika", human: "Žmogiškoji priežiūra", output: "Išvestis", storage: "Duomenų saugykla", monitoring: "Stebėsena" };

const AI_ACT_REQUIREMENTS = [
  { art: "Art. 4", title: "DI raštingumas", check: (d) => d.concept?.phase2 },
  { art: "Art. 9", title: "Rizikos valdymo sistema", check: (d) => d.problem?.riskLevel !== undefined },
  { art: "Art. 10", title: "Duomenų valdymas", check: (d) => d.concept?.dataMinimization },
  { art: "Art. 11", title: "Techninė dokumentacija", check: () => true },
  { art: "Art. 12", title: "Įvykių registravimas", check: (d) => (d.evals?.scores || {}).audit_trail !== undefined },
  { art: "Art. 13", title: "Skaidrumas", check: (d) => (d.evals?.scores || {}).explainability !== undefined },
  { art: "Art. 14", title: "Žmogiškoji priežiūra", check: (d) => d.concept?.oversightLevel },
  { art: "Art. 15", title: "Tikslumas ir patvarumas", check: (d) => (d.evals?.scores || {}).accuracy !== undefined },
  { art: "Art. 50", title: "Skaidrumo pareigos", check: (d) => (d.evals?.scores || {}).user_notice !== undefined },
  { art: "Art. 72", title: "Po pateikimo stebėsena", check: (d) => d.architecture?.selectedComponents?.includes("monitoring") },
  { art: "BDAR", title: "DPIA atliktas", check: (d) => (d.concept?.gdprChecks || []).includes("dpia") },
];

function ReportSection({ num, title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#93c5fd", margin: "0 0 12px", paddingBottom: 8, borderBottom: "1px solid #334155" }}>
        {num}. {title}
      </h3>
      {children}
    </div>
  );
}

function RField({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{label}: </span>
      <span style={{ fontSize: 13, color: "#e2e8f0" }}>{value}</span>
    </div>
  );
}

function RTable({ headers, rows }) {
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

function StepReport({ data }) {
  const p = data.problem || {};
  const c = data.concept || {};
  const e = data.evals || {};
  const a = data.architecture || {};
  const filledMetrics = Object.entries(e.scores || {}).filter(([, v]) => v !== undefined);
  const compliance = AI_ACT_REQUIREMENTS.map((r) => ({ ...r, met: r.check(data) }));
  const compliancePct = Math.round((compliance.filter((c) => c.met).length / compliance.length) * 100);

  const downloadJSON = () => {
    // Transform wizard evals scores (0-3) into DOCX generator metrics format
    const scaleToMetric = (metricId, scoreVal) => {
      // Map known metric IDs to meaningful target/minimum values based on score level
      const mappings = {
        accuracy: [{ target: "", minimum: "" }, { target: "70", minimum: "60" }, { target: "85", minimum: "75" }, { target: "95", minimum: "90" }],
        robustness: [{ target: "", minimum: "" }, { target: "60", minimum: "50" }, { target: "80", minimum: "70" }, { target: "95", minimum: "85" }],
        latency: [{ target: "", minimum: "" }, { target: "30000", minimum: "60000" }, { target: "10000", minimum: "30000" }, { target: "2000", minimum: "5000" }],
        bias: [{ target: "", minimum: "" }, { target: "pradeta", minimum: "" }, { target: "<5%", minimum: "<10%" }, { target: "<2%", minimum: "<5%" }],
        disparate: [{ target: "", minimum: "" }, { target: "identifikuota", minimum: "" }, { target: "matuojama", minimum: "" }, { target: "kompensuojama", minimum: "" }],
        explainability: [{ target: "", minimum: "" }, { target: "2", minimum: "1" }, { target: "4", minimum: "3" }, { target: "5", minimum: "4" }],
        audit_trail: [{ target: "", minimum: "" }, { target: "daliniai", minimum: "" }, { target: "taip", minimum: "taip" }, { target: "taip+analize", minimum: "taip" }],
        user_notice: [{ target: "", minimum: "" }, { target: "ToS", minimum: "" }, { target: "taip", minimum: "taip" }, { target: "interaktyvus", minimum: "taip" }],
        confidence: [{ target: "", minimum: "" }, { target: "vidinis", minimum: "" }, { target: "specialistui", minimum: "" }, { target: "visiems", minimum: "specialistui" }],
        adversarial: [{ target: "", minimum: "" }, { target: "bazine", minimum: "" }, { target: "testai", minimum: "bazine" }, { target: "nuolatinis", minimum: "testai" }],
        fallback: [{ target: "", minimum: "" }, { target: "klaida", minimum: "" }, { target: "graceful", minimum: "klaida" }, { target: "auto-failover", minimum: "graceful" }],
        data_quality: [{ target: "", minimum: "" }, { target: "validacija", minimum: "" }, { target: "statistine", minimum: "validacija" }, { target: "anomalijos", minimum: "statistine" }],
        human_override: [{ target: "", minimum: "" }, { target: "technine", minimum: "" }, { target: "lengva", minimum: "technine" }, { target: "1-click+audit", minimum: "lengva" }],
        escalation: [{ target: "", minimum: "" }, { target: "ad-hoc", minimum: "" }, { target: "strukturizuotas", minimum: "" }, { target: "auto+SLA", minimum: "strukturizuotas" }],
        domain_validation: [{ target: "", minimum: "" }, { target: "informuoti", minimum: "" }, { target: "perziurejo", minimum: "" }, { target: "testavo", minimum: "perziurejo" }],
        uptime: [{ target: "", minimum: "" }, { target: "95", minimum: "90" }, { target: "99.5", minimum: "99" }, { target: "99.9", minimum: "99.5" }],
        drift: [{ target: "", minimum: "" }, { target: "rankine", minimum: "" }, { target: "auto", minimum: "" }, { target: "auto+retrain", minimum: "auto" }],
        incident: [{ target: "", minimum: "" }, { target: "ad-hoc", minimum: "" }, { target: "strukturizuotas", minimum: "" }, { target: "auto+alertai", minimum: "strukturizuotas" }],
        periodic_audit: [{ target: "", minimum: "" }, { target: "kasmetis", minimum: "" }, { target: "kasmetis+isorinis", minimum: "kasmetis" }, { target: "nuolatinis+isorinis", minimum: "kasmetis+isorinis" }],
      };
      const m = mappings[metricId];
      if (m && scoreVal !== undefined) return m[scoreVal] || { target: String(scoreVal), minimum: "" };
      return { target: String(scoreVal || ""), minimum: "" };
    };

    // Build DOCX-compatible metrics from scores
    const evalsScores = data.evals?.scores || {};
    const docxMetrics = {};
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
        docType: "Technine specifikacija / DI sistemos planavimo dokumentas",
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
          EVAL_CATEGORIES.flatMap((c) => c.metrics.map((m) => [m.id, evalsScores[m.id] !== undefined ? m.scale[evalsScores[m.id]] : null])).filter(([,v]) => v !== null)
        ),
      },
      architecture: { ...data.architecture },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "di-technine-specifikacija.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header bar */}
      <Card style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid #1e40af" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1.5 }}>
              {data._meta?.organization ? `${data._meta.organization} — ` : ""}Techninė specifikacija
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: "6px 0 0" }}>
              {data._meta?.projectName || "DI Sistema"} — Ataskaitos peržiūra
            </h2>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={downloadJSON} style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid #3b82f6",
              background: "#1e40af30", color: "#93c5fd", cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}>
              📥 Atsisiųsti JSON
            </button>
            <div style={{
              padding: "10px 16px", borderRadius: 8, background: "#334155",
              color: "#94a3b8", fontSize: 12, lineHeight: 1.4, maxWidth: 220,
            }}>
              JSON + <code style={{ color: "#93c5fd" }}>generate-ts-docx.js</code> = Word dokumentas pirkimo TS
            </div>
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
        </div>
      </Card>

      {/* 1. PROBLEMA */}
      <Card>
        <ReportSection num="1" title="Problemos aprašymas ir DI taikymo pagrindimas">
          <RField label="Problema" value={p.description} />
          <RField label="Dabartinis procesas" value={p.currentProcess} />
          {(p.timeSpent || p.errorRate || p.volume) && (
            <RTable headers={["Rodiklis", "Reikšmė"]} rows={[
              ...(p.timeSpent ? [["Laiko sąnaudos", `${p.timeSpent} val./dieną`]] : []),
              ...(p.errorRate ? [["Klaidų dažnis", `${p.errorRate}%`]] : []),
              ...(p.volume ? [["Apimtis", `${p.volume} vnt./dieną`]] : []),
            ]} />
          )}
          <RField label="Rizikos lygis" value={RISK_MAP[p.riskLevel]} />
          <RField label="DI pagrindimas" value={p.whyAI} />
          {p.stakeholders?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Suinteresuotieji (⚖️): </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {p.stakeholders.map((s) => (
                  <span key={s} style={{ padding: "3px 10px", borderRadius: 12, background: "#334155", fontSize: 12, color: "#94a3b8" }}>{STAKEHOLDER_MAP[s] || s}</span>
                ))}
              </div>
            </div>
          )}
          {p.successCriteria && <div style={{ marginTop: 10 }}><RField label="Sėkmės kriterijai" value={p.successCriteria} /></div>}
        </ReportSection>
      </Card>

      {/* 2. KONCEPTAS */}
      <Card>
        <ReportSection num="2" title="Sistemos konceptas">
          <RField label="Vizija" value={c.vision} />
          {(c.inputSystems || c.outputSystems) && (
            <RTable headers={["Kategorija", "Sistemos"]} rows={[
              ...(c.inputSystems ? [["Įvestis", c.inputSystems]] : []),
              ...(c.outputSystems ? [["Išvestis", c.outputSystems]] : []),
              ...(c.dataSources ? [["Duomenų šaltiniai", c.dataSources]] : []),
              ...(c.orchestration ? [["Orkestracija", c.orchestration]] : []),
            ]} />
          )}
          <RField label="DI modelio strategija" value={(c.modelStrategy || []).map((s) => MODEL_MAP[s] || s).join(", ")} />
          <RField label="Žmogiškoji priežiūra" value={OVERSIGHT_MAP[c.oversightLevel]} />
          <RField label="Override mechanizmas" value={c.overrideMechanism} />
          {c.gdprChecks?.length > 0 && <RField label="BDAR checklist" value={c.gdprChecks.length + "/4 reikalavimai atitikti"} />}
          {(c.phase1 || c.phase2 || c.phase3) && (
            <RTable headers={["Fazė", "Aprašymas"]} rows={[
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
                return [m.name, m.scale[val], `${val}/3`, m.critical ? "⚠️ Taip" : ""];
              }))
            } />
          ) : (
            <div style={{ color: "#64748b", fontSize: 13, fontStyle: "italic" }}>Metrikos neįvertintos - grįžkite į 3 žingsnį</div>
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
          {e.testingMethods?.length > 0 && <div style={{ marginTop: 10 }}><RField label="Testavimo metodai" value={e.testingMethods.join(", ")} /></div>}
        </ReportSection>
      </Card>

      {/* 4. ARCHITEKTŪRA */}
      <Card>
        <ReportSection num="4" title="Architektūra ir prototipo reikalavimai">
          {a.selectedComponents?.length > 0 && (
            <RTable headers={["Komponentas", "Technologijos", "Pastabos"]} rows={a.selectedComponents.map((comp) => {
              const det = (a.componentDetails || {})[comp] || {};
              return [COMP_MAP[comp] || comp, (det.technologies || []).join(", "), det.notes || "---"];
            })} />
          )}
          {a.dataFlow && <div style={{ marginTop: 8 }}><RField label="Duomenų srautas" value="" /><pre style={{ background: "#0f172a", padding: 12, borderRadius: 6, fontSize: 12, color: "#94a3b8", whiteSpace: "pre-wrap", margin: "4px 0" }}>{a.dataFlow}</pre></div>}
          <RField label="Infrastruktūra" value={INFRA_MAP[a.infrastructure]} />
          <RField label="Saugumo reikalavimai" value={a.securityReqs} />
        </ReportSection>
      </Card>

      {/* 5. ATITIKTIS */}
      <Card style={{ border: "1px solid #1e40af33" }}>
        <ReportSection num="5" title="ES DI Akto atitikties santrauka">
          <RTable headers={["Reikalavimas", "Aprašymas", "Statusas"]} rows={compliance.map((c) => [
            c.art, c.title, c.met ? "✅ Apibrėžta" : "⚠️ Reikia",
          ])} />
        </ReportSection>
      </Card>

      {/* TS naudojimo instrukcija */}
      <Card style={{ background: "#065f4615", border: "1px solid #065f46" }}>
        <SectionTitle icon="📋" title="Kaip naudoti kaip pirkimo TS?" subtitle="" />
        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 8px" }}><strong style={{ color: "#6ee7b7" }}>1.</strong> Atsisiųskite JSON su mygtuku aukščiau — jis jau suformatuotas DOCX generatoriui</p>
          <p style={{ margin: "0 0 8px" }}><strong style={{ color: "#6ee7b7" }}>2.</strong> Paleiskite: <code style={{ background: "#0f172a", padding: "2px 8px", borderRadius: 4, color: "#93c5fd" }}>node generate-ts-docx.js di-technine-specifikacija.json Mano_TS.docx</code></p>
          <p style={{ margin: "0 0 8px" }}><strong style={{ color: "#6ee7b7" }}>3.</strong> Gausite profesionalų Word dokumentą su 5 skyriais: Problema → Konceptas → Metrikos → Architektūra → DI Akto atitiktis</p>
          <p style={{ margin: "0 0 8px" }}><strong style={{ color: "#6ee7b7" }}>4.</strong> Evals balai (0-3) automatiškai konvertuojami į konkrečius tikslinius rodiklius ir minimalius slenkščius</p>
          <p style={{ margin: 0, color: "#64748b", fontStyle: "italic" }}>Dokumentas atitinka ES DI Akto Art. 11 / Annex IV techninės dokumentacijos struktūrą ir gali būti naudojamas kaip pagrindas viešajam pirkimui.</p>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

const STEPS = [
  { id: "problem", title: "Problema", icon: "⚠️", desc: "Problemos apibrėžimas ir DI pagrindimas", component: StepProblem },
  { id: "concept", title: "Sistemos konceptas", icon: "💬", desc: "Architektūra ir žmogiškoji priežiūra", component: StepConcept },
  { id: "evals", title: "Evals / Metrikos", icon: "📊", desc: "Vertinimo kriterijai ir slenkščiai", component: StepEvals },
  { id: "architecture", title: "Sistemos prototipas", icon: "🔧", desc: "Komponentai ir infrastruktūra", component: StepArchitecture },
  { id: "report", title: "Ataskaita / TS", icon: "📋", desc: "Techninė specifikacija ir eksportas", component: StepReport },
];

export default function DIPlanningWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState({ problem: {}, concept: {}, evals: {}, architecture: {}, _meta: {} });

  const getStepCompleteness = useCallback((stepId) => {
    const d = data[stepId] || {};
    const fields = Object.values(d).filter((v) => {
      if (typeof v === "string") return v.trim().length > 0;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "object" && v !== null) return Object.keys(v).length > 0;
      if (typeof v === "number") return true;
      return false;
    });
    const total = stepId === "problem" ? 8 : stepId === "concept" ? 10 : stepId === "evals" ? 6 : stepId === "architecture" ? 6 : 1;
    if (stepId === "report") return 100;
    if (stepId === "evals") {
      const allMetrics = EVAL_CATEGORIES.flatMap((c) => c.metrics);
      const answered = allMetrics.filter((m) => (d.scores || {})[m.id] !== undefined).length;
      return Math.round((answered / allMetrics.length) * 100);
    }
    return Math.min(100, Math.round((fields.length / total) * 100));
  }, [data]);

  const StepComponent = STEPS[activeStep].component;

  return (
    <div style={{ fontFamily: "'Source Sans 3', 'Segoe UI', system-ui, sans-serif", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderBottom: "1px solid #334155", padding: "20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 2 }}>
          <span style={{ fontSize: 13, background: "#1e40af", color: "#93c5fd", padding: "2px 10px", borderRadius: 4, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase" }}>Framework</span>
          <span style={{ fontSize: 13, background: "#065f46", color: "#6ee7b7", padding: "2px 10px", borderRadius: 4, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase" }}>EU AI Act</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "8px 0 4px", color: "#f1f5f9", letterSpacing: -0.5 }}>
          ⚖️ DI Sistemos Planavimo Vedlys
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          Nuo problemos iki prototipo — struktūrizuotas DI sistemos kūrimo procesas su ES DI Akto atitiktimi ir techninės specifikacijos generavimu
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <input value={data._meta?.projectName || ""} onChange={(ev) => setData((d) => ({ ...d, _meta: { ...d._meta, projectName: ev.target.value } }))}
            placeholder="Projekto pavadinimas (pvz., VILYS)" style={{ background: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", padding: "6px 12px", borderRadius: 6, fontSize: 13, width: 240 }} />
          <input value={data._meta?.organization || ""} onChange={(ev) => setData((d) => ({ ...d, _meta: { ...d._meta, organization: ev.target.value } }))}
            placeholder="Organizacija (pvz., ŽŪDC)" style={{ background: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", padding: "6px 12px", borderRadius: 6, fontSize: 13, width: 200 }} />
          <input value={data._meta?.author || ""} onChange={(ev) => setData((d) => ({ ...d, _meta: { ...d._meta, author: ev.target.value } }))}
            placeholder="Autorius" style={{ background: "#1e293b", border: "1px solid #475569", color: "#e2e8f0", padding: "6px 12px", borderRadius: 6, fontSize: 13, width: 200 }} />
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 110px)" }}>
        {/* Side navigation */}
        <div style={{ width: 240, minWidth: 240, background: "#1e293b", borderRight: "1px solid #334155", padding: "16px 0" }}>
          {STEPS.map((step, i) => {
            const completeness = getStepCompleteness(step.id);
            const isActive = activeStep === i;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(i)}
                style={{
                  width: "100%", display: "flex", flexDirection: "column", gap: 4,
                  padding: "14px 18px",
                  background: isActive ? "#334155" : "transparent",
                  borderLeft: isActive ? "3px solid #3b82f6" : "3px solid transparent",
                  border: "none", borderRight: "none", borderTop: "none", borderBottom: "none",
                  borderLeftWidth: 3, borderLeftStyle: "solid", borderLeftColor: isActive ? "#3b82f6" : "transparent",
                  color: isActive ? "#f1f5f9" : "#94a3b8",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{step.icon}</span>
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
                    {getStepCompleteness(step.id) > 60 ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: activeStep === i ? "#f1f5f9" : "#64748b" }}>{step.title}</span>
                  <span style={{ fontSize: 12, marginLeft: "auto" }}>⚖️</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 1, height: 14, background: "#334155", marginLeft: 11 }} />
                )}
              </div>
            ))}
            <div style={{ fontSize: 11, color: "#475569", marginTop: 8, fontStyle: "italic" }}>
              ⚖️ = teisinis vertinimas kiekviename etape
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "24px 32px", overflowY: "auto", maxHeight: "calc(100vh - 110px)" }}>
          <div style={{ maxWidth: 800 }}>
            <StepComponent data={data} setData={setData} />

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: "1px solid #334155" }}>
              <button
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: "1px solid #334155",
                  background: "#1e293b", color: activeStep === 0 ? "#475569" : "#e2e8f0",
                  cursor: activeStep === 0 ? "default" : "pointer", fontSize: 14, fontWeight: 500,
                }}
              >
                ← {activeStep > 0 ? STEPS[activeStep - 1].title : ""}
              </button>
              <button
                onClick={() => setActiveStep(Math.min(STEPS.length - 1, activeStep + 1))}
                disabled={activeStep === STEPS.length - 1}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: "none",
                  background: activeStep === STEPS.length - 1 ? "#334155" : "#1e40af",
                  color: activeStep === STEPS.length - 1 ? "#475569" : "#fff",
                  cursor: activeStep === STEPS.length - 1 ? "default" : "pointer",
                  fontSize: 14, fontWeight: 600,
                }}
              >
                {activeStep < STEPS.length - 1 ? `${STEPS[activeStep + 1].title} →` : "✅ Dokumentas paruoštas"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
