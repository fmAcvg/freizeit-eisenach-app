// import der react native komponenten
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextInput, Alert, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useAppTheme } from '@/hooks/use-app-theme';

// kommentar datenstruktur (angepasst an Backend)
interface Comment {
  id: number;
  author: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  text: string;
  created_at: string;
}

// props für die event kommentare komponente
interface EventCommentsProps {
  eventId: number;
  comments: Comment[] | undefined;
  onAddComment: (eventId: number, comment: string) => void;
  onDeleteComment: (commentId: number) => void;
}

// event kommentare komponente mit erweiterungsmöglichkeit und kommentarverwaltung
// ermöglicht es nutzern kommentare zu lesen hinzuzufügen und zu löschen
export function EventComments({ eventId, comments, onAddComment, onDeleteComment }: EventCommentsProps) {
  const theme = useAppTheme();
  
  // state für kommentar erweiterung eingabe und ladezustand
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [newComment, setNewComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const backgroundColor = theme.background.secondary;
  const textColor = theme.text.primary;
  const mutedColor = theme.text.muted;

  // Robustere Null-Prüfung für comments
  const safeComments = React.useMemo(() => {
    if (!comments || !Array.isArray(comments)) {
      return [];
    }
    return comments;
  }, [comments]);

  // Early return wenn kritische Daten fehlen
  if (!eventId || !onAddComment || !onDeleteComment) {
    return null;
  }

  // neuen kommentar hinzufügen
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Kommentar ein.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddComment(eventId, newComment.trim());
      setNewComment('');
    } catch (error) {
      Alert.alert('Fehler', 'Kommentar konnte nicht hinzugefügt werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // kommentar löschen mit bestätigung
  const handleDeleteComment = (commentId: number, authorName: string) => {
    Alert.alert(
      'Kommentar löschen',
      `Kommentar von ${authorName} wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen', 
          style: 'destructive',
          onPress: () => onDeleteComment(commentId)
        }
      ]
    );
  };

  // relative zeit seit kommentar erstellung berechnen
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'gerade eben';
    if (diffInMinutes < 60) return `vor ${diffInMinutes} Min`;
    if (diffInMinutes < 1440) return `vor ${Math.floor(diffInMinutes / 60)} Std`;
    return `vor ${Math.floor(diffInMinutes / 1440)} Tag${Math.floor(diffInMinutes / 1440) > 1 ? 'en' : ''}`;
  };

  // Kommentare für die Anzeige vorbereiten
  const displayedComments = isExpanded ? safeComments : safeComments.slice(0, 2);
  const hiddenCount = safeComments.length - 2;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* kommentar header mit titel und expand button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="chat" size={20} color={theme.primary.main} />
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Kommentare ({safeComments.length})
          </Text>
        </View>
        
        {safeComments.length > 0 && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsExpanded(!isExpanded)}>
            <MaterialIcons 
              name={isExpanded ? "expand-less" : "expand-more"} 
              size={20} 
              color={theme.primary.main} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* kommentare liste */}
      {safeComments.length > 0 ? (
        <View style={styles.commentsList}>
          {displayedComments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <View style={styles.commentHeader}>
                <View style={styles.authorInfo}>
                  <View style={[styles.authorAvatar, { backgroundColor: theme.primary.main + '20' }]}>
                    <MaterialIcons name="person" size={16} color={theme.primary.main} />
                  </View>
                  <View style={styles.authorDetails}>
                    <Text style={[styles.authorName, { color: textColor }]}>
                      {comment.author.first_name} {comment.author.last_name}
                    </Text>
                    <Text style={[styles.commentTime, { color: mutedColor }]}>
                      {getTimeAgo(comment.created_at)}
                    </Text>
                  </View>
                </View>
                
                {/* löschen button (vereinfacht - alle kommentare können gelöscht werden) */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteComment(comment.id, `${comment.author.first_name} ${comment.author.last_name}`)}>
                  <MaterialIcons name="delete" size={16} color={theme.status.error} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.commentText, { color: textColor }]}>
                {comment.text}
              </Text>
            </View>
          ))}

          {/* mehr kommentare anzeigen button */}
          {!isExpanded && hiddenCount > 0 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setIsExpanded(true)}>
              <Text style={[styles.showMoreText, { color: theme.primary.main }]}>
                +{hiddenCount} weitere Kommentare anzeigen
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // leerzustand wenn keine kommentare vorhanden
        <View style={styles.emptyState}>
          <MaterialIcons name="chat-bubble-outline" size={32} color={mutedColor} />
          <Text style={[styles.emptyText, { color: mutedColor }]}>
            Noch keine Kommentare
          </Text>
          <Text style={[styles.emptySubtext, { color: mutedColor }]}>
            Sei der Erste, der einen Kommentar hinterlässt!
          </Text>
        </View>
      )}

      {/* neuer kommentar eingabe */}
      <View style={styles.addCommentSection}>
        <View style={[styles.inputContainer, { borderColor: theme.primary.main + '30' }]}>
          <TextInput
            style={[styles.commentInput, { color: textColor }]}
            placeholder="Kommentar hinzufügen..."
            placeholderTextColor={mutedColor}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <View style={styles.inputFooter}>
            <Text style={[styles.charCount, { color: mutedColor }]}>
              {newComment.length}/500
            </Text>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { 
                  backgroundColor: newComment.trim() ? theme.primary.main : theme.primary.main + '30',
                  opacity: isSubmitting ? 0.6 : 1
                }
              ]}
              onPress={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}>
              <MaterialIcons 
                name="send" 
                size={18} 
                color={newComment.trim() ? "#ffffff" : mutedColor} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// stylesheet für die event kommentare komponente
const styles = StyleSheet.create({
  // haupt container für kommentare
  container: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 16,
  },
  // header mit titel und expand button
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // linker bereich des headers
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // haupttitel für kommentare
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  // expand button für mehr kommentare
  expandButton: {
    padding: 4,
  },
  // liste der kommentare
  commentsList: {
    gap: 12,
  },
  // einzelner kommentar container
  commentItem: {
    gap: 8,
  },
  // kommentar header mit autor info
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // autor informationen
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  // autor avatar container
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // autor details container
  authorDetails: {
    gap: 2,
  },
  // autor name
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  // kommentar zeit
  commentTime: {
    fontSize: 12,
  },
  // delete button für eigene kommentare
  deleteButton: {
    padding: 4,
  },
  // kommentar text
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 36, // ausrichtung mit autorennamen
  },
  // mehr kommentare anzeigen button
  showMoreButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  // text für mehr kommentare button
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // leerzustand wenn keine kommentare
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  // leerzustand haupttext
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // leerzustand untertext
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  // bereich für neuen kommentar
  addCommentSection: {
    gap: 12,
  },
  // input container für kommentar eingabe
  inputContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  // text input für kommentar
  commentInput: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 40,
    maxHeight: 100,
  },
  // footer des inputs mit zeichenanzahl und send button
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // zeichenanzahl anzeige
  charCount: {
    fontSize: 12,
  },
  // send button für kommentar
  submitButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
