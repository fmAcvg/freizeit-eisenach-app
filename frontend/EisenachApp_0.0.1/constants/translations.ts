// zentrales sprach template für die gesamte eisenach app
// alle deutschen texte werden hier verwaltet und organisiert
// diese datei enthält alle übersetzungen für die benutzeroberfläche
// und ermöglicht eine einfache internationalisierung in der zukunft

export const Translations = {
  // tab bar
  tabs: {
    feed: 'Start',
    friends: 'Freunde', 
    upload: 'Einreichen',
    profile: 'Profil',
  },

  // common
  common: {
    loading: 'Laden...',
    error: 'Fehler',
    success: 'Erfolgreich',
    cancel: 'Abbrechen',
    save: 'Speichern',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    close: 'Schließen',
    back: 'Zurück',
    next: 'Weiter',
    done: 'Fertig',
    ok: 'OK',
    yes: 'Ja',
    no: 'Nein',
    search: 'Suchen',
    filter: 'Filter',
    sort: 'Sortieren',
    refresh: 'Aktualisieren',
    share: 'Teilen',
    copy: 'Kopieren',
    retry: 'Wiederholen',
  },

  // feed screen
  feed: {
    title: 'Start',
    subtitle: 'Entdecke coole Events in Eisenach',
    filters: {
      friends: 'Freunde',
      upcoming: 'Bevorstehend', 
      trending: 'Trending',
    },
    stats: {
      eventsWithFriends: 'Events mit Freunden',
      friendsParticipating: 'deiner Freunde sind dabei',
      upcomingEvents: 'kommende Events',
      trendingEvents: 'beliebte Events',
      totalParticipants: 'Teilnehmer insgesamt',
      events: 'Events',
      participants: 'Teilnehmer',
    },
    empty: {
      noEvents: 'Keine Events gefunden',
      noEventsDescription: 'Momentan sind keine Events verfügbar',
      tryAgain: 'Versuche es später noch einmal',
    },
    actions: {
      like: 'Gefällt',
      unlike: 'Gefällt nicht',
      join: 'Teilnehmen',
      leave: 'Abmelden',
      viewDetails: 'Details anzeigen',
    },
  },

  // friends screen
  friends: {
    title: 'Freunde',
    subtitle: 'Verwalte deine Freunde',
    searchPlaceholder: 'Freunde suchen...',
    empty: {
      noFriends: 'Noch keine Freunde',
      noFriendsDescription: 'Füge Freunde hinzu, um deren Events zu sehen',
      noSearchResults: 'Keine Ergebnisse gefunden',
      noSearchResultsDescription: 'Versuche einen anderen Suchbegriff',
    },
    actions: {
      addFriend: 'Freund hinzufügen',
      removeFriend: 'Freund entfernen',
      viewProfile: 'Profil anzeigen',
      sendRequest: 'Anfrage senden',
    },
    status: {
      online: 'Online',
      away: 'Abwesend',
      offline: 'Offline',
    },
    confirmations: {
      addFriend: 'Freund hinzufügen?',
      addFriendMessage: 'Möchtest du {name} als Freund hinzufügen?',
      removeFriend: 'Freund entfernen?',
      removeFriendMessage: 'Möchtest du {name} als Freund entfernen?',
    },
  },

  // upload screen
  upload: {
    title: 'Event einreichen',
    subtitle: 'Reiche ein Event zur Überprüfung ein',
    form: {
      title: 'Event-Titel',
      titlePlaceholder: 'z.B. Community Picknick',
      description: 'Beschreibung',
      descriptionPlaceholder: 'Beschreibe dein Event...',
      date: 'Datum',
      time: 'Uhrzeit',
      location: 'Ort',
      locationPlaceholder: 'z.B. Marktplatz Eisenach',
      contact: 'Kontakt',
      contactPlaceholder: 'E-Mail oder Telefon',
      submit: 'Event einreichen',
      submitting: 'Wird eingereicht...',
    },
    rules: {
      title: 'Wichtige Hinweise',
      items: [
        'Events werden vor der Veröffentlichung überprüft',
        'Du trägst die Verantwortung für die Inhalte deiner Event-Einreichung',
        'Alle Felder sind Pflichtfelder',
        'Kontaktdaten werden vertraulich behandelt',
      ],
    },
    success: {
      title: 'Event eingereicht!',
      message: 'Dein Event wurde erfolgreich zur Überprüfung eingereicht. Du erhältst eine Benachrichtigung, sobald es freigegeben wurde.',
    },
  },

  // profile screen
  profile: {
    title: 'Profil',
    editProfile: 'Profil bearbeiten',
    saveProfile: 'Profil speichern',
    cancelEdit: 'Bearbeitung abbrechen',
    sections: {
      personal: 'Persönliche Informationen',
      privacy: 'Datenschutz',
      events: 'Meine Events',
      settings: 'App-Einstellungen',
    },
    personal: {
      name: 'Name',
      namePlaceholder: 'Dein Name',
      bio: 'Bio',
      bioPlaceholder: 'Erzähle etwas über dich...',
      changePhoto: 'Profilbild ändern',
    },
    privacy: {
      showParticipation: 'Teilnahme öffentlich anzeigen',
      showParticipationDescription: 'Andere können sehen, an welchen Events du teilnimmst',
      publicProfile: 'Öffentliches Profil',
      publicProfileDescription: 'Dein Profil ist für alle sichtbar',
      // Benachrichtigungen entfernt
    },
    events: {
      manageEvents: 'Events verwalten',
      manageEventsDescription: 'Verwalte deine hochgeladenen Events',
    },
    settings: {
      theme: 'Design-Modus',
      themeDescription: 'Automatisch (System)',
      language: 'Sprache',
      languageDescription: 'Deutsch',
      help: 'Hilfe & Support',
      logout: 'Abmelden',
    },
    confirmations: {
      saveProfile: 'Profil speichern?',
      saveProfileMessage: 'Möchtest du die Änderungen speichern?',
      logout: 'Abmelden?',
      logoutMessage: 'Möchtest du dich wirklich abmelden?',
    },
  },

  // event detail screen
  eventDetail: {
    actions: {
      join: 'Teilnehmen',
      joined: 'Angemeldet',
      leave: 'Abmelden',
      like: 'Gefällt',
      share: 'Teilen',
    },
    sections: {
      description: 'Beschreibung',
      participants: 'Teilnehmer',
      comments: 'Kommentare',
      details: 'Details',
    },
    meta: {
      date: 'Datum',
      time: 'Uhrzeit',
      location: 'Ort',
      participants: 'Teilnehmer',
      maxParticipants: 'Max. Teilnehmer',
      age: 'Alter',
      cost: 'Kosten',
      organizer: 'Organisator',
    },
    confirmations: {
      leaveEvent: 'Event abmelden',
      leaveEventMessage: 'Bitte gib einen Grund für die Abmeldung an:',
      leaveEventReason: 'Grund für Abmeldung',
      leaveEventSuccess: 'Abmeldung erfolgreich',
      leaveEventSuccessMessage: 'Du wurdest vom Event abgemeldet.',
    },
  },

  // comments
  comments: {
    title: 'Kommentare',
    addComment: 'Kommentar hinzufügen',
    addCommentPlaceholder: 'Kommentar hinzufügen...',
    empty: {
      noComments: 'Noch keine Kommentare',
      noCommentsDescription: 'Sei der Erste, der einen Kommentar hinterlässt!',
    },
    actions: {
      send: 'Senden',
      delete: 'Löschen',
      showMore: 'weitere Kommentare anzeigen',
      showLess: 'Weniger anzeigen',
    },
    confirmations: {
      deleteComment: 'Kommentar löschen',
      deleteCommentMessage: 'Kommentar von {author} wirklich löschen?',
    },
    time: {
      justNow: 'gerade eben',
      minutesAgo: 'vor {count} Min',
      hoursAgo: 'vor {count} Std',
      daysAgo: 'vor {count} Tag{plural}',
    },
  },

  // event management
  eventManagement: {
    title: 'Event-Verwaltung',
    subtitle: 'Verwalte deine Events',
    stats: {
      published: 'Veröffentlicht',
      pending: 'Wartend',
      drafts: 'Entwürfe',
    },
    actions: {
      createEvent: 'Neues Event erstellen',
      editEvent: 'Event bearbeiten',
      deleteEvent: 'Event löschen',
      viewDashboard: 'Dashboard anzeigen',
    },
    status: {
      published: 'Veröffentlicht',
      pending: 'Wartend auf Freigabe',
      draft: 'Entwurf',
      rejected: 'Abgelehnt',
    },
    confirmations: {
      deleteEvent: 'Event löschen?',
      deleteEventMessage: 'Möchtest du dieses Event wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
    },
  },

  // event dashboard
  eventDashboard: {
    title: 'Event-Dashboard',
    sections: {
      overview: 'Übersicht',
      dailyRegistrations: 'Tägliche Anmeldungen',
      ageDistribution: 'Altersverteilung',
      genderDistribution: 'Geschlechterverteilung',
      recentParticipants: 'Letzte Teilnehmer',
    },
    stats: {
      totalParticipants: 'Gesamtteilnehmer',
      registrationsToday: 'Anmeldungen heute',
      averageAge: 'Durchschnittsalter',
      maleParticipants: 'Männliche Teilnehmer',
      femaleParticipants: 'Weibliche Teilnehmer',
    },
    actions: {
      editEvent: 'Event bearbeiten',
      exportParticipants: 'Teilnehmerliste exportieren (CSV)',
      exportSuccess: 'Export erfolgreich',
    },
  },

  // friend profile
  friendProfile: {
    sections: {
      info: 'Informationen',
      events: 'Events',
      friends: 'Freunde',
      mutualFriends: 'Gemeinsame Freunde',
      recentEvents: 'Letzte Events',
    },
    actions: {
      addFriend: 'Freund hinzufügen',
      removeFriend: 'Freund entfernen',
      sendMessage: 'Nachricht senden',
      viewEvents: 'Events anzeigen',
    },
    stats: {
      eventsCount: 'Events',
      friendsCount: 'Freunde',
      mutualFriendsCount: 'Gemeinsame Freunde',
    },
  },

  // error messages
  errors: {
    network: 'Netzwerkfehler',
    networkMessage: 'Bitte überprüfe deine Internetverbindung',
    server: 'Serverfehler',
    serverMessage: 'Ein Fehler ist aufgetreten. Bitte versuche es später noch einmal.',
    validation: 'Validierungsfehler',
    validationMessage: 'Bitte überprüfe deine Eingaben',
    permission: 'Berechtigung erforderlich',
    permissionMessage: 'Du hast nicht die erforderlichen Berechtigungen',
    notFound: 'Nicht gefunden',
    notFoundMessage: 'Die angeforderte Ressource wurde nicht gefunden',
  },

  // success messages
  success: {
    profileUpdated: 'Profil aktualisiert',
    eventSubmitted: 'Event eingereicht',
    friendAdded: 'Freund hinzugefügt',
    friendRemoved: 'Freund entfernt',
    eventJoined: 'Event beigetreten',
    eventLeft: 'Event verlassen',
    commentAdded: 'Kommentar hinzugefügt',
    commentDeleted: 'Kommentar gelöscht',
  },
};

// hilfsfunktion zum ersetzen von platzhaltern in übersetzungsstrings
export function translate(key: string, replacements: Record<string, string | number> = {}): string {
  const keys = key.split('.');
  let value: any = Translations;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  if (typeof value !== 'string') {
    return key; // schlüssel zurückgeben wenn übersetzung nicht gefunden
  }
  
  // platzhalter ersetzen
  return value.replace(/\{(\w+)\}/g, (match, placeholder) => {
    const replacement = replacements[placeholder];
    if (replacement !== undefined) {
      return String(replacement);
    }
    return match;
  });
}

// hilfsfunktion für pluralisierung
export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

// häufig verwendete übersetzungen exportieren
export const T = Translations;


