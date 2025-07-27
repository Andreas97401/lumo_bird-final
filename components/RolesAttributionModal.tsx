import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
// Palette harmonisée avec l'app
const ORANGE = '#FD8B5A';
const GREEN = '#71ABA4';
const DARK = '#041836';
// Palette harmonisée : toutes les cartes de rôles en vert pâle
const ROLE_PASTELS = [
  'rgba(113,171,164,0.18)',
];
const ROLE_ICONS = [
  'shield-outline',
  'person-outline',
  'star-outline',
  'medal-outline',
];
const AVATAR_COLORS = [ORANGE, GREEN];
// Palette d'outlines pour les cartes de rôles
const ROLE_OUTLINES = [GREEN];

interface Role {
  id: string;
  role: string;
  description: string;
  tasks: string[];
  icon?: string;
}
interface User {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
}
interface RolesAttributionModalProps {
  visible: boolean;
  roles: Role[];
  users: User[];
  onClose: () => void;
  onSendInvitations?: (assignments: Record<string, string[]>) => void;
}

export default function RolesAttributionModal({ visible, roles, users, onClose, onSendInvitations }: RolesAttributionModalProps) {
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [draggingUser, setDraggingUser] = useState<User | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const dropZones = useRef<Record<string, { x: number; y: number; w: number; h: number }>>({});
  // Ajoute l'état pour le détail du rôle
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const plusRefs = useRef<Record<string, any>>({});

  // Vérifie si tous les rôles ont au moins un membre assigné
  const allRolesAssigned = roles.every(role => 
    assignments[role.id] && assignments[role.id].length > 0
  );

  // Fonction pour envoyer les invitations
  const handleSendInvitations = () => {
    if (allRolesAssigned && onSendInvitations) {
      onSendInvitations(assignments);
      onClose();
    }
  };

  // Drag logic
  function handleUserDrag(user: User, e: any) {
    setDraggingUser(user);
  }
  function handleUserDrop() {
    if (!draggingUser || !dropTarget) {
      setDraggingUser(null);
      setDropTarget(null);
      setDragPos({ x: 0, y: 0 });
      return;
    }
    if ((assignments[dropTarget] || []).includes(draggingUser.id)) {
      setDraggingUser(null);
      setDropTarget(null);
      setDragPos({ x: 0, y: 0 });
      return;
    }
    setAssignments(prev => ({
      ...prev,
      [dropTarget]: [...(prev[dropTarget] || []), draggingUser.id]
    }));
    setDraggingUser(null);
    setDropTarget(null);
    setDragPos({ x: 0, y: 0 });
    if (Platform.OS !== 'web') Vibration.vibrate(10);
  }
  function onDropZoneLayout(roleId: string, e: any) {
    const { x, y, width, height } = e.nativeEvent.layout;
    dropZones.current[roleId] = { x, y, w: width, h: height };
  }
  function checkDropTarget(x: number, y: number) {
    let found = null;
    for (const [roleId, ref] of Object.entries(plusRefs.current)) {
      if (!ref || !ref.current || typeof ref.current.measureInWindow !== 'function') continue;
      ref.current.measureInWindow((px: number, py: number, w: number, h: number) => {
        // Tolérance de 20px autour du bouton +
        if (
          x > px - 20 && x < px + w + 20 &&
          y > py - 20 && y < py + h + 20
        ) {
          found = roleId;
        }
      });
    }
    setDropTarget(found);
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Header clair */}
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>Attribution des rôles</Text>
          <TouchableOpacity onPress={onClose} style={styles.headerCloseBtn}>
            <Ionicons name="close" size={28} color={DARK} />
          </TouchableOpacity>
        </View>
        {/* Liste des rôles (cartes pastel) */}
        <ScrollView style={styles.rolesColumn} contentContainerStyle={{ alignItems: 'center', paddingVertical: 8 }} showsVerticalScrollIndicator={false}>
          {roles.map((role, idx) => (
            <RoleCard
              key={role.id}
              role={role}
              assignedUsers={assignments[role.id] || []}
              users={users}
              onDropZoneLayout={onDropZoneLayout}
              onRemoveUser={userId => setAssignments(prev => ({ ...prev, [role.id]: (prev[role.id] || []).filter(id => id !== userId) }))}
              pastelColor={ROLE_PASTELS[0]}
              iconName={ROLE_ICONS[idx % ROLE_ICONS.length]}
              iconColor={GREEN}
              outlineColor={(assignments[role.id] || []).length > 0 ? ORANGE : GREEN}
              isDropTarget={dropTarget === role.id}
              membersCount={(assignments[role.id] || []).length}
              onPress={() => setSelectedRole(role)}
              plusRef={plusRefs.current[role.id] || (plusRefs.current[role.id] = React.createRef())}
            />
          ))}
        </ScrollView>
        
        {/* Bouton d'envoi des invitations */}
        {allRolesAssigned && (
          <TouchableOpacity 
            style={[styles.sendButton]} 
            onPress={handleSendInvitations}
          >
            <Text style={styles.sendButtonText}>Envoyer les invitations</Text>
          </TouchableOpacity>
        )}

        {/* Membres à assigner */}
        <View style={styles.membersBox}>
          <Text style={styles.membersTitle}>MEMBRES À ASSIGNER ({users.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingVertical: 8 }}>
            {users.map((user, idx) => {
              const isDragging = draggingUser?.id === user.id;
              const scale = useSharedValue(isDragging ? 1.15 : 1);
              React.useEffect(() => {
                if (isDragging) scale.value = withSpring(1.15);
                else scale.value = withSpring(1);
              }, [isDragging]);
              const avatarAnim = useAnimatedStyle(() => ({
                transform: [{ scale: scale.value }],
                shadowOpacity: isDragging ? 0.35 : 0.18,
                shadowRadius: isDragging ? 16 : 8,
                elevation: isDragging ? 8 : 3,
              }));
              return (
                <PanGestureHandler
                  key={user.id}
                  onGestureEvent={e => {
                    setDragPos({ x: e.nativeEvent.absoluteX, y: e.nativeEvent.absoluteY });
                    checkDropTarget(e.nativeEvent.absoluteX, e.nativeEvent.absoluteY);
                  }}
                  onBegan={e => handleUserDrag(user, e)}
                  onEnded={handleUserDrop}
                >
                  <View style={{ alignItems: 'center' }}>
                    <Animated.View style={[styles.memberAvatar, avatarAnim, { backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }]}> 
                      <Text style={styles.memberInitials}>{user.initials}</Text>
                    </Animated.View>
                    <Text style={styles.memberName}>{user.name}</Text>
                  </View>
                </PanGestureHandler>
              );
            })}
          </ScrollView>
        </View>
        {/* Avatar qui suit le doigt */}
        {draggingUser && (
          <Animated.View style={[styles.draggingAvatar, { left: dragPos.x - 28, top: dragPos.y - 28, zIndex: 9999, backgroundColor: '#fff' }]}> 
            <Text style={[styles.memberInitials, { color: DARK }]}>{draggingUser.initials}</Text>
          </Animated.View>
        )}
        {/* Ajoute le modal de détail du rôle */}
        {selectedRole && (
          <Modal visible transparent animationType="fade">
            <View style={{ flex: 1, backgroundColor: 'rgba(4,24,54,0.92)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#223B54', borderRadius: 24, padding: 28, width: '90%', maxWidth: 400, alignItems: 'center' }}>
                <Text style={{ color: '#FD8B5A', fontSize: 22, fontFamily: 'Righteous', marginBottom: 10, textAlign: 'center' }}>{selectedRole.role}</Text>
                <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'SpaceMono-Regular', marginBottom: 14, textAlign: 'center' }}>{selectedRole.description}</Text>
                <Text style={{ color: '#B0B8C1', fontSize: 15, fontFamily: 'Righteous', marginBottom: 6 }}>Tâches types :</Text>
                {selectedRole.tasks.map((task: string, idx: number) => (
                  <Text key={idx} style={{ color: '#fff', fontSize: 15, fontFamily: 'SpaceMono-Regular', marginBottom: 2 }}>• {task}</Text>
                ))}
                <TouchableOpacity onPress={() => setSelectedRole(null)} style={{ marginTop: 18, alignSelf: 'center' }}>
                  <Text style={{ color: '#FD8B5A', fontWeight: 'bold', fontSize: 17, fontFamily: 'Righteous' }}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

// Carte de rôle pastel, row, feedback drop, nombre de membres
interface RoleCardProps {
  role: Role;
  assignedUsers: string[];
  users: User[];
  onDropZoneLayout: (roleId: string, e: any) => void;
  onRemoveUser: (userId: string) => void;
  pastelColor: string;
  iconName: string;
  iconColor: string;
  outlineColor: string;
  isDropTarget: boolean;
  membersCount: number;
  onPress: () => void;
  plusRef: (el: any) => void;
}
function RoleCard({ role, assignedUsers, users, onDropZoneLayout, onRemoveUser, pastelColor, iconName, iconColor, outlineColor, isDropTarget, membersCount, onPress, plusRef }: RoleCardProps) {
  // Effet lift sur la carte lors du drag-over
  const scale = useSharedValue(isDropTarget ? 1.04 : 1);
  React.useEffect(() => {
    scale.value = withSpring(isDropTarget ? 1.04 : 1, { damping: 12 });
  }, [isDropTarget]);
  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: isDropTarget ? 0.28 : 0.12,
    shadowRadius: isDropTarget ? 24 : 12,
    elevation: isDropTarget ? 16 : 8,
  }));
  // Outline orange si au moins un membre, sinon vert
  const hasMember = assignedUsers.length > 0;
  const borderColor = isDropTarget ? ORANGE : (hasMember ? ORANGE : outlineColor);
  return (
    <Animated.View
      style={[
        styles.roleCard,
        { backgroundColor: pastelColor, borderColor: isDropTarget ? ORANGE : outlineColor, borderWidth: 2 },
        cardAnim,
      ]}
      entering={FadeInDown.duration(400)}
    >
      {/* Bloc gauche : icône + titre */}
      <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} activeOpacity={0.85} onPress={onPress}>
        <View style={[styles.roleIconPastel, { backgroundColor: '#fff' }]}> 
          <Ionicons name={iconName as any} size={26} color={iconColor} />
        </View>
        <View style={{ marginLeft: 10, maxWidth: '70%' }}>
          <Text style={styles.roleNamePastel} numberOfLines={2} ellipsizeMode="tail">{role.role}</Text>
          <Text style={styles.roleMembers}>{membersCount} membre{membersCount > 1 ? 's' : ''}</Text>
        </View>
      </TouchableOpacity>
      {/* Bloc droite : avatars assignés + bouton + */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
        {assignedUsers.map((userId: string, idx: number) => {
          const user = users.find(u => u.id === userId);
          if (!user) return null;
          return (
            <TouchableOpacity key={userId} onPress={() => onRemoveUser(userId)} style={{ marginRight: 4 }}>
              <View style={[styles.memberAvatar, { width: 32, height: 32, borderRadius: 16, marginHorizontal: 0, backgroundColor: '#FD8B5A' }]}> 
                <Text style={[styles.memberInitials, { fontSize: 14 }]}>{user.initials}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <Pressable
          ref={plusRef}
          style={[styles.roleDropBtn, isDropTarget && styles.roleDropBtnActive]}
        >
          <Ionicons name="add-circle-outline" size={32} color={isDropTarget ? ORANGE : '#B0B8C1'} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(4,24,54,0.97)', justifyContent: 'flex-end', alignItems: 'center', paddingTop: 40 },
  headerBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 10, width: '100%', maxWidth: 600 },
  headerTitle: { fontFamily: 'Righteous', fontSize: 22, color: '#fff', fontWeight: 'bold' },
  headerCloseBtn: { padding: 8, marginLeft: 8 },
  sendButton: { 
    backgroundColor: GREEN, 
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 20,
    opacity: 1
  },
  sendButtonDisabled: {
    opacity: 0.5
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  rolesColumn: { flex: 1, width: '100%', marginBottom: 12, backgroundColor: 'transparent' },
  roleCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, paddingVertical: 18, paddingHorizontal: 18, marginBottom: 16, width: '92%', alignSelf: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  roleIconPastel: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  roleNamePastel: { fontFamily: 'Righteous', fontSize: 16, color: '#fff', fontWeight: 'bold', marginBottom: 2 },
  roleMembers: { fontSize: 13, color: '#fff', marginTop: 2 },
  roleDropBtn: { marginLeft: 16, borderRadius: 22, borderWidth: 2, borderColor: '#E0E0E0', backgroundColor: '#fff', padding: 2, alignItems: 'center', justifyContent: 'center', width: 44, height: 44, shadowColor: ORANGE, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  roleDropBtnActive: { borderColor: ORANGE, backgroundColor: 'rgba(253,139,90,0.13)' },
  membersBox: { backgroundColor: 'transparent', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 18, paddingBottom: 10, width: '100%', maxWidth: 600, alignItems: 'flex-start', paddingHorizontal: 22, marginTop: 8 },
  membersTitle: { fontSize: 13, color: '#fff', fontWeight: 'bold', marginBottom: 6, letterSpacing: 1 },
  memberAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8, marginBottom: 2, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  memberInitials: { color: '#fff', fontWeight: 'bold', fontSize: 18, fontFamily: 'Righteous' },
  memberName: { color: '#fff', fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  draggingAvatar: { position: 'absolute', zIndex: 9999, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#FD8B5A', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
}); 