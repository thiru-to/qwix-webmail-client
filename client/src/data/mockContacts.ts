export type Contact = {
  id: string
  name: string
  email: string
  role: string
  company: string
  initials: string
  avatarTone: 'rose' | 'green' | 'purple' | 'orange' | 'plum'
  phone: string
  notes: string
}

export type ContactsData = {
  contacts: Contact[]
}

export const contactsData: ContactsData = {
  contacts: [
    {
      id: 'avery',
      name: 'Avery Kim',
      email: 'avery.kim@northline.io',
      role: 'Head of Operations',
      company: 'Northline',
      initials: 'AK',
      avatarTone: 'purple',
      phone: '+1 (415) 555-0142',
      notes: 'Primary contact for Q3 migration steering and rollback criteria.',
    },
    {
      id: 'priya',
      name: 'Priya Shah',
      email: 'priya@qwixmail.com',
      role: 'Product Design',
      company: 'Qwix',
      initials: 'PS',
      avatarTone: 'rose',
      phone: '+1 (628) 555-0198',
      notes: 'Owns inbox density experiments and reader typography.',
    },
    {
      id: 'sam',
      name: 'Sam Ortiz',
      email: 'sam.ortiz@acme.co',
      role: 'Customer Success',
      company: 'Acme',
      initials: 'SO',
      avatarTone: 'orange',
      phone: '+1 (312) 555-0177',
      notes: 'Renewal owner. Prefers Friday afternoon calls.',
    },
    {
      id: 'jordan',
      name: 'Jordan Lee',
      email: 'jordan.lee@northline.io',
      role: 'Staff Engineer',
      company: 'Northline',
      initials: 'JL',
      avatarTone: 'green',
      phone: '+1 (646) 555-0110',
      notes: 'API contract lead for mailbox sync endpoints.',
    },
    {
      id: 'mina',
      name: 'Mina Park',
      email: 'mina.park@brightfold.com',
      role: 'Founder',
      company: 'Brightfold',
      initials: 'MP',
      avatarTone: 'plum',
      phone: '+1 (206) 555-0133',
      notes: 'Interested in shared labels and guest inbox access.',
    },
  ],
}
