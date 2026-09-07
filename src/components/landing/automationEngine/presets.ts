/**
 * Industry presets for the Automation Engine. Each one reskins the pipeline's four stages,
 * the job tokens that flow through it, and the savings estimator's model. Copy is grounded
 * in the kind of work HSL actually does (see PortfolioPage.tsx) — order/inventory/shipping
 * plumbing, proposal + onboarding flows, quote → dispatch → invoice for field service.
 */

export type PresetId = 'ecommerce' | 'agency' | 'trades';

export interface PresetStage {
  /** Full stage name — used as the explainer card's title. */
  label: string;
  /** One or two words — the caption under the pipeline node. */
  shortLabel: string;
  /** Plain-English "here's what we'd build for you", 1–2 sentences. */
  explainer: string;
}

export interface Preset {
  id: PresetId;
  /** Switcher pill label. */
  label: string;
  /** Unit for the estimator question ("about how many ___ a week?"). */
  unitNoun: string;
  /** Token labels for the job simulation (Phase 2). */
  jobKinds: string[];
  /** Rough hand-time per item today — drives the illustrative estimator (Phase 3). */
  manualMinutesPerJob: number;
  stages: [PresetStage, PresetStage, PresetStage, PresetStage];
}

export const PRESET_ORDER: PresetId[] = ['ecommerce', 'agency', 'trades'];

export const PRESETS: Record<PresetId, Preset> = {
  ecommerce: {
    id: 'ecommerce',
    label: 'E-commerce',
    unitNoun: 'orders',
    jobKinds: ['New order', 'Return', 'Restock', 'Wholesale order', 'Marketplace order'],
    manualMinutesPerJob: 9,
    stages: [
      {
        label: 'New order',
        shortLabel: 'Order',
        explainer:
          'Order details get entered once and end up everywhere they need to, in the same format every time — instead of being re-typed between screens.',
      },
      {
        label: 'Check stock',
        shortLabel: 'Stock',
        explainer:
          'Stock is adjusted the moment an order comes through, so nothing gets oversold and no one has to remember to check.',
      },
      {
        label: 'Create invoice',
        shortLabel: 'Invoice',
        explainer:
          'The same invoice gets built from the same details every time — work a small piece of software can do instead of a person.',
      },
      {
        label: 'Notify customer',
        shortLabel: 'Notify',
        explainer:
          'The update a customer expects goes out on its own, with the right details, rather than when someone gets to it.',
      },
    ],
  },
  agency: {
    id: 'agency',
    label: 'Agency',
    unitNoun: 'leads',
    jobKinds: ['New lead', 'Referral', 'Proposal request', 'Renewal', 'Scope change'],
    manualMinutesPerJob: 12,
    stages: [
      {
        label: 'New lead',
        shortLabel: 'Lead',
        explainer:
          'New enquiries get captured and routed the same way every time, so none slip through and no one is copying them into a list by hand.',
      },
      {
        label: 'Send proposal',
        shortLabel: 'Proposal',
        explainer:
          'The parts of a proposal that are the same every time get filled in for you, so your team only writes the parts that actually vary.',
      },
      {
        label: 'Start onboarding',
        shortLabel: 'Onboard',
        explainer:
          'The checklist that runs after every signed client — access, folders, first tasks — happens on its own instead of from memory.',
      },
      {
        label: 'Log activity',
        shortLabel: 'Log',
        explainer:
          'Notes and status updates that someone has to remember to record get logged automatically as work happens.',
      },
    ],
  },
  trades: {
    id: 'trades',
    label: 'Trades',
    unitNoun: 'jobs',
    jobKinds: ['Job request', 'Quote', 'Callback', 'Warranty visit', 'Recurring service'],
    manualMinutesPerJob: 14,
    stages: [
      {
        label: 'Job request',
        shortLabel: 'Request',
        explainer:
          'Calls, texts, and form fills become jobs on the schedule in one consistent place — nothing left on a notepad.',
      },
      {
        label: 'Send quote',
        shortLabel: 'Quote',
        explainer:
          'Quotes get put together from your standard pricing and the job details, so they go out faster and look the same every time.',
      },
      {
        label: 'Schedule crew',
        shortLabel: 'Schedule',
        explainer:
          'Assigning the right person and letting the customer know the window happens without a back-and-forth every time.',
      },
      {
        label: 'Invoice + follow-up',
        shortLabel: 'Invoice',
        explainer:
          'The invoice goes out when the job is done, and the follow-up for payment happens on its own.',
      },
    ],
  },
};
