import DIPlanningWizard from "./DIPlanningWizard";

export const metadata = {
  title: "DI Planavimo Vedlys | AI Jakavonis",
  description: "Struktūrizuotas DI sistemos specifikacijų rengimo vedlys su ES DI Akto atitiktimi.",
};

export default function WizardPage() {
  return <DIPlanningWizard />;
}
