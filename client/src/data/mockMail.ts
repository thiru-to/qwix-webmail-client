export type MailLabel = 'Finance' | 'Marketing' | 'Orders' | 'Personal' | 'Security' | 'Socials'

export type Mail = {
  id: string
  sender: string
  email: string
  initials: string
  avatarTone: string
  subject: string
  preview: string
  time: string
  date: string
  unread?: boolean
  starred?: boolean
  labels: MailLabel[]
  attachments?: string[]
  body: string[]
  folder: string
  cc?: string[]
  bcc?: string[]
}

type MailboxFolder = {
  name: string
  icon: string
  count: number
}

export type Mailbox = {
  account: {
    name: string
    email: string
    storageUsed: string
    storageLimit: string
    storagePercent: number
  }
  folders: MailboxFolder[]
  secondaryFolders: MailboxFolder[]
  labels: { name: string; color: string; count: number }[]
  messages: Mail[]
}

export const mailbox: Mailbox = {
  account: {
    name: 'Courtney Henry',
    email: 'courtney@qwixmail.com',
    storageUsed: '10.06 MB',
    storageLimit: '200 MB',
    storagePercent: 5,
  },
  folders: [
    { name: 'Inbox', icon: 'inbox', count: 167 },
    { name: 'Important', icon: 'star', count: 68 },
    { name: 'Snoozed', icon: 'clock', count: 29 },
    { name: 'Sent', icon: 'send', count: 428 },
    { name: 'Draft', icon: 'file', count: 24 },
  ],
  secondaryFolders: [
    { name: 'Archived', icon: 'archive', count: 32 },
    { name: 'Spam', icon: 'alert', count: 267 },
    { name: 'Trash', icon: 'trash', count: 20 },
  ],
  labels: [
    { name: 'Personal', color: 'amber', count: 90 },
    { name: 'Clients', color: 'teal', count: 150 },
    { name: 'Socials', color: 'pink', count: 76 },
  ],
  messages: [
    {
      id: 'stripe-payout',
      sender: 'Stripe',
      email: 'payouts@stripe.com',
      initials: 'S',
      avatarTone: 'rose',
      subject: 'Payout of $3,450.00 Sent to Your Bank Account 💰',
      preview: 'Your daily automatic payout of $3,450.00 USD has been initiated and will arrive in your checking account within 1 business day…',
      time: '9:42 AM',
      date: 'Aug 5, 2026',
      folder: 'Inbox',
      unread: true,
      starred: true,
      labels: ['Finance'],
      attachments: ['Payout_Summary_AUG2026.pdf', 'Tax_Receipt.pdf'],
      body: [
        'Hi Courtney Henry,',
        'Your automatic payout of $3,450.00 USD for customer subscription charges on your domain (qwixmail.com) has been initiated and processed successfully.',
        'Transfer summary:\n• Deposit ID: po_1Px928K9×\n• Payout Date: August 5, 2026\n• Account Ending in: •••• 4892',
        'You can view a detailed breakdown of transaction fees in your Stripe Dashboard.',
        'Best regards,\nThe Stripe Payouts Team',
      ],
    },
    {
      id: 'quarterly-ops-brief',
      sender: 'Avery Kim',
      email: 'avery.kim@northline.io',
      initials: 'A',
      avatarTone: 'purple',
      subject: 'Q3 Ops Brief: Migration timeline, risk register, and open decisions',
      preview: 'Below is the full operating brief for the Q3 migration. Please review every section before Thursday’s steering call — especially the rollback criteria and staffing plan…',
      time: '7:58 AM',
      date: 'Aug 5, 2026',
      folder: 'Inbox',
      unread: true,
      labels: ['Personal'],
      attachments: ['Q3_Ops_Brief.pdf', 'risk_register.csv', 'migration_runbook.md'],
      body: [
        'Hi Courtney,',
        'I put together a longer ops brief so everyone has the same context before Thursday’s steering call. Please skim the whole note — the decisions near the end are time-sensitive.',
        '1) Context\nWe are moving customer mailboxes, search indexes, and attachment storage onto the new regional stack. The goal is lower latency for North America and EU tenants, clearer failure domains, and room to grow without another emergency capacity project next quarter.',
        '2) Scope\nIn scope: IMAP/JMAP front doors, mailbox metadata, full-text search, attachment blobs under 25 MB, outbound relay health checks, and the customer-facing status page. Out of scope for this wave: enterprise vault exports, custom routing plugins, and the legacy mobile sync path we plan to retire in Q4.',
        '3) Timeline\n• Aug 8 — freeze non-critical schema changes\n• Aug 11–12 — shadow traffic in us-east and eu-west\n• Aug 13 — migrate pilot cohort (about 4% of mailboxes)\n• Aug 14–15 — expand to 25%, then 60%\n• Aug 18 — complete remaining tenants if error budgets hold\n• Aug 19 — holdback window and retrospective',
        '4) Risk register (high)\nSearch index lag after cutover remains the biggest customer-visible risk. We saw 90–140 seconds of lag in the last rehearsal when attachment backfill competed with query traffic. Mitigation: throttle backfill to 35% CPU, pre-warm hot indexes overnight, and keep the old index readable for 72 hours.\nSecond risk: bounce handling during MX flip. Mitigation: dual-accept for 24 hours and a replay queue for deferred messages.\nThird risk: support load. Mitigation: templated macros, a dedicated war room channel, and a 2-person overflow rotation from success engineering.',
        '5) Staffing plan\nPrimary on-call: Jordan (infra), Priya (mail protocol), Sam (support lead). Shadow on-call: Lee and Morgan. Product representation on the bridge for the first four hours of each expansion wave. Please confirm Courtney can join the 9:00 AM checkpoint on Aug 13.',
        '6) Customer communication\nWe will send a gentle heads-up on Aug 10, a maintenance notice 24 hours before each wave, and a completion note after each region stabilizes. No mention of internal capacity issues — keep the message about performance and reliability improvements.',
        '7) Success criteria\n• p95 open-message latency under 180 ms in both regions\n• search freshness under 60 seconds for 99% of updates\n• bounce rate no worse than baseline +0.2%\n• support ticket volume under 1.5× normal for the migration window\n• zero data-loss incidents; any suspected loss triggers immediate hold',
        '8) Rollback criteria\nAbort or roll back if we hit any of the following for more than 15 consecutive minutes: search freshness above 5 minutes, SMTP deferral rate above 3%, authentication error spike above 1%, or customer-facing 5xx above 0.5%. Rollback is “read from previous stack / write dual until drained,” not a hard cut reverse.',
        '9) Open decisions needed from you\nA. Approve expanding the pilot from 4% to 8% if the first two hours look clean.\nB. Confirm whether EU tenants should move on Aug 14 or wait until Aug 15 after US stabilizes.\nC. Decide if we pause marketing sends during the first expansion wave.\nD. Sign off on the customer wording in the attached brief.',
        '10) Appendix notes\nThe runbook includes dashboards, packet captures to collect, and the exact feature flags to flip. The CSV risk register has owners and due dates. If anything in sections 4, 7, or 8 feels off, reply on this thread before end of day Wednesday so we can revise before the freeze.',
        'Thanks for reading all the way through — I know it is dense. Happy to jump on a 15-minute call today if that is easier than a long reply.',
        'Best,\nAvery',
      ],
    },
    {
      id: 'legal-retention-review',
      sender: 'Harper Cole',
      email: 'harper.cole@brightfield.legal',
      initials: 'H',
      avatarTone: 'green',
      subject: 'Request for review: mailbox retention policy draft (v4) and implementation notes',
      preview: 'Attached and pasted below is the full v4 retention draft. It is intentionally long because counsel asked for examples, edge cases, and a phased rollout narrative your team can execute…',
      time: '7:12 AM',
      date: 'Aug 5, 2026',
      folder: 'Inbox',
      unread: true,
      labels: ['Security'],
      attachments: ['Retention_Policy_v4.docx', 'implementation_checklist.pdf'],
      body: [
        'Dear Courtney,',
        'Thank you again for the working session last week. Below is the complete v4 draft of the mailbox retention policy, written in plain language so product, support, and engineering can all react to the same text. Please read carefully; several sections changed based on your feedback.',
        'Purpose\nThis policy explains how long QwixMail keeps mailbox content, what customers can configure, and how legal holds interact with ordinary deletion. It applies to mail, attachments, and server-side search metadata associated with a mailbox.',
        'Definitions\n“Active mailbox” means a mailbox that has authenticated at least once in the previous 180 days.\n“Inactive mailbox” means a mailbox with no successful authentication in 180 days.\n“Legal hold” means a preservation flag that blocks destructive deletion regardless of retention timers.\n“Customer admin” means an authenticated domain administrator with retention privileges.',
        'Default retention\nUnless a customer admin configures a shorter or longer period within allowed bounds, message content is retained for 365 days after delivery or send. Drafts are retained for 90 days after last edit. Trash and spam folders purge after 30 days. Server-side search indexes may retain derived tokens for up to 14 additional days after source deletion to complete compaction jobs.',
        'Configurable ranges\nCustomer admins may set retention between 30 and 2,555 days for primary mail. Trash/spam may be set between 7 and 90 days. Values outside those ranges are rejected by the API and UI with an explanatory error. Changes apply prospectively unless the admin explicitly requests retroactive enforcement, which requires a second confirmation step.',
        'Legal holds and disputes\nWhen a legal hold is active, purge jobs skip the affected mailboxes and emit an audit event. Holds can be mailbox-scoped or label-scoped. Removing a hold does not immediately delete content; ordinary timers resume from the original dates unless counsel requests a recalculation. Support must not manually purge held content under any circumstances.',
        'Export and deletion requests\nCustomer-initiated exports include messages still within retention and any held content the requester is authorized to receive. Deletion requests mark content for purge at the next job cycle unless a hold blocks them. We will document expected completion windows as “usually within 24 hours, up to 72 hours during backlog.”',
        'Edge cases\n1. Shared mailboxes inherit the domain default unless overridden.\n2. Aliases do not create separate retention clocks; retention follows the destination mailbox.\n3. Messages restored from backup re-enter retention based on original timestamps, not restore time.\n4. Attachments stored once and referenced by multiple messages are retained until every referencing message is eligible for purge.\n5. Calendar invites stored as messages follow mail retention, not calendar event retention.',
        'Implementation phases\nPhase 1 (week of Aug 11): ship read-only policy display in admin settings and API.\nPhase 2 (week of Aug 18): allow configuration within ranges; no retroactive purge yet.\nPhase 3 (week of Aug 25): enable prospective enforcement and audit log stream.\nPhase 4 (week of Sep 8): optional retroactive enforcement with dual confirmation and a preview count of affected messages.',
        'Operational requirements\nEngineering must expose purge-preview counts before destructive retroactive runs. Support needs macros for “why is mail disappearing,” “how to place a hold,” and “how long until delete finishes.” Product should add an in-app banner whenever a domain shortens retention below 90 days.',
        'Open questions for your team\n• Are you comfortable with 30 days as the minimum primary retention, or do you want 60?\n• Should inactive mailboxes auto-archive to cold storage at day 180, or only warn admins?\n• Do we need a separate retention clock for encrypted messages whose keys are customer-managed?',
        'I know this is a long message. The attached checklist mirrors every section above so your engineers can tick off implementation tasks without re-reading the prose. If possible, please send consolidated feedback by Friday so we can lock v5 before the Phase 1 release train.',
        'Kind regards,\nHarper Cole\nBrightfield Legal — Privacy & Product Counsel',
      ],
    },
    {
      id: 'marketing-assets',
      sender: 'Elena Vance (Studio)',
      email: 'elena@northstar.studio',
      initials: 'E',
      avatarTone: 'plum',
      subject: 'New Marketing Materials & Brand Assets 🎨',
      preview: "Hi Courtney! I've attached the new promotional flyers, social media banners, and print-ready PDFs for our Q3 marketing campaign…",
      time: '8:15 AM',
      date: 'Aug 5, 2026',
      folder: 'Inbox',
      unread: true,
      labels: ['Marketing'],
      attachments: ['Q3_campaign_assets.zip', 'social_banners.fig'],
      body: ['Hi Courtney,', 'The new campaign assets are ready for your review. I kept the new color system feeling bold but still close to the existing brand.', 'Let me know what you would like to adjust before we send this to print.'],
    },
    {
      id: 'shopify-summary',
      sender: 'Shopify Store',
      email: 'notifications@shopify.com',
      initials: 'S',
      avatarTone: 'green',
      subject: 'Daily Store Revenue & Order Summary ($1,840.00) 🛍️',
      preview: 'Congratulations! Your online store generated 24 new orders yesterday with total gross sales of $1,840.00. 2 items require shipment…',
      time: 'Yesterday',
      date: 'Aug 4, 2026',
      folder: 'Inbox',
      labels: ['Orders'],
      body: ['Good morning,', 'Your store had a strong day. Twenty-four new orders came in, with two orders waiting for shipment.', 'Open your store dashboard to review the full breakdown.'],
    },
    {
      id: 'coffee-partnership',
      sender: 'Marcus Chen',
      email: 'marcus@roastandco.com',
      initials: 'M',
      avatarTone: 'orange',
      subject: 'Coffee & Strategic Partnership Discussion ☕',
      preview: 'Loved your professional domain email setup! Would love to catch up for 20 minutes this Thursday to discuss networking & growth…',
      time: 'Aug 3',
      date: 'Aug 3, 2026',
      folder: 'Inbox',
      labels: ['Personal'],
      body: ['Hey Courtney,', 'Loved your professional domain email setup. Would love to catch up for 20 minutes this Thursday to discuss networking and growth.', 'Would 2:30 PM work for you?'],
    },
    {
      id: 'ssl-renewal',
      sender: 'Cloudflare Security',
      email: 'security@cloudflare.com',
      initials: 'C',
      avatarTone: 'orange',
      subject: 'Automatic SSL/TLS Edge Certificate Auto-Renewed 🔒',
      preview: 'Your wildcard SSL/TLS edge certificate for *.yourdomain.com has been automatically renewed for 365 days…',
      time: 'Aug 1',
      date: 'Aug 1, 2026',
      folder: 'Inbox',
      labels: ['Security'],
      body: ['Your certificate renewal is complete.', 'The wildcard certificate for *.yourdomain.com is active for another 365 days. No action is required.'],
    },
    {
      id: 'product-hunt',
      sender: 'Product Hunt',
      email: 'hello@producthunt.com',
      initials: 'P',
      avatarTone: 'purple',
      subject: 'The products everyone is talking about this week',
      preview: 'Catch up on the most interesting launches, tools, and ideas from makers around the world…',
      time: 'Jul 31',
      date: 'Jul 31, 2026',
      folder: 'Inbox',
      labels: ['Socials'],
      body: ['Here are this week’s top launches from the Product Hunt community.'],
    },
  ],
}
