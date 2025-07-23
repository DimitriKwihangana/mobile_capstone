import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// TypeScript interfaces
interface User {
  id: string;
  name: string;
  email: string;
  type: string;
  organization: string;
  role: string;
  position: string;
  phone: string;
  location: string;
  isVerified: boolean;
}

interface ProfileSectionProps {
  icon: string;
  title: string;
  children: React.ReactNode;
}

interface InfoItemProps {
  icon: string;
  label: string;
  value: string;
  verified?: boolean;
}

interface AccessBadgeProps {
  type: string;
  role: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingOut, setSigningOut] = useState<boolean>(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async (): Promise<void> => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData) as User);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? This will clear all your data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              // Clear all stored data
              await AsyncStorage.multiRemove([
                'user',
                'token',
                'isAuthenticated',
                'tokenExpiry',
                'rememberMe',
                'rememberedEmail',
                'language'
              ]);
              
              // Navigate to login screen
              router.replace('/');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const ProfileSection: React.FC<ProfileSectionProps> = ({ icon, title, children }) => (
    <View style={styles.profileSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <Ionicons name={icon as any} size={24} color="#ffffff" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, verified = false }) => (
    <View style={styles.infoItem}>
      <View style={styles.infoContent}>
        <View style={styles.infoIcon}>
          <Ionicons name={icon as any} size={16} color="#ffffff" />
        </View>
        <View style={styles.infoText}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
      {verified && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      )}
    </View>
  );

  const AccessBadge: React.FC<AccessBadgeProps> = ({ type, role }) => {
    const getTypeInfo = () => {
      switch (type) {
        case 'laboratory':
          return {
            color: '#8B5CF6',
            text: 'Laboratory Access',
            icon: 'shield-checkmark-outline'
          };
        case 'admin':
          return {
            color: '#EF4444',
            text: 'Administrator',
            icon: 'settings-outline'
          };
        case 'processor':
          return {
            color: '#3B82F6',
            text: 'Processor Access',
            icon: 'business-outline'
          };
        case 'cooperative':
          return {
            color: '#10B981',
            text: 'Cooperative Access',
            icon: 'people-outline'
          };
        default:
          return {
            color: '#6B7280',
            text: 'Standard Access',
            icon: 'person-outline'
          };
      }
    };

    const typeInfo = getTypeInfo();

    return (
      <View style={styles.accessBadgeContainer}>
        <View style={[styles.accessBadge, { backgroundColor: typeInfo.color }]}>
          <Ionicons name={typeInfo.icon as any} size={16} color="#ffffff" />
          <Text style={styles.accessBadgeText}>{typeInfo.text}</Text>
        </View>
        <View style={[styles.accessBadge, { backgroundColor: '#10B981' }]}>
          <Ionicons name="school-outline" size={16} color="#ffffff" />
          <Text style={styles.accessBadgeText}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
        </View>
      </View>
    );
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={64} color="#9CA3AF" />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userPosition}>{user.position}</Text>
            <Text style={styles.userOrganization}>{user.organization}</Text>
            <View style={styles.accessBadgesContainer}>
              <AccessBadge type={user.type} role={user.role} />
            </View>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={16} color="#ffffff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={16} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contact Information */}
      <ProfileSection icon="mail-outline" title="Contact Information">
        <View style={styles.sectionContent}>
          <InfoItem 
            icon="mail-outline"
            label="Email Address"
            value={user.email}
            verified={user.isVerified}
          />
          <InfoItem 
            icon="call-outline"
            label="Phone Number"
            value={user.phone || 'Not provided'}
          />
          <InfoItem 
            icon="location-outline"
            label="Location"
            value={user.location || 'Not provided'}
          />
        </View>
      </ProfileSection>

      {/* Professional Information */}
      <ProfileSection icon="briefcase-outline" title="Professional Details">
        <View style={styles.sectionContent}>
          <InfoItem 
            icon="business-outline"
            label="Organization"
            value={user.organization}
          />
          <InfoItem 
            icon="briefcase-outline"
            label="Position"
            value={user.position}
          />
          <InfoItem 
            icon="shield-checkmark-outline"
            label="Account Type"
            value={user.type.charAt(0).toUpperCase() + user.type.slice(1)}
          />
        </View>
      </ProfileSection>

      {/* Account Status */}
      <View style={styles.profileSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#ffffff" />
          </View>
          <Text style={styles.sectionTitle}>Account Status</Text>
        </View>
        
        <View style={styles.statusGrid}>
          <View style={styles.statusCard}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#10B981" />
            <Text style={styles.statusTitle}>Verified Account</Text>
            <Text style={styles.statusDescription}>Email verified and active</Text>
          </View>
          
          <View style={styles.statusCard}>
            <Ionicons name="star-outline" size={32} color="#3B82F6" />
            <Text style={styles.statusTitle}>Professional User</Text>
            <Text style={styles.statusDescription}>Full platform access</Text>
          </View>
          
          <View style={styles.statusCard}>
            <Ionicons name="calendar-outline" size={32} color="#8B5CF6" />
            <Text style={styles.statusTitle}>Active Member</Text>
            <Text style={styles.statusDescription}>Since 2025</Text>
          </View>
        </View>
      </View>

      {/* Sign Out Section */}
      <View style={styles.signOutSection}>
        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#ffffff" />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.signOutDescription}>
          This will clear all your data and return you to the login screen
        </Text>
      </View>

      {/* Footer Spacing */}
      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#10B981',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  userPosition: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 2,
  },
  userOrganization: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 12,
  },
  accessBadgesContainer: {
    marginTop: 8,
  },
  accessBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  accessBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
  },
  profileSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconContainer: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  sectionContent: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    backgroundColor: '#3B82F6',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  statusGrid: {
    gap: 16,
  },
  statusCard: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  signOutSection: {
    margin: 16,
    padding: 24,
    alignItems: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  footer: {
    height: 32,
  },
});