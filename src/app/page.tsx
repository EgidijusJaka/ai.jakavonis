import Link from "next/link";

const FEATURES = [
  {
    icon: "1",
    title: "Problemos apibrėžimas",
    desc: "Struktūrizuotai apibrėžkite problemą, dabartinę situaciją, kiekybinius rodiklius ir DI taikymo pagrindimą.",
  },
  {
    icon: "2",
    title: "Sistemos konceptas",
    desc: "Nustatykite DI modelio strategiją, žmogiškosios priežiūros lygį, BDAR atitiktį ir diegimo etapus.",
  },
  {
    icon: "3",
    title: "Vertinimo metrikos",
    desc: "Įvertinkite 19 metrikų 6 kategorijose — nuo tikslumo iki periodinio audito — su ES DI Akto nuorodomis.",
  },
  {
    icon: "4",
    title: "Architektūra",
    desc: "Pasirinkite ir sukonfigūruokite 8 sistemos komponentus, apibrėžkite duomenų srautą ir infrastruktūrą.",
  },
  {
    icon: "5",
    title: "Rizikų registras",
    desc: "Įvertinkite 16 ES DI Akto rizikų — poveikį, tikimybę ir valdymo priemones pagal Art. 9–15, Art. 50, BDAR.",
  },
  {
    icon: "6",
    title: "Techninė specifikacija",
    desc: "Peržiūrėkite ataskaitą, eksportuokite JSON ir sugeneruokite profesionalų DOCX dokumentą pirkimui.",
  },
];

