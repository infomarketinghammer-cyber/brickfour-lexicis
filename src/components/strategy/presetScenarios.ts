import { CreditCard, LucideIcon } from 'lucide-react';

export interface PresetScenario {
  label: string;
  icon: LucideIcon;
  type: string;
  role: string;
  details: string;
  actions: string;
  goals: string;
}

/** Example incidents that pre-fill the strategy form. */
export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    label: '💰 Cheque Bounce / Sec 138 Notice',
    icon: CreditCard,
    type: 'Financial / Cheque Bounce / Debt Dispute',
    role: 'At Fault / Caused Incident',
    details: 'My business vendor presented a cheque of ₹2.5 Lakhs which bounced due to insufficient funds in my account. Yesterday I received a formal 15-day Statutory Legal Notice under Section 138 of Negotiable Instruments Act. I want to clear the debt in 3 monthly installments, but the vendor is threatening to file a criminal court complaint immediately.',
    actions: 'Received statutory notice yesterday via registered post.',
    goals: 'Reply formally to notice, restructure payment into 3 installments, compound debt without criminal court trial.'
  }
];
