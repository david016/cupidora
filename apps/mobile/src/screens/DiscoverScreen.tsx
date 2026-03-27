import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 300;

interface DiscoverProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  birthDate: string;
  gender: string;
  religion: string;
  location: { type: string; coordinates: [number, number] } | null;
  photoUrls: string[];
  createdAt: string;
}

interface MatchResult {
  matched: boolean;
  matchId: string | null;
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatReligion(religion: string): string {
  if (religion === 'none') return '';
  return religion.charAt(0).toUpperCase() + religion.slice(1);
}

export default function DiscoverScreen() {
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchModal, setMatchModal] = useState<DiscoverProfile | null>(null);

  const position = useRef(new Animated.ValueXY()).current;
  const swiping = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeCard('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeCard('left');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await apiClient.get('/profiles/discover', {
        params: { limit: 20, offset: 0 },
      });
      setProfiles(res.data ?? []);
      setCurrentIndex(0);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  function swipeCard(direction: 'left' | 'right') {
    if (swiping.current) return;
    swiping.current = true;

    const toX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    Animated.timing(position, {
      toValue: { x: toX, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      if (direction === 'right') {
        handleLike(profiles[currentIndex]);
      }
      setCurrentIndex((prev) => prev + 1);
      position.setValue({ x: 0, y: 0 });
      swiping.current = false;
    });
  }

  async function handleLike(profile: DiscoverProfile) {
    try {
      const { data: res } = await apiClient.post<{ data: MatchResult }>(
        `/likes/${profile.userId}`,
      );
      if (res.data.matched) {
        setMatchModal(profile);
      }
    } catch {
      // silently skip
    }
  }

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [1, 0.95, 1],
    extrapolate: 'clamp',
  });

  function renderCard(profile: DiscoverProfile, isTop: boolean) {
    const age = calculateAge(profile.birthDate);
    const religion = formatReligion(profile.religion);
    const photoUri = profile.photoUrls.length > 0 ? profile.photoUrls[0] : null;

    const cardStyle = isTop
      ? [
          styles.card,
          styles.topCard,
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate },
            ],
          },
        ]
      : [styles.card, { transform: [{ scale: nextCardScale }] }];

    return (
      <Animated.View
        key={profile.id}
        style={cardStyle}
        {...(isTop ? panResponder.panHandlers : {})}
      >
        {isTop && (
          <>
            <Animated.View style={[styles.overlayLabel, styles.likeLabel, { opacity: likeOpacity }]}>
              <Text style={styles.likeLabelText}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.overlayLabel, styles.nopeLabel, { opacity: nopeOpacity }]}>
              <Text style={styles.nopeLabelText}>NOPE</Text>
            </Animated.View>
          </>
        )}

        <View style={styles.photoContainer}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.placeholderPhoto}>
              <Ionicons name="person" size={80} color="#ddd" />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.nameAge} numberOfLines={1}>
            {profile.displayName}, {age}
          </Text>
          {religion ? (
            <Text style={styles.denomination} numberOfLines={1}>
              {religion}
            </Text>
          ) : null}
          {profile.bio ? (
            <Text style={styles.bio} numberOfLines={3}>
              {profile.bio}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );
  }

  const noProfiles = currentIndex >= profiles.length;

  if (noProfiles || profiles.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="compass-outline" size={72} color="#ddd" />
        <Text style={styles.emptyTitle}>No more profiles nearby</Text>
        <Text style={styles.emptySubtitle}>Check back later for new people</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchProfiles}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cardArea}>
        {currentIndex + 1 < profiles.length && renderCard(profiles[currentIndex + 1], false)}
        {renderCard(profiles[currentIndex], true)}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.skipButton]}
          onPress={() => swipeCard('left')}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={32} color="#e74c3c" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => swipeCard('right')}
          activeOpacity={0.8}
        >
          <Ionicons name="heart" size={30} color="#e91e63" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={matchModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMatchModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchSubtitle}>
              You and {matchModal?.displayName} liked each other
            </Text>

            <View style={styles.matchAvatarContainer}>
              {matchModal?.photoUrls && matchModal.photoUrls.length > 0 ? (
                <Image
                  source={{ uri: matchModal.photoUrls[0] }}
                  style={styles.matchAvatar}
                />
              ) : (
                <View style={[styles.matchAvatar, styles.matchAvatarPlaceholder]}>
                  <Ionicons name="person" size={48} color="#ddd" />
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => {
                setMatchModal(null);
                // TODO: navigate to conversation with this user
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.messageButtonText}>Send a Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMatchModal(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.keepSwipingText}>Keep Swiping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 32,
  },

  // Card area
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: '88%',
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  topCard: {
    zIndex: 1,
  },

  // Overlay labels
  overlayLabel: {
    position: 'absolute',
    top: 40,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 3,
    borderRadius: 8,
  },
  likeLabel: {
    left: 24,
    borderColor: '#2ecc71',
  },
  nopeLabel: {
    right: 24,
    borderColor: '#e74c3c',
  },
  likeLabelText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2ecc71',
  },
  nopeLabelText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e74c3c',
  },

  // Card content
  photoContainer: {
    height: '60%',
    backgroundColor: '#f5f0f1',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f0f1',
  },
  infoContainer: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  nameAge: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  denomination: {
    fontSize: 15,
    color: '#e8566d',
    fontWeight: '500',
    marginBottom: 6,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Action buttons
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    paddingTop: 8,
    paddingBottom: 16,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  skipButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e74c3c',
  },
  likeButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e91e63',
  },

  // Empty state
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 24,
    backgroundColor: '#e8566d',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Match modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.85,
  },
  matchTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e91e63',
    marginBottom: 8,
  },
  matchSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  matchAvatarContainer: {
    marginBottom: 24,
  },
  matchAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  matchAvatarPlaceholder: {
    backgroundColor: '#f5f0f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  keepSwipingText: {
    color: '#999',
    fontSize: 15,
    fontWeight: '500',
  },
});
