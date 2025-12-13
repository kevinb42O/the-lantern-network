// Golden microcopy for "De Lantaarn" human moments.
// Keep this file small and intentional: it’s the app’s “heart” strings.

export const lanternCopy = {
  onboarding: {
    title: 'Welkom bij De Lantaarn',
    body: "Hier in de buurt brandt er altijd wel ergens een lichtje. Vraag gerust hulp, of bied er aan als je kan.",
    ctaNext: 'Verdergaan',
    ctaBrowse: 'Ik wil eerst even kijken',
  },
  signup: {
    title: 'Even jezelf voorstellen',
    body: 'Dat helpt om vertrouwen op te bouwen in de buurt. We houden het simpel.',
    helper: 'Je kan dit later altijd aanpassen.',
  },
  notifications: {
    title: 'Mogen we je af en toe iets laten weten?',
    body: 'Alleen wanneer er iets belangrijks is: een antwoord op je lichtje of nieuws uit je kring.',
    allow: 'Ja, dat is goed',
    deny: 'Nu liever niet',
  },
  empty: {
    flaresTitle: 'Nog geen lichtjes in de buurt',
    flaresBody: 'Wees gerust: dat komt vanzelf. Je kan altijd zelf een klein lichtje plaatsen — een vraag of een aanbod.',
    flaresCtaCreate: 'Nieuw lichtje plaatsen',
    flaresCtaHelp: 'Hoe werkt dit?',
    messagesTitle: 'Nog geen gesprekken',
    messagesBody: 'Zodra je reageert op een lichtje, komt je gesprek hier te staan.',
    messagesCta: 'Lichtjes bekijken',
  },
  createFlare: {
    title: 'Een lichtje plaatsen',
    subtitle: 'Hou het kort en duidelijk. Dan kan een buur sneller helpen.',
    placeholderTitle: 'Waar heb je hulp bij nodig?',
    placeholderDescription: 'Vertel rustig wat er aan de hand is.',
    ctaPost: 'Lichtje plaatsen',
    ctaCancel: 'Annuleren',
  },
  success: {
    flarePostedTitle: 'Lichtje geplaatst!',
    flarePostedBody: 'Mooi zo. Je buren kunnen nu reageren. We laten het je weten zodra er iets binnenkomt.',
    flarePostedCtaView: 'Naar mijn lichtje',
    flarePostedCtaAnother: 'Nog eentje plaatsen',
  },
  errors: {
    offlineTitle: 'Het lukt even niet',
    offlineBody: "We krijgen geen verbinding. Da’s vervelend, maar meestal tijdelijk.",
    retry: 'Probeer opnieuw',
    later: 'Later opnieuw',
    sendMessageFailed: 'Bericht versturen mislukt',
    sendMessageFailedHelper: 'Probeer opnieuw. Als het blijft gebeuren, check even je internet.',
  },
  gratitude: {
    title: 'Da’s lief van je, buur',
    body: 'Kleine hulp maakt een groot verschil. Wil je een kort bedankje sturen?',
    ctaSendThanks: 'Bedankje sturen',
    ctaNotNow: 'Nu niet',
  },
} as const;