const COMPLIANCE_ITEMS = [
  { art: "Art. 9", title: "Rizikos valdymas" },
  { art: "Art. 10", title: "Duomenų valdymas" },
  { art: "Art. 11", title: "Techninė dokumentacija" },
  { art: "Art. 12", title: "Įvykių registravimas" },
  { art: "Art. 13", title: "Sistemos suprantamumas" },
  { art: "Art. 14", title: "Žmogiškoji priežiūra" },
  { art: "Art. 15", title: "Tikslumas ir saugumas" },
  { art: "Art. 50", title: "DI turinio žymėjimas" },
  { art: "BDAR", title: "DPIA" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-16 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="text-xs font-semibold tracking-widest uppercase bg-primary/20 text-primary-light px-3 py-1 rounded-full">
              Framework
            </span>
            <span className="text-xs font-semibold tracking-widest uppercase bg-accent/20 text-accent-light px-3 py-1 rounded-full">
              EU AI Act
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            DI sistemos specifikacija{" "}
            <span className="text-primary-light">per 30 minučių</span>
          </h1>

          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Struktūrizuotas vedlys viešojo sektoriaus organizacijoms, kurios
            planuoja įsigyti dirbtinio intelekto sistemas. Nuo problemos
            apibrėžimo iki techninės specifikacijos su ES DI Akto atitiktimi.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/wizard"
              className="inline-flex items-center justify-center bg-primary hover:bg-primary-light text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors gap-2"
            >
              Pradėti specifikaciją
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center border border-surface-light hover:border-muted text-foreground px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
            >
              Kaip tai veikia?
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-primary-light">6</div>
              <div className="text-sm text-muted mt-1">Žingsniai</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent-light">11</div>
              <div className="text-sm text-muted mt-1">DI Akto straipsniai</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">19</div>
              <div className="text-sm text-muted mt-1">Vertinimo metrikos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent-light">16</div>
              <div className="text-sm text-muted mt-1">Rizikų vertinimai</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI First */}
      <section className="py-16 px-6 border-t border-surface-light/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-accent-light text-sm font-semibold tracking-widest uppercase text-center mb-3">
            AI First požiūris
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Dirbtinis intelektas — ne magija, o{" "}
            <span className="text-primary-light">inžinerinis sprendimas</span>
          </h2>
          <p className="text-muted text-center max-w-2xl mx-auto mb-12 leading-relaxed">
            AI First reiškia, kad DI nėra priedas prie esamos sistemos — tai
            pagrindinis architektūrinis sprendimas, kuriam reikia aiškios
            problemos, išmatuojamų metrikų ir žmogiškosios priežiūros.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-surface/60 border border-surface-light rounded-xl p-5">
              <div className="text-primary-light text-lg font-semibold mb-2">
                Problema, ne technologija
              </div>
              <p className="text-muted text-sm leading-relaxed">
                Pradėkite nuo verslo problemos, ne nuo DI modelio. Jei problemą
                galima išspręsti paprastesniu būdu — DI nereikia.
              </p>
            </div>
            <div className="bg-surface/60 border border-surface-light rounded-xl p-5">
              <div className="text-primary-light text-lg font-semibold mb-2">
                Matavimas, ne tikėjimas
              </div>
              <p className="text-muted text-sm leading-relaxed">
                Kiekviena DI sistema turi turėti aiškias vertinimo metrikas.
                Tikslumas, šališkumas, greitis — jei negalite išmatuoti,
                negalite valdyti.
              </p>
            </div>
            <div className="bg-surface/60 border border-surface-light rounded-xl p-5">
              <div className="text-primary-light text-lg font-semibold mb-2">
                Žmogus kontroliuoja
              </div>
              <p className="text-muted text-sm leading-relaxed">
                Žmogiškoji priežiūra — ne kliūtis, o kokybės garantija.
                Aukštos rizikos sprendimuose žmogus visada turi galutinį žodį.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-surface/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            6 žingsniai iki techninės specifikacijos
          </h2>
          <p className="text-muted text-center mb-14 max-w-2xl mx-auto">
            Vedlys struktūrizuotai veda per visą DI sistemos planavimo procesą —
            nuo problemos identifikavimo iki eksportuojamo dokumento.
          </p>

          <div className="space-y-4">
            {FEATURES.map((f) => (
              <div
                key={f.icon}
                className="flex gap-6 items-start bg-surface border border-surface-light rounded-xl p-6 hover:border-primary/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary-light font-bold text-lg shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section id="compliance" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            ES DI Akto atitiktis integruota
          </h2>
          <p className="text-muted text-center mb-14 max-w-2xl mx-auto">
            Kiekvienas vedlio žingsnis susietas su konkrečiais ES DI Akto
            (AI Act) straipsniais. Galutinė ataskaita apima atitikties
            santrauką.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {COMPLIANCE_ITEMS.map((item) => (
              <div
                key={item.art}
                className="bg-surface border border-surface-light rounded-lg p-4 hover:border-accent/40 transition-colors"
              >
                <div className="text-accent-light font-semibold text-sm">
                  {item.art}
                </div>
                <div className="text-foreground text-sm mt-1">
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 bg-surface/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Kaip tai veikia?
          </h2>
          <p className="text-muted text-center mb-14 max-w-2xl mx-auto">
            Trys paprasti veiksmai nuo idėjos iki profesionalaus pirkimo
            dokumento.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Užpildykite vedlį",
                desc: "Atsakykite į struktūrizuotus klausimus apie jūsų problemą, DI sistemos koncepciją ir reikalavimus. Tai užtrunka ~30 min.",
              },
              {
                step: "02",
                title: "Peržiūrėkite ataskaitą",
                desc: "Vedlys automatiškai sugeneruoja techninės specifikacijos peržiūrą su ES DI Akto atitikties balu ir metrikų santrauka.",
              },
              {
                step: "03",
                title: "Eksportuokite dokumentą",
                desc: "Atsisiųskite JSON failą ir sugeneruokite profesionalų DOCX dokumentą, paruoštą viešajam pirkimui.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-5xl font-bold text-primary/30 mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              href="/wizard"
              className="inline-flex items-center justify-center bg-primary hover:bg-primary-light text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors gap-2"
            >
              Pradėti dabar
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* DI atsakingai */}
      <section className="py-16 px-6 border-t border-surface-light/50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-accent-light text-sm font-semibold tracking-widest uppercase mb-3">
            DI atsakingai
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Technologija tarnauja žmonėms
          </h2>
          <p className="text-muted leading-relaxed mb-8 max-w-2xl mx-auto">
            ES DI Aktas nustato aiškias taisykles aukštos rizikos DI
            sistemoms. Šis vedlys padeda ne tik parengti techninę
            specifikaciją, bet ir užtikrinti, kad jūsų DI projektas atitiktų
            skaidrumo, saugumo ir žmogaus priežiūros reikalavimus nuo pat
            pradžios.
          </p>
          <div className="flex flex-wrap gap-3 justify-center text-sm">
            <span className="bg-surface border border-surface-light rounded-full px-4 py-2 text-muted">
              Rizikų vertinimas pagal Art. 9
            </span>
            <span className="bg-surface border border-surface-light rounded-full px-4 py-2 text-muted">
              Duomenų valdymas pagal Art. 10
            </span>
            <span className="bg-surface border border-surface-light rounded-full px-4 py-2 text-muted">
              Žmogiškoji priežiūra pagal Art. 14
            </span>
            <span className="bg-surface border border-surface-light rounded-full px-4 py-2 text-muted">
              BDAR / DPIA atitiktis
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}
