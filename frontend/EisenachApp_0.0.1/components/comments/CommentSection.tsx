import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/ui/Avatar';

// Kommentar-Typ Definition
export interface Comment {
  id: number;
  event: number;
  author: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  author_avatar?: string;
  text: string;
  created_at: string;
  is_author: boolean;
  can_delete: boolean;
}

interface CommentSectionProps {
  eventId: number;
  comments: Comment[];
  onAddComment: (text: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
  onReportComment: (commentId: number) => void;
  loading?: boolean;
}

// Kommentar-Bereich Komponente für Event-Details
// Zeigt alle Kommentare an und ermöglicht das Hinzufügen neuer Kommentare
export default function CommentSection({
  eventId,
  comments = [],
  onAddComment,
  onDeleteComment,
  onReportComment,
  loading = false,
}: CommentSectionProps) {
  const theme = useAppTheme();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Stelle sicher, dass comments immer ein Array ist
  const safeComments = Array.isArray(comments) ? comments : [];

  // Debug-Logs
  React.useEffect(() => {
    console.log('💬 CommentSection Props:', {
      eventId,
      commentsReceived: comments,
      commentsLength: comments?.length,
      safeCommentsLength: safeComments.length,
      loading,
      isArray: Array.isArray(comments)
    });
  }, [comments, loading]);

  // Kommentar absenden
  const handleSubmit = async () => {
    if (!commentText.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Kommentar ein');
      return;
    }

    if (!user) {
      Alert.alert('Nicht angemeldet', 'Du musst angemeldet sein um zu kommentieren');
      return;
    }

    try {
      setSubmitting(true);
      await onAddComment(commentText.trim());
      setCommentText(''); // Eingabefeld leeren nach erfolgreichem Senden
    } catch (error) {
      console.error('Fehler beim Senden des Kommentars:', error);
      Alert.alert('Fehler', 'Kommentar konnte nicht gesendet werden');
    } finally {
      setSubmitting(false);
    }
  };

  // Kommentar löschen mit Bestätigung
  const handleDelete = (commentId: number, authorName: string) => {
    Alert.alert(
      'Kommentar löschen',
      `Möchtest du diesen Kommentar wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteComment(commentId);
            } catch (error) {
              console.error('Fehler beim Löschen des Kommentars:', error);
              Alert.alert('Fehler', 'Kommentar konnte nicht gelöscht werden');
            }
          },
        },
      ]
    );
  };

  // Kommentar melden
  const handleReport = (commentId: number) => {
    Alert.alert(
      'Kommentar melden',
      'Möchtest du diesen Kommentar als unangemessen melden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Melden',
          style: 'destructive',
          onPress: () => onReportComment(commentId),
        },
      ]
    );
  };

  // Zeitformat für Kommentare (z.B. "vor 5 Minuten")
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="comment" size={20} color={theme.primary.main} />
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
          Kommentare {safeComments.length > 0 && `(${safeComments.length})`}
        </Text>
      </View>

      {/* Kommentar-Liste */}
      <View style={styles.commentsList}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.primary.main} />
            <Text style={[styles.loadingText, { color: theme.text.muted }]}>
              Lade Kommentare...
            </Text>
          </View>
        ) : safeComments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="comment" size={48} color={theme.text.muted} style={styles.emptyIcon} />
            <Text style={[styles.emptyText, { color: theme.text.muted }]}>
              Noch keine Kommentare
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text.muted }]}>
              Sei der Erste, der kommentiert!
            </Text>
          </View>
        ) : (
          safeComments.map((comment) => (
            <View
              key={comment.id}
              style={[styles.comment, { borderBottomColor: theme.background.primary + '30' }]}
            >
              <View style={styles.commentHeader}>
                <View style={styles.commentAuthor}>
                  <Avatar
                    imageUrl={comment.author_avatar}
                    name={`${comment.author.first_name} ${comment.author.last_name}`}
                    size={32}
                  />
                  <View style={styles.commentAuthorInfo}>
                    <Text style={[styles.commentAuthorName, { color: theme.text.primary }]}>
                      {comment.author.first_name} {comment.author.last_name}
                    </Text>
                    <Text style={[styles.commentTime, { color: theme.text.muted }]}>
                      {formatTime(comment.created_at)}
                    </Text>
                  </View>
                </View>
                
                {/* Aktionsmenü (Löschen/Melden) */}
                {user && (
                  <View style={styles.commentActions}>
                    {comment.can_delete && (
                      <TouchableOpacity
                        onPress={() => handleDelete(comment.id, `${comment.author.first_name} ${comment.author.last_name}`)}
                        style={styles.actionButton}
                      >
                        <MaterialIcons name="delete" size={18} color={theme.status.error} />
                      </TouchableOpacity>
                    )}
                    {!comment.is_author && (
                      <TouchableOpacity
                        onPress={() => handleReport(comment.id)}
                        style={styles.actionButton}
                      >
                        <MaterialIcons name="flag" size={18} color={theme.text.muted} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
              
              <Text style={[styles.commentText, { color: theme.text.primary }]}>
                {comment.text}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Kommentar-Eingabefeld */}
      {user ? (
        <View style={[styles.inputContainer, { borderTopColor: theme.background.primary + '30' }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.background.primary,
                color: theme.text.primary,
                borderColor: theme.background.primary + '50',
              },
            ]}
            placeholder="Schreibe einen Kommentar..."
            placeholderTextColor={theme.text.muted}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            editable={!submitting}
          />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || !commentText.trim()}
            style={[
              styles.sendButton,
              {
                backgroundColor: theme.primary.main,
                opacity: submitting || !commentText.trim() ? 0.5 : 1,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <MaterialIcons name="send" size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.loginPrompt, { backgroundColor: theme.background.primary + '50' }]}>
          <MaterialIcons name="info" size={20} color={theme.text.muted} />
          <Text style={[styles.loginPromptText, { color: theme.text.muted }]}>
            Melde dich an um zu kommentieren
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  commentsList: {
    gap: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
  },
  comment: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  commentAuthorInfo: {
    gap: 2,
    flex: 1,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 12,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 44, // Einrückung für Alignment mit Text neben Avatar
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  loginPromptText: {
    fontSize: 14,
  },
});

