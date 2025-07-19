import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { searchUsersByPseudoOrEmail, supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const DUMMY_FRIENDS = [
  {
    id: '22e4e515-fc62-4e24-9ffe-153bebc7e7e7',
    name: 'Andreas974',
    status: 'accepted',
    from: 'me', // à remplacer dynamiquement
    to: 'other',
  },
  {
    id: 'a4897d45-b7a0-4dbf-a094-db2b7e7e7e7e',
    name: 'Andreas',
    status: 'pending',
    from: 'other', // simulons que c'est une demande reçue
    to: 'me',
  },
  {
    id: 'dfa8aaf3-89d9-4134-8caf-a374f1e7e7e7',
    name: 'Raphaël',
    status: 'pending',
    from: 'me', // simulons que c'est une demande envoyée
    to: 'other',
  },
];

const DUMMY_GROUPS = [
  {
    id: 'g1',
    name: 'Les Lève-tôt',
    type: 'Groupe personnel',
  },
  {
    id: 'g2',
    name: 'Projet Marathon',
    type: 'Projet commun',
  },
];

// Ajoute une liste d'amis dummy pour la sélection dans la création de groupe
const DUMMY_ALL_FRIENDS = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Clara' },
  { id: '4', name: 'David' },
];

export default function CommunityPage() {
  // Typage explicite des états
  const [friends, setFriends] = useState<any[]>([]); // sera rempli par Supabase
  const [myGroups, setMyGroups] = useState(DUMMY_GROUPS);
  const [addFriendValue, setAddFriendValue] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [createType, setCreateType] = useState<'personnel' | 'projet' | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newProjectGoal, setNewProjectGoal] = useState('');
  const [roles, setRoles] = useState([{ name: '', user: '' }]);
  const [selectedTab, setSelectedTab] = useState(2); // 2 = Communauté
  const router = useRouter();
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]); // pour chips
  const [popAnim, setPopAnim] = useState<Record<string, Animated.Value>>({}); // pour micro-interaction pop
  const modalAnim = useRef(new Animated.Value(0)).current;
  // Ajoute un état pour la modale d'ami
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string } | null>(null);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const modalPopAnim = useRef(new Animated.Value(0.95)).current;
  const [toast, setToast] = useState<string | null>(null);
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  // 1. Ajouter un état d'opacité pour chaque toast de carte
  const [toastOpacityByCard, setToastOpacityByCard] = useState<{ [id: string]: Animated.Value }>({});
  // 1. Ajouter un objet de refs pour stocker les timeouts par carte
  const toastTimeoutsRef = useRef<{ [id: string]: number }>({});
  // 1. Ajouter un état global pour le cooldown général
  // const [globalCooldown, setGlobalCooldown] = useState(false); // Supprimé

  const [userProfiles, setUserProfiles] = useState<Record<string, string>>({}); // id utilisateur -> prenom

  // Pour garder le nom affiché lors du passage de pending à accepted
  const [pendingNames, setPendingNames] = useState<Record<string, string>>({});

  // Fonction pour charger les profils des utilisateurs concernés
  async function fetchUserProfiles(friendRequests: any[]) {
    // Récupère tous les ids uniques (from_user et to_user)
    const ids = Array.from(new Set(friendRequests.flatMap(f => [f.from_user, f.to_user])));
    if (ids.length === 0) return;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, prenom')
      .in('id', ids);
    if (error) {
      console.error('Erreur chargement profils:', error);
      return;
    }
    // Crée un mapping id -> prenom
    const mapping: Record<string, string> = {};
    (data || []).forEach((u: any) => { mapping[u.id] = u.prenom; });
    setUserProfiles(mapping);
  }

  // Récupère dynamiquement l'id utilisateur connecté
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        console.log('currentUserId:', user.id);
      }
    };
    fetchUserId();
  }, []);

  // Fonction pour charger les demandes d'amis depuis Supabase
  async function fetchFriendRequests() {
    if (!currentUserId) return;
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`from_user.eq.${currentUserId},to_user.eq.${currentUserId}`);
    if (error) {
      console.error(error);
      return;
    }
    setFriends(data || []);
    await fetchUserProfiles(data || []);
  }

  // Charger la liste au démarrage et quand currentUserId change
  useEffect(() => {
    if (currentUserId) {
      fetchFriendRequests();
    }
  }, [currentUserId]);

  // Auto-refresh toutes les 10 secondes
  useEffect(() => {
    if (!currentUserId) return;
    const interval = setInterval(() => {
      fetchFriendRequests();
    }, 10000); // 10 secondes
    return () => clearInterval(interval);
  }, [currentUserId]);

  // Fonction pour envoyer une demande d'ami
  async function sendFriendRequest(toUserId: string) {
    if (!currentUserId || !toUserId) return false;
    const { data, error } = await supabase
      .from('friend_requests')
      .insert([
        { from_user: currentUserId, to_user: toUserId, status: 'pending' }
      ]);
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  }

  // Fonction pour accepter/refuser une demande
  async function respondToRequest(requestId: string, accepted: boolean) {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: accepted ? 'accepted' : 'rejected' })
      .eq('id', requestId);
    if (error) {
      console.error(error);
      return;
    }
    fetchFriendRequests();
  }

  // Adapter handleAddPendingFriend pour utiliser Supabase
  const handleAddPendingFriend = async (user: any) => {
    const success = await sendFriendRequest(user.id);
    if (success) {
      setAddFriendValue('');
      setUserSuggestions([]);
      // On mémorise le nom utilisé pour la demande
      setPendingNames(prev => ({ ...prev, [user.id]: user.prenom }));
      await fetchFriendRequests();
      // On anime uniquement la dernière carte ajoutée (l'ami le plus récent)
      if (friends.length > 0) {
        // On cherche l'ami le plus récent (celui qui n'a pas encore d'animation)
        const lastFriend = friends[friends.length - 1];
        if (lastFriend && !cardAnim[lastFriend.id]) {
          const anim = new Animated.Value(0);
          setCardAnim(prev => ({ ...prev, [lastFriend.id]: anim }));
          Animated.spring(anim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      }
    }
  };

  // Animation fade-in sections
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
      duration: 400,
        useNativeDriver: true,
    }).start();
  }, []);

  // Animation modale
  useEffect(() => {
    if (showCreateGroup) {
      modalAnim.setValue(0);
      Animated.timing(modalAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [showCreateGroup]);

  // Micro-interaction pop sur ajout d'ami
  const handleAddFriend = () => {
    if (!addFriendValue) return;
    const newId = (friends.length + 1).toString();
    setFriends(prev => [
      ...prev,
      {
        id: newId,
        name: addFriendValue,
        status: 'pending',
        from: currentUserId, // toujours string
        to: 'other', // à remplacer par la vraie cible
      },
    ]);
    setAddFriendValue('');
    setPopAnim(prev => ({ ...prev, [newId]: new Animated.Value(0) }));
    setTimeout(() => {
      if (popAnim[newId]) {
        Animated.spring(popAnim[newId], {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }).start();
      }
    }, 100);
  };

  // Ajoute un effet pour la recherche dynamique
  useEffect(() => {
    let active = true;
    const fetchSuggestions = async () => {
      if (addFriendValue.length < 2 || !currentUserId) {
        setUserSuggestions([]);
        return;
      }
      setIsSearching(true);
      // Exclure les amis déjà ajoutés, les demandes en attente, et soi-même
      const excludeIds = [
        ...friends
          .filter(f => (
            (f.from_user === currentUserId || f.to_user === currentUserId) &&
            (f.status === 'pending' || f.status === 'accepted')
          ))
          .map(f => (f.from_user === currentUserId ? f.to_user : f.from_user)),
        currentUserId
      ];
      const results = await searchUsersByPseudoOrEmail(addFriendValue, excludeIds);
      if (active) setUserSuggestions(results);
      setIsSearching(false);
    };
    fetchSuggestions();
    return () => { active = false; };
  }, [addFriendValue, friends, currentUserId]);

  // Animation d'apparition uniquement lors de l'ajout d'un ami
  const [cardAnim, setCardAnim] = useState<Record<string, Animated.Value>>({});

  // Fonctions dummy
  const handleShowProfile = (friend: any) => {
    // router.push(`/profile/${friend.id}`)
  };
  const handleViewGroup = (group: any) => {
    // router.push(`/group/${group.id}`)
  };
  // État pour la modale de création de groupe
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupGoal, setGroupGoal] = useState('');

  // Désactivé : le bouton 'Créer un groupe' ne fait plus rien
  const handleCreateGroup = () => {
    setShowGroupModal(true);
  };

  const handleCloseGroupModal = () => {
    setShowGroupModal(false);
    setGroupName('');
    setGroupGoal('');
  };

  // Confirmation après création de groupe
  const [showGroupConfirmation, setShowGroupConfirmation] = useState(false);
  const [lastGroupName, setLastGroupName] = useState('');
  const [lastGroupGoal, setLastGroupGoal] = useState('');

  const handleValidateGroup = () => {
    setLastGroupName(groupName);
    setLastGroupGoal(groupGoal);
    handleCloseGroupModal();
    setShowGroupConfirmation(true);
  };

  const handleCloseGroupConfirmation = async () => {
    try {
      const payload = {
        name: lastGroupName,
        goal: lastGroupGoal,
      };
      console.log('[GROUPE] Envoi des données :', payload);
      const response = await fetch('https://n8n.srv777212.hstgr.cloud/webhook-test/bfdcac3f-9df9-4580-9137-b879a5bfcf1a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      console.log('[GROUPE] Réponse serveur :', text);
    } catch (e) {
      console.log('[GROUPE] Erreur lors de l\'envoi :', e);
      alert('Erreur lors de l\'envoi des données.');
    }
    setShowGroupConfirmation(false);
  };

  const handleTabSelect = (idx: number) => {
    setSelectedTab(idx);
    if (idx === 0) router.push('/StatsPage');
    if (idx === 1) router.push('/HomeScreen');
    if (idx === 2) return;
  };

  const mainSections = [
    { key: 'amis' },
    { key: 'groupes' },
    { key: 'creer', show: showCreateGroup },
  ];

  function renderSection({ item }: { item: any }) {
    if (item.key === 'amis') {
      return (
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={26} color="#FD8B5A" style={{ marginRight: 8 }} accessibilityLabel="Icône amis" />
            <Text style={styles.sectionTitle}>Amis</Text>
          </View>
          <View style={styles.addFriendContainer}>
            <View style={styles.inputIconBox}>
              <MaterialIcons name="person-add-alt-1" size={22} color="#FD8B5A" style={{ marginRight: 6 }} accessibilityLabel="Ajouter un ami" />
              <TextInput
                style={styles.input}
                placeholder="Pseudo ou email"
                placeholderTextColor="#B0B8C1"
                value={addFriendValue}
                onChangeText={setAddFriendValue}
                accessibilityLabel="Champ pseudo ou email"
              />
        </View>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddFriend} accessibilityLabel="Ajouter un ami">
              <Text style={styles.addBtnText}>Ajouter</Text>
              </TouchableOpacity>
                </View>
          {addFriendValue.length >= 2 && (
            <View style={styles.suggestionList}>
              {isSearching ? (
                <Text style={styles.suggestionText}>Recherche...</Text>
              ) : userSuggestions.length === 0 ? (
                <Text style={styles.suggestionText}>Aucun utilisateur trouvé</Text>
              ) : userSuggestions.map(user => (
                <View key={user.id} style={styles.suggestionItem}>
                  <Text style={styles.suggestionText}>{user.prenom}</Text>
                  <TouchableOpacity style={styles.suggestionAddBtn} onPress={() => handleAddPendingFriend(user)}>
                    <Text style={styles.suggestionAddText}>Ajouter</Text>
              </TouchableOpacity>
                </View>
              ))}
                </View>
          )}
          <Text style={styles.sectionSubtitle}>Retrouve ici tous tes amis et motive-les !</Text>
          {friends.length === 0 ? (
            <Text style={styles.emptyText}>Aucun ami pour l'instant</Text>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                // item = ligne friend_requests
                const isPending = item.status === 'pending';
                const isAccepted = item.status === 'accepted';
                const isPendingSent = isPending && item.from_user === currentUserId;
                const isPendingReceived = isPending && item.to_user === currentUserId;
                // On garde le nom du pending si on l'a mémorisé
                let friendName = '';
                if (isPendingSent) {
                  friendName = userProfiles[item.to_user] ? userProfiles[item.to_user] : '';
                } else if (isPendingReceived) {
                  friendName = userProfiles[item.from_user] ? userProfiles[item.from_user] : '';
                } else if (isAccepted) {
                  // Si c'est accepté, on regarde si on a mémorisé le nom lors du pending
                  const otherId = item.from_user === currentUserId ? item.to_user : item.from_user;
                  friendName = pendingNames[otherId] || userProfiles[otherId] || otherId;
                }
                const scale = popAnim[item.id] || new Animated.Value(1);
                return (
                  <Animated.View
                    style={{
                      transform: [
                        { scale: cardAnim[item.id] ? cardAnim[item.id].interpolate({ inputRange: [0, 0.5, 0.85, 1], outputRange: [0.7, 1.08, 0.97, 1] }) : 1 },
                      ],
                      opacity: cardAnim[item.id] ? cardAnim[item.id] : 1,
                    }}
                  >
                    {isPendingReceived && (
                      <View style={styles.friendCardPending}>
                        <Ionicons name="person-circle" size={38} color="#B0B8C1" style={styles.avatar} accessibilityLabel="Avatar ami" />
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.friendName}>{friendName || 'Ami'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, gap: 8 }}>
                          <TouchableOpacity
                            style={[styles.iconActionBtn, { backgroundColor: '#71ABA4' }]}
                            onPress={() => respondToRequest(item.id, true)}
                            accessibilityLabel="Accepter la demande"
                          >
                            <Ionicons name="checkmark" size={22} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconActionBtn, { backgroundColor: '#F44336' }]}
                            onPress={() => respondToRequest(item.id, false)}
                            accessibilityLabel="Refuser la demande"
                          >
                            <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
                    )}
                    {isPendingSent && (
                      <View style={styles.friendCardPending}>
                        <Ionicons name="person-circle" size={38} color="#B0B8C1" style={styles.avatar} accessibilityLabel="Avatar ami" />
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.friendName}>{friendName || 'Ami'}</Text>
            </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                          <Ionicons name="time-outline" size={32} color="#F48B5A" accessibilityLabel="En attente de validation" />
                </View>
                </View>
                    )}
                    {isAccepted && (
                      <View style={styles.friendCard}>
                        <Pressable
                          onPress={() => { setSelectedFriend(item); setShowFriendModal(true); }}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            maxWidth: '50%',
                            // SUPPRIMER l'opacité conditionnelle ici
                            // opacity: (cooldownNotif[`${item.id}-notif`] || cooldownMotivate[`${item.id}-motivate`] || cooldownWake[`${item.id}-wake`]) ? 0.4 : 1,
                          }}
                          accessibilityLabel="Ouvrir le profil"
                        >
                          <Ionicons name="person-circle" size={38} color="#B0B8C1" style={styles.avatar} accessibilityLabel="Avatar ami" />
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.friendName}>{friendName || 'Ami'}</Text>
              </View>
                          </Pressable>
                          <View style={{ width: '50%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.iconActionBtn,
                              pressed && styles.btnPressed,
                              cooldownNotif[item.id] && { opacity: 0.4 }, // Ajouté : assombrir uniquement ce bouton
                            ]}
                            onPress={() => {
                              let opacity = toastOpacityByCard[`${item.id}-notif`];
                              if (!opacity) {
                                opacity = new Animated.Value(1);
                              } else {
                                opacity.setValue(1);
                              }
                              setToastOpacityByCard(prev => ({ ...prev, [`${item.id}-notif`]: opacity }));
                              setToastByCard(prev => ({ ...prev, [`${item.id}-notif`]: 'Félicitations envoyées !' }));
                              if (toastTimeoutsRef.current[`${item.id}-notif`]) {
                                clearTimeout(toastTimeoutsRef.current[`${item.id}-notif`]);
                              }
                              toastTimeoutsRef.current[`${item.id}-notif`] = setTimeout(() => {
                                Animated.timing(opacity, {
                                  toValue: 0,
                                  duration: 400,
                                  useNativeDriver: true,
                                }).start(() => setToastByCard(prev => ({ ...prev, [`${item.id}-notif`]: null })));
                                delete toastTimeoutsRef.current[`${item.id}-notif`];
                              }, 1000);
                              setCooldownNotif(prev => ({ ...prev, [item.id]: true }));
                              setTimeout(() => setCooldownNotif(prev => ({ ...prev, [item.id]: false })), 3000);
                            }}
                            accessibilityLabel="Féliciter"
                            disabled={!!cooldownNotif[item.id] || false} // Supprimé globalCooldown
                            hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
                          >
                            <Ionicons name="sparkles-outline" size={22} color="#fff" />
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [
                              styles.iconActionBtn,
                              pressed && styles.btnPressed,
                              cooldownMotivate[item.id] && { opacity: 0.4 }, // Ajouté : assombrir uniquement ce bouton
                            ]}
                            onPress={() => {
                              let opacity = toastOpacityByCard[`${item.id}-motivate`];
                              if (!opacity) {
                                opacity = new Animated.Value(1);
                              } else {
                                opacity.setValue(1);
                              }
                              setToastOpacityByCard(prev => ({ ...prev, [`${item.id}-motivate`]: opacity }));
                              setToastByCard(prev => ({ ...prev, [`${item.id}-motivate`]: 'Message de motivation envoyé !' }));
                              setTimeout(() => setCooldownMotivate(prev => ({ ...prev, [String(item.id)]: false })), 5000);
                              if (toastTimeoutsRef.current[`${item.id}-motivate`]) {
                                clearTimeout(toastTimeoutsRef.current[`${item.id}-motivate`]);
                              }
                              toastTimeoutsRef.current[`${item.id}-motivate`] = setTimeout(() => {
                                Animated.timing(opacity, {
                                  toValue: 0,
                                  duration: 400,
                                  useNativeDriver: true,
                                }).start(() => setToastByCard(prev => ({ ...prev, [`${item.id}-motivate`]: null })));
                                delete toastTimeoutsRef.current[`${item.id}-motivate`];
                              }, 1000);
                              setCooldownMotivate(prev => ({ ...prev, [item.id]: true }));
                              setTimeout(() => setCooldownMotivate(prev => ({ ...prev, [item.id]: false })), 3000);
                            }}
                            accessibilityLabel="Motiver"
                            disabled={!!cooldownMotivate[item.id] || false} // Supprimé globalCooldown
                            hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
                          >
                            <Ionicons name="megaphone-outline" size={22} color="#fff" />
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [
                              styles.iconActionBtn,
                              pressed && styles.btnPressed,
                              cooldownWake[item.id] && { opacity: 0.4 }, // Ajouté : assombrir uniquement ce bouton
                            ]}
                            onPress={() => {
                              let opacity = toastOpacityByCard[`${item.id}-wake`];
                              if (!opacity) {
                                opacity = new Animated.Value(1);
                              } else {
                                opacity.setValue(1);
                              }
                              setToastOpacityByCard(prev => ({ ...prev, [`${item.id}-wake`]: opacity }));
                              setToastByCard(prev => ({ ...prev, [`${item.id}-wake`]: 'Réveil envoyé !' }));
                              setTimeout(() => setCooldownWake(prev => ({ ...prev, [String(item.id)]: false })), 5000);
                              if (toastTimeoutsRef.current[`${item.id}-wake`]) {
                                clearTimeout(toastTimeoutsRef.current[`${item.id}-wake`]);
                              }
                              toastTimeoutsRef.current[`${item.id}-wake`] = setTimeout(() => {
                                Animated.timing(opacity, {
                                  toValue: 0,
                                  duration: 400,
                                  useNativeDriver: true,
                                }).start(() => setToastByCard(prev => ({ ...prev, [`${item.id}-wake`]: null })));
                                delete toastTimeoutsRef.current[`${item.id}-wake`];
                              }, 1000);
                              setCooldownWake(prev => ({ ...prev, [item.id]: true }));
                              setTimeout(() => setCooldownWake(prev => ({ ...prev, [item.id]: false })), 3000);
                            }}
                            accessibilityLabel="Réveiller"
                            disabled={!!cooldownWake[item.id] || false} // Supprimé globalCooldown
                            hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
                          >
                            <Ionicons name="notifications" size={22} color="#fff" />
                          </Pressable>
                          {toastByCard[`${item.id}-notif`] && (
                            <Animated.View style={{ position: 'absolute', bottom: 10, right: 20, backgroundColor: '#223B54', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 8, elevation: 4, opacity: toastOpacityByCard[`${item.id}-notif`] || 1 }}>
                              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{toastByCard[`${item.id}-notif`]}</Text>
                            </Animated.View>
                          )}
                          {toastByCard[`${item.id}-motivate`] && (
                            <Animated.View style={{ position: 'absolute', bottom: 10, right: 20, backgroundColor: '#223B54', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 8, elevation: 4, opacity: toastOpacityByCard[`${item.id}-motivate`] || 1 }}>
                              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{toastByCard[`${item.id}-motivate`]}</Text>
                            </Animated.View>
                          )}
                          {toastByCard[`${item.id}-wake`] && (
                            <Animated.View style={{ position: 'absolute', bottom: 10, right: 20, backgroundColor: '#223B54', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 8, elevation: 4, opacity: toastOpacityByCard[`${item.id}-wake`] || 1 }}>
                              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{toastByCard[`${item.id}-wake`]}</Text>
                            </Animated.View>
                          )}
                </View>
                </View>
                    )}
                  </Animated.View>
                );
              }}
              style={{ marginBottom: 10 }}
              scrollEnabled={false}
            />
          )}
          <View style={styles.sectionSeparatorGradient} />
        </Animated.View>
      );
    }
    if (item.key === 'groupes') {
      return (
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-circle" size={26} color="#FD8B5A" style={{ marginRight: 8 }} accessibilityLabel="Icône groupes" />
            <Text style={styles.sectionTitle}>Groupes</Text>
              </View>
          <Text style={styles.sectionSubtitle}>Rejoins ou crée un projet commun pour progresser ensemble !</Text>
          {myGroups.filter(g => g.type !== 'Groupe personnel').length === 0 ? (
            <Text style={styles.emptyText}>Aucun groupe pour l'instant</Text>
          ) : (
            <FlatList
              data={myGroups.filter(g => g.type !== 'Groupe personnel')}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.groupCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName}>{item.name}</Text>
                    <Text style={styles.groupType}>{item.type}</Text>
                </View>
                  <Pressable style={({ pressed }) => [styles.groupBtn, pressed && styles.btnPressed]} onPress={() => handleViewGroup(item)} accessibilityLabel="Voir le groupe">
                    <Text style={styles.groupBtnText}>Voir</Text>
                  </Pressable>
                </View>
              )}
              style={{ marginBottom: 10 }}
              scrollEnabled={false}
            />
          )}
          <TouchableOpacity style={styles.createGroupBtn} onPress={handleCreateGroup} accessibilityLabel="Créer un projet commun">
            <Ionicons name="add-circle" size={22} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.createGroupBtnText}>Créer un groupe</Text>
          </TouchableOpacity>
          <View style={styles.sectionSeparatorGradient} />
        </Animated.View>
      );
    }
    if (item.key === 'creer' && item.show) {
      return (
        <Animated.View
          style={{
            opacity: modalAnim,
            transform: [
              { translateY: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
              { scale: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
            ],
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.createGroupModal}>
              {!createType && (
                <>
                  <Text style={styles.modalTitle}>Quel type de groupe ?</Text>
                  <TouchableOpacity style={styles.modalOption} onPress={() => setCreateType('projet')} accessibilityLabel="Créer un projet commun">
                    <Text style={styles.modalOptionText}>Créer un projet commun</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateGroup(false)} accessibilityLabel="Annuler">
                    <Text style={styles.cancelBtnText}>Annuler</Text>
                  </TouchableOpacity>
                </>
              )}
              {createType === 'projet' && (
                <>
                  <Text style={styles.modalTitle}>Nom du projet</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nom du projet"
                    placeholderTextColor="#B0B8C1"
                    value={newGroupName}
                    onChangeText={setNewGroupName}
                    accessibilityLabel="Nom du projet"
                  />
                  <Text style={styles.modalTitle}>Objectif commun</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Objectif commun"
                    placeholderTextColor="#B0B8C1"
                    value={newProjectGoal}
                    onChangeText={setNewProjectGoal}
                    accessibilityLabel="Objectif commun"
                  />
                  <Text style={styles.modalTitle}>Inviter des amis</Text>
                  <View style={styles.chipRow}>
                    {DUMMY_ALL_FRIENDS.map(friend => (
                      <TouchableOpacity
                        key={friend.id}
                        style={selectedFriends.includes(friend.id) ? styles.chipSelected : styles.chip}
                        onPress={() => setSelectedFriends(sel => sel.includes(friend.id) ? sel.filter(f => f !== friend.id) : [...sel, friend.id])}
                        accessibilityLabel={`Sélectionner ${friend.name}`}
                      >
                        <Ionicons name="person" size={16} color={selectedFriends.includes(friend.id) ? '#fff' : '#B0B8C1'} style={{ marginRight: 4 }} />
                        <Text style={{ color: selectedFriends.includes(friend.id) ? '#fff' : '#B0B8C1', fontWeight: 'bold' }}>{friend.name}</Text>
                      </TouchableOpacity>
                    ))}
              </View>
                  {/* Résumé visuel du groupe */}
                  <View style={styles.groupSummaryBox}>
                    <Text style={styles.groupSummaryTitle}>Résumé du groupe</Text>
                    <Text style={styles.groupSummaryText}>Nom : <Text style={{ color: '#fff' }}>{newGroupName || '-'}</Text></Text>
                    <Text style={styles.groupSummaryText}>Objectif : <Text style={{ color: '#fff' }}>{newProjectGoal || '-'}</Text></Text>
                    <Text style={styles.groupSummaryText}>Membres :
                      {selectedFriends.length === 0 ? (
                        <Text style={{ color: '#fff' }}> -</Text>
                      ) : (
                        DUMMY_ALL_FRIENDS.filter(f => selectedFriends.includes(f.id)).map(f => (
                          <Text key={f.id} style={{ color: '#fff' }}> {f.name}</Text>
                        ))
                      )}
                    </Text>
            </View>
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleCreateGroup} accessibilityLabel="Créer le groupe">
                    <Text style={styles.confirmBtnText}>Créer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateType(null)} accessibilityLabel="Retour">
                    <Text style={styles.cancelBtnText}>Retour</Text>
                  </TouchableOpacity>
                </>
              )}
          </View>
            </View>
        </Animated.View>
      );
    }
    return null;
  }

  const jiggleNotif = useRef(new Animated.Value(0)).current;
  const jiggleMotivate = useRef(new Animated.Value(0)).current;
  const jiggleWake = useRef(new Animated.Value(0)).current;

  // Fonction d'effet jiggle
  function startJiggle(anim: Animated.Value) {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -1, duration: 80, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  }

  // Remplacer les états globaux par des états par carte
  const [cooldownNotif, setCooldownNotif] = useState<{ [id: string]: boolean }>({});
  const [cooldownMotivate, setCooldownMotivate] = useState<{ [id: string]: boolean }>({});
  const [cooldownWake, setCooldownWake] = useState<{ [id: string]: boolean }>({});
  const [toastByCard, setToastByCard] = useState<{ [id: string]: string | null }>({});

  // Toast personnalisé pour chaque action
  const handleNotify = () => {
    // if (globalCooldown) return; // Supprimé
    // setGlobalCooldown(true); // Supprimé
    // setTimeout(() => setGlobalCooldown(false), 5000); // Supprimé
    let opacity = toastOpacityByCard[`${selectedFriend?.id || ''}-notif`];
    if (!opacity) {
      opacity = new Animated.Value(1);
    } else {
      opacity.setValue(1);
    }
    setToastOpacityByCard(prev => ({ ...prev, [`${selectedFriend?.id || ''}-notif`]: opacity }));
    setToastByCard(prev => ({ ...prev, [`${selectedFriend?.id || ''}-notif`]: 'Félicitations envoyées !' }));
    if (toastTimeoutsRef.current[`${selectedFriend?.id || ''}-notif`]) {
      clearTimeout(toastTimeoutsRef.current[`${selectedFriend?.id || ''}-notif`]);
    }
    toastTimeoutsRef.current[`${selectedFriend?.id || ''}-notif`] = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setToastByCard(prev => ({ ...prev, [`${selectedFriend?.id || ''}-notif`]: null })));
      delete toastTimeoutsRef.current[`${selectedFriend?.id || ''}-notif`];
    }, 1000);
    setCooldownNotif(prev => ({ ...prev, [selectedFriend?.id || '']: true }));
    setTimeout(() => setCooldownNotif(prev => ({ ...prev, [selectedFriend?.id || '']: false })), 3000);
  };
  const handleMotivate = () => {
    // if (globalCooldown) return; // Supprimé
    // setGlobalCooldown(true); // Supprimé
    // setTimeout(() => setGlobalCooldown(false), 5000); // Supprimé
    let opacity = toastOpacityByCard[`${selectedFriend?.id || ''}-motivate`];
    if (!opacity) {
      opacity = new Animated.Value(1);
    } else {
      opacity.setValue(1);
    }
    setToastOpacityByCard(prev => ({ ...prev, [`${selectedFriend?.id || ''}-motivate`]: opacity }));
    setToastByCard(prev => ({ ...prev, [`${selectedFriend?.id || ''}-motivate`]: 'Message de motivation envoyé !' }));
    setTimeout(() => setCooldownMotivate(prev => ({ ...prev, [String(selectedFriend?.id)]: false })), 5000);
    if (toastTimeoutsRef.current[`${selectedFriend?.id || ''}-motivate`]) {
      clearTimeout(toastTimeoutsRef.current[`${selectedFriend?.id || ''}-motivate`]);
    }
    toastTimeoutsRef.current[`${selectedFriend?.id || ''}-motivate`] = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setToastByCard(prev => ({ ...prev, [`${selectedFriend?.id || ''}-motivate`]: null })));
      delete toastTimeoutsRef.current[`${selectedFriend?.id || ''}-motivate`];
    }, 1000);
    setCooldownMotivate(prev => ({ ...prev, [selectedFriend?.id || '']: true }));
    setTimeout(() => setCooldownMotivate(prev => ({ ...prev, [selectedFriend?.id || '']: false })), 3000);
  };
  const handleWake = () => {
    // if (globalCooldown) return; // Supprimé
    // setGlobalCooldown(true); // Supprimé
    // setTimeout(() => setGlobalCooldown(false), 5000); // Supprimé
    let opacity = toastOpacityByCard[`${selectedFriend?.id || ''}-wake`];
    if (!opacity) {
      opacity = new Animated.Value(1);
    } else {
      opacity.setValue(1);
    }
    setToastOpacityByCard(prev => ({ ...prev, [`${selectedFriend?.id || ''}-wake`]: opacity }));
    setToastByCard(prev => ({ ...prev, [`${selectedFriend?.id || ''}-wake`]: 'Réveil envoyé !' }));
    setTimeout(() => setCooldownWake(prev => ({ ...prev, [String(selectedFriend?.id)]: false })), 5000);
    if (toastTimeoutsRef.current[`${selectedFriend?.id || ''}-wake`]) {
      clearTimeout(toastTimeoutsRef.current[`${selectedFriend?.id || ''}-wake`]);
    }
    toastTimeoutsRef.current[`${selectedFriend?.id || ''}-wake`] = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setToastByCard(prev => ({ ...prev, [`${selectedFriend?.id || ''}-wake`]: null })));
      delete toastTimeoutsRef.current[`${selectedFriend?.id || ''}-wake`];
    }, 1000);
    setCooldownWake(prev => ({ ...prev, [selectedFriend?.id || '']: true }));
    setTimeout(() => setCooldownWake(prev => ({ ...prev, [selectedFriend?.id || '']: false })), 3000);
  };

  // Désactive le jiggle pendant le cooldown
  useEffect(() => {
    let isActive = true;
    let timeout1: ReturnType<typeof setTimeout> | undefined;
    let timeout2: ReturnType<typeof setTimeout> | undefined;
    let timeout3: ReturnType<typeof setTimeout> | undefined;
    if (showFriendModal) {
      const loopAnim = () => {
        if (!isActive) return;
        if (!cooldownNotif[selectedFriend?.id || '']) startJiggle(jiggleNotif);
        timeout1 = setTimeout(() => { if (!cooldownMotivate[selectedFriend?.id || '']) startJiggle(jiggleMotivate); }, 1000);
        timeout2 = setTimeout(() => { if (!cooldownWake[selectedFriend?.id || '']) startJiggle(jiggleWake); }, 2000);
        timeout3 = setTimeout(loopAnim, 5000);
      };
      loopAnim();
    }
    return () => {
      isActive = false;
      if (timeout1 !== undefined) clearTimeout(timeout1);
      if (timeout2 !== undefined) clearTimeout(timeout2);
      if (timeout3 !== undefined) clearTimeout(timeout3);
    };
  }, [showFriendModal, cooldownNotif, cooldownMotivate, cooldownWake, selectedFriend?.id]);

  useEffect(() => {
    if (showFriendModal) {
      modalPopAnim.setValue(0.95);
      Animated.spring(modalPopAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [showFriendModal]);

  // Fonction pour supprimer un ami
  async function deleteFriend(requestId: string) {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);
    if (error) {
      console.error('Erreur lors de la suppression de l\'ami:', error);
      return;
    }
    setShowFriendModal(false);
    fetchFriendRequests();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerBox}>
        <Ionicons name="earth" size={30} color="#FD8B5A" style={{ marginRight: 10 }} />
        <Text style={styles.headerTitle}>Communauté</Text>
                </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          data={mainSections.filter(s => s.key !== 'creer' || s.show)}
          renderItem={renderSection}
          keyExtractor={item => item.key}
          contentContainerStyle={{ padding: 20, paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
      {showFriendModal && selectedFriend && (
        <View style={styles.friendModalOverlay}>
          <Animated.View style={[styles.friendModalBox, { transform: [{ scale: modalPopAnim }], opacity: (cooldownNotif[`${selectedFriend?.id}-notif`] || cooldownMotivate[`${selectedFriend?.id}-motivate`] || cooldownWake[`${selectedFriend?.id}-wake`]) ? 0.4 : 1 }]}> 
            <Text style={styles.friendModalName}>{selectedFriend.name}</Text>
            <View style={styles.friendModalObjectiveBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <FontAwesome5 name="bullseye" size={20} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.friendModalObjectiveText}>Objectif en cours</Text>
                </View>
              <Text style={styles.friendModalObjectiveValue}>Courir 5km</Text>
                </View>
            <View style={styles.friendModalStatsCard}>
              <View style={styles.friendModalStatsRow}>
                <View style={styles.friendModalMiniCard}>
                  <View style={styles.friendModalStatValueRow}>
                    <Text style={styles.friendModalStatValue}>2</Text>
                    <Ionicons name="star" size={20} color="#F48B5A" style={styles.friendModalStatIconRight} />
                </View>
                  <Text style={styles.friendModalStatLabel}>Niveau</Text>
            </View>
                <View style={styles.friendModalMiniCard}>
                  <View style={styles.friendModalStatValueRow}>
                    <Text style={styles.friendModalStatValue}>5</Text>
                    <Ionicons name="trophy" size={20} color="#FFD700" style={styles.friendModalStatIconRight} />
          </View>
                  <Text style={styles.friendModalStatLabel}>Niveau total</Text>
              </View>
              </View>
              <View style={styles.friendModalStatsSeparator} />
              <View style={styles.friendModalStatsRow}>
                <View style={styles.friendModalMiniCard}>
                  <View style={styles.friendModalStatValueRow}>
                    <Text style={styles.friendModalStatValue}>12</Text>
                    <Ionicons name="flag-outline" size={20} color="#71ABA4" style={styles.friendModalStatIconRight} />
              </View>
                  <Text style={styles.friendModalStatLabel}>Quêtes</Text>
              </View>
                <View style={styles.friendModalMiniCard}>
                  <View style={styles.friendModalStatValueRow}>
                    <Text style={styles.friendModalStatValue}>3</Text>
                    <FontAwesome5 name="bullseye" size={18} color="#F48B5A" style={styles.friendModalStatIconRight} />
            </View>
                  <Text style={styles.friendModalStatLabel}>Objectifs</Text>
          </View>
              </View>
              <View style={styles.friendModalDifficultyBox}>
                <Ionicons name="flash-outline" size={22} color="#FF9800" style={styles.friendModalStatIcon} />
                <Text style={styles.friendModalDifficultyValue}>Intermédiaire</Text>
              </View>
              <Text style={styles.friendModalDifficultyLabel}>Difficulté</Text>
              </View>
            <View style={{ alignItems: 'center', marginTop: 35 }}>
              <View style={styles.friendModalActionRow}>
                <Animated.View style={{ transform: [{ rotate: jiggleNotif.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-10deg', '0deg', '10deg'] }) }] }}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.friendModalActionBtn,
                      styles.friendModalNotifBtn,
                      cooldownNotif[selectedFriend?.id || ''] && { opacity: 0.4 },
                      pressed && !cooldownNotif[selectedFriend?.id || ''] && { transform: [{ scale: 0.96 }], opacity: 0.85 }
                    ]}
                    onPress={handleNotify}
                    disabled={cooldownNotif[selectedFriend?.id || ''] || false} // Supprimé globalCooldown
                    accessibilityLabel="Féliciter"
                    hitSlop={{top: 24, bottom: 24, left: 24, right: 24}}
                  >
                    <Ionicons name="sparkles-outline" size={24} color="#fff" />
                    <Text style={styles.friendModalActionLabel}>Féliciter</Text>
                  </Pressable>
      </Animated.View>
                <Animated.View style={{ transform: [{ rotate: jiggleMotivate.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-10deg', '0deg', '10deg'] }) }] }}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.friendModalActionBtn,
                      styles.friendModalMotivateBtn,
                      cooldownMotivate[selectedFriend?.id || ''] && { opacity: 0.4 },
                      pressed && !cooldownMotivate[selectedFriend?.id || ''] && { transform: [{ scale: 0.96 }], opacity: 0.85 }
                    ]}
                    onPress={handleMotivate}
                    disabled={cooldownMotivate[selectedFriend?.id || ''] || false} // Supprimé globalCooldown
                    accessibilityLabel="Motiver"
                    hitSlop={{top: 24, bottom: 24, left: 24, right: 24}}
                  >
                    <Ionicons name="megaphone-outline" size={24} color="#fff" />
                    <Text style={styles.friendModalActionLabel}>Motiver</Text>
                  </Pressable>
                </Animated.View>
                <Animated.View style={{ transform: [{ rotate: jiggleWake.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-10deg', '0deg', '10deg'] }) }] }}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.friendModalActionBtn,
                      styles.friendModalWakeBtn,
                      cooldownWake[selectedFriend?.id || ''] && { opacity: 0.4 },
                      pressed && !cooldownWake[selectedFriend?.id || ''] && { transform: [{ scale: 0.96 }], opacity: 0.85 }
                    ]}
                    onPress={handleWake}
                    disabled={cooldownWake[selectedFriend?.id || ''] || false} // Supprimé globalCooldown
                    accessibilityLabel="Réveiller"
                    hitSlop={{top: 24, bottom: 24, left: 24, right: 24}}
                  >
                    <Ionicons name="notifications" size={24} color="#fff" />
                    <Text style={styles.friendModalActionLabel}>Réveiller</Text>
                  </Pressable>
                </Animated.View>
            </View>
          </View>
          <TouchableOpacity style={styles.friendModalDeleteBtn} accessibilityLabel="Supprimer l'ami" onPress={() => selectedFriend && deleteFriend(selectedFriend.id)}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.friendModalDeleteText}>Supprimer l'ami</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.friendModalCloseBtn} onPress={() => setShowFriendModal(false)} accessibilityLabel="Fermer">
            <Text style={styles.friendModalCloseText}>Fermer</Text>
          </TouchableOpacity>
          {toastByCard[`${selectedFriend?.id || ''}-notif`] && (
            <Animated.View style={{ position: 'absolute', bottom: 110, alignSelf: 'center', backgroundColor: '#223B54', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12, shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 8, elevation: 4, opacity: toastOpacityByCard[`${selectedFriend?.id || ''}-notif`] || 1 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{toastByCard[`${selectedFriend?.id || ''}-notif`]}</Text>
    </Animated.View>
          )}
          {toastByCard[`${selectedFriend?.id || ''}-motivate`] && (
            <Animated.View style={{ position: 'absolute', bottom: 110, alignSelf: 'center', backgroundColor: '#223B54', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12, shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 8, elevation: 4, opacity: toastOpacityByCard[`${selectedFriend?.id || ''}-motivate`] || 1 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{toastByCard[`${selectedFriend?.id || ''}-motivate`]}</Text>
            </Animated.View>
          )}
          {toastByCard[`${selectedFriend?.id || ''}-wake`] && (
            <Animated.View style={{ position: 'absolute', bottom: 110, alignSelf: 'center', backgroundColor: '#223B54', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12, shadowColor: '#000', shadowOpacity: 0.13, shadowRadius: 8, elevation: 4, opacity: toastOpacityByCard[`${selectedFriend?.id || ''}-wake`] || 1 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{toastByCard[`${selectedFriend?.id || ''}-wake`]}</Text>
            </Animated.View>
          )}
        </Animated.View>
      </View>
      )}
      <BottomNavBar selectedIndex={selectedTab} onSelect={handleTabSelect} />

      {/* Modal de création de groupe */}
      {showGroupModal && (
        <View style={[styles.friendModalOverlay, { backgroundColor: 'rgba(20,38,58,0.98)' }]} pointerEvents="box-none">
          <Animated.View style={styles.groupModalBox} pointerEvents="auto"> 
            <Text style={styles.groupModalTitle}>Créer un groupe</Text>
            <TextInput
              style={styles.groupModalInput}
              placeholder="Nom du groupe"
              placeholderTextColor="#B0B8C1"
              value={groupName}
              onChangeText={setGroupName}
              accessibilityLabel="Nom du groupe"
              autoFocus={true}
            />
            <TextInput
              style={styles.groupModalInput}
              placeholder="Objectif du groupe"
              placeholderTextColor="#B0B8C1"
              value={groupGoal}
              onChangeText={setGroupGoal}
              accessibilityLabel="Objectif du groupe"
            />
            <View style={styles.groupModalBtnRow}>
              <TouchableOpacity style={styles.groupModalValidateBtn} onPress={handleValidateGroup} accessibilityLabel="Valider le groupe">
                <Text style={styles.groupModalValidateText}>Valider</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.groupModalCancelBtn} onPress={handleCloseGroupModal} accessibilityLabel="Annuler">
                <Text style={styles.groupModalCancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}

      {/* Pop-up de confirmation après création de groupe */}
      {showGroupConfirmation && (
        <View style={[styles.friendModalOverlay, { backgroundColor: 'rgba(20,38,58,0.98)' }]} pointerEvents="box-none">
          <Animated.View style={styles.groupModalBox} pointerEvents="auto"> 
            <Text style={styles.groupModalTitle}>Confirmation</Text>
            <Text style={{ color: '#fff', fontSize: 17, marginBottom: 10, textAlign: 'center', fontFamily: 'Righteous' }}>
              <Text style={{ color: '#FD8B5A' }}>Nom :</Text> {lastGroupName || '-'}
            </Text>
            <Text style={{ color: '#fff', fontSize: 17, marginBottom: 18, textAlign: 'center', fontFamily: 'Righteous' }}>
              <Text style={{ color: '#FD8B5A' }}>Objectif :</Text> {lastGroupGoal || '-'}
            </Text>
            <View style={styles.groupModalBtnRow}>
              <TouchableOpacity style={styles.groupModalRedBtn} onPress={() => {
                setShowGroupConfirmation(false);
                setGroupName(lastGroupName);
                setGroupGoal(lastGroupGoal);
                setShowGroupModal(true);
              }} accessibilityLabel="Retour">
                <Text style={styles.groupModalRedText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.groupModalGreenBtn} onPress={handleCloseGroupConfirmation} accessibilityLabel="Je confirme">
                <Text style={styles.groupModalGreenText}>Je confirme</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#041836',
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: 'Righteous',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
    fontFamily: 'Righteous',
  },
  sectionSubtitle: {
    color: '#B0B8C1',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 2,
    fontFamily: 'Righteous',
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: 'rgba(198, 231, 226, 0.10)',
    marginVertical: 18,
    borderRadius: 2,
  },
  sectionSeparatorGradient: {
    height: 3,
    borderRadius: 2,
    marginVertical: 18,
    backgroundColor: 'linear-gradient(90deg, #FD8B5A 0%, #041836 100%)', // fallback, à remplacer par un vrai dégradé si besoin
    opacity: 0.18,
  },
  emptyText: {
    color: '#B0B8C1',
    fontSize: 15,
    textAlign: 'center',
    marginVertical: 18,
    fontStyle: 'italic',
    fontFamily: 'Righteous',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#223B54', // était #14263A, devient #223B54
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  friendCardPending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14263A', // était #223B54, devient #14263A
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    // opacity: 0.6, // laissé commenté
  },
  avatar: {
    fontSize: 32,
    marginRight: 14,
  },
  friendName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Righteous',
  },
  sharingBox: {
    marginTop: 4,
    backgroundColor: '#1C3147',
    borderRadius: 8,
    padding: 6,
  },
  goalText: {
    color: '#F48B5A',
    fontWeight: '600',
    marginBottom: 2,
  },
  mapDummy: {
    backgroundColor: '#223B54',
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
    marginTop: 2,
  },
  mapText: {
    color: '#B0B8C1',
    fontSize: 12,
  },
  profileBtn: {
    marginLeft: 8,
    marginRight: 2,
    backgroundColor: 'rgba(253, 139, 90, 0.10)',
    borderRadius: 8,
    padding: 6,
  },
  actionBtn: {
    backgroundColor: '#F48B5A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  btnPressed: {
    opacity: 0.7,
  },
  addFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 6,
  },
  inputIconBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C3147',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 10,
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: '#F48B5A',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14263A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  groupName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Righteous',
  },
  groupType: {
    color: '#B0B8C1',
    fontSize: 13,
    marginTop: 2,
    fontFamily: 'Righteous',
  },
  groupBtn: {
    backgroundColor: '#F48B5A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  groupBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'Righteous',
  },
  createGroupBtn: {
    backgroundColor: '#F48B5A',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  createGroupBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
    fontFamily: 'Righteous',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  createGroupModal: {
    backgroundColor: '#14263A',
    borderRadius: 18,
    padding: 24,
    width: width * 0.92,
    maxWidth: 420,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  modalTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Righteous',
  },
  modalOption: {
    backgroundColor: '#223B54',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  modalOptionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Righteous',
  },
  confirmBtn: {
    backgroundColor: '#F48B5A',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Righteous',
  },
  cancelBtn: {
    backgroundColor: '#223B54',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelBtnText: {
    color: '#F48B5A',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Righteous',
  },
  infoText: {
    color: '#B0B8C1',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Righteous',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addRoleBtn: {
    backgroundColor: '#223B54',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  addRoleBtnText: {
    color: '#F48B5A',
    fontWeight: 'bold',
  },
  iconActionBtn: {
    backgroundColor: '#F48B5A',
    borderRadius: 50,
    padding: 10,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#223B54',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  chipSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F48B5A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  groupSummaryBox: {
    backgroundColor: '#1C3147',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    marginTop: 8,
  },
  groupSummaryTitle: {
    color: '#F48B5A',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
    fontFamily: 'Righteous',
  },
  groupSummaryText: {
    color: '#B0B8C1',
    fontSize: 14,
    marginBottom: 2,
    fontFamily: 'Righteous',
  },
  friendModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  friendModalBox: {
    backgroundColor: '#14263A',
    borderRadius: 26,
    padding: 28,
    width: '88%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  friendModalName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 26,
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: 'Righteous',
  },
  friendModalObjectiveBox: {
    backgroundColor: '#F48B5A',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginBottom: 26,
    alignItems: 'center',
    shadowColor: '#F48B5A',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  friendModalObjectiveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
    letterSpacing: 0.2,
    fontFamily: 'Righteous',
  },
  friendModalObjectiveValue: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Righteous',
  },
  friendModalStatsCard: {
    backgroundColor: '#1C3147',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 26,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  friendModalMiniCard: {
    backgroundColor: '#223B54',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    minWidth: 70,
  },
  friendModalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 16,
  },
  friendModalActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 14,
    marginHorizontal: 4,
    minWidth: 70,
    minHeight: 70,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  friendModalNotifBtn: {
    backgroundColor: '#71ABA4', // vert
  },
  friendModalMotivateBtn: {
    backgroundColor: '#71ABA4', // vert
  },
  friendModalWakeBtn: {
    backgroundColor: '#71ABA4', // vert
  },
  friendModalActionLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 6,
    letterSpacing: 0.2,
    fontFamily: 'Righteous',
  },
  friendModalStatsSeparator: {
    height: 8,
  },
  friendModalDifficultyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 0,
  },
  friendModalDifficultyValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 6,
    letterSpacing: 0.2,
    fontFamily: 'Righteous',
  },
  friendModalDifficultyLabel: {
    color: '#B0B8C1',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 2,
    fontFamily: 'Righteous',
  },
  friendModalStatIconRight: {
    marginLeft: 6,
    marginBottom: -2,
  },
  friendModalStatValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  friendModalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 18,
  },
  friendModalStat: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  friendModalStatValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    fontFamily: 'Righteous',
  },
  friendModalStatLabel: {
    color: '#B0B8C1',
    fontSize: 12,
    fontFamily: 'Righteous',
  },
  friendModalStatIcon: {
    marginRight: 4,
    marginBottom: -2,
  },
  friendModalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F48B5A',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 18,
    marginBottom: 8,
  },
  friendModalDeleteText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
    fontFamily: 'Righteous',
  },
  friendModalCloseBtn: {
    backgroundColor: '#223B54',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
  },
  friendModalCloseText: {
    color: '#F48B5A',
    fontWeight: 'bold',
    fontSize: 15,
    fontFamily: 'Righteous',
  },
  friendModalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 18,
    width: '100%',
    gap: 18,
    // flexWrap: 'wrap', // supprimé pour forcer une seule ligne
  },
  addFriendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C3147',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    marginTop: 8,
  },
  suggestionList: {
    backgroundColor: '#223B54',
    borderRadius: 10,
    marginTop: 2,
    marginBottom: 10,
    padding: 6,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  suggestionText: {
    color: '#C6E7E2',
    fontSize: 15,
  },
  suggestionAddBtn: {
    backgroundColor: '#FD8B5A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 10,
  },
  suggestionAddText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // --- Styles épurés pour la modale de groupe ---
  groupModalBox: {
    backgroundColor: '#223B54',
    borderRadius: 28,
    padding: 24,
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    alignItems: 'center',
  },
  groupModalTitle: {
    fontFamily: 'Righteous',
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  groupModalInput: {
    backgroundColor: '#14263A',
    borderRadius: 14,
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
    width: '100%',
    fontFamily: 'SpaceMono-Regular',
  },
  groupModalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 10,
    width: '100%',
  },
  groupModalValidateBtn: {
    backgroundColor: '#FD8B5A',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
    marginRight: 4,
  },
  groupModalValidateText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Righteous',
    textAlign: 'center',
  },
  groupModalCancelBtn: {
    backgroundColor: '#14263A',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
    marginLeft: 4,
  },
  groupModalCancelText: {
    color: '#FD8B5A',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Righteous',
    textAlign: 'center',
  },
  groupModalCloseBtn: {
    backgroundColor: '#FD8B5A',
    borderRadius: 22,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    minWidth: 120,
  },
  groupModalCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Righteous',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  groupModalRedBtn: {
    backgroundColor: '#F44336',
    borderRadius: 22,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 120,
  },
  groupModalRedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Righteous',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  groupModalGreenBtn: {
    backgroundColor: '#71ABA4',
    borderRadius: 22,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 120,
    marginLeft: 8,
  },
  groupModalGreenText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Righteous',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
}); 