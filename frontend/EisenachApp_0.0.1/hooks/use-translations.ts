// hook für einfache verwendung der übersetzungen
export function useTranslations() {
  // temporäre fallback übersetzungen bis die hauptdatei geladen ist
  const fallbackTranslations = {
    tabs: {
      feed: 'Start',
      friends: 'Freunde', 
      upload: 'Einreichen',
      profile: 'Profil',
    },
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
    },
  };

  try {
    const { Translations } = require('@/constants/translations');
    return {
      ...fallbackTranslations,
      ...Translations,
    };
  } catch (error) {
    console.warn('übersetzungen konnten nicht geladen werden verwende fallback:', error);
    return fallbackTranslations;
  }
}
