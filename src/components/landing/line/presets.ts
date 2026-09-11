/**
 * Industry presets for the homepage's shared Line. Picking one reskins the example work item
 * shown on each manual lane (`jobKinds`), so the same six stations can read as an e-commerce
 * backlog, an agency's, or a trades business's, depending on which a visitor picks. Copy is
 * grounded in the kind of work HSL actually does (see PortfolioPage.tsx): order/inventory/shipping
 * plumbing, proposal and onboarding flows, quote to dispatch to invoice for field service.
 */

export type PresetId = 'ecommerce' | 'agency' | 'trades';

export interface Preset {
  id: PresetId;
  /** Switcher pill label. */
  label: string;
  /** Example work items shown on the manual lanes, one per station, cycling if there are fewer than six. */
  jobKinds: string[];
}

export const PRESET_ORDER: PresetId[] = ['ecommerce', 'agency', 'trades'];

export const PRESETS: Record<PresetId, Preset> = {
  ecommerce: {
    id: 'ecommerce',
    label: 'E-commerce',
    jobKinds: ['New order', 'Return', 'Restock', 'Wholesale order', 'Marketplace order'],
  },
  agency: {
    id: 'agency',
    label: 'Agency',
    jobKinds: ['New lead', 'Referral', 'Proposal request', 'Renewal', 'Scope change'],
  },
  trades: {
    id: 'trades',
    label: 'Trades',
    jobKinds: ['Job request', 'Quote', 'Callback', 'Warranty visit', 'Recurring service'],
  },
};
