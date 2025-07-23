import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TypeScript interfaces
interface User {
  id: string;
  name?: string;
  email: string;
  type: string;
  username?: string;
  organization?: string;
  role?: string;
}

interface Batch {
  _id: string;
  batchId: string;
  supplier: string;
  date: string;
  aflatoxin: number | string;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt?: string;
  isOnMarket?: boolean;
  availableQuantity?: number;
  pricePerKg?: number;
  moisture_maize_grain?: number;
  Immaturegrains?: number;
  Discolored_grains?: number;
  broken_kernels_percent_maize_grain?: number;
  foreign_matter_percent_maize_grain?: number;
  pest_damaged?: number;
  rotten?: number;
  Liveinfestation?: boolean;
  abnormal_odours_maize_grain?: boolean;
}

interface Test {
  id: string;
  batchId: string;
  date: string;
  supplier: string;
  aflatoxin: number;
  result: string;
  color: string;
  createdAt: string;
  userId: string;
  userName: string;
  isOnMarket: boolean;
  availableQuantity: number;
  pricePerKg: number;
}

interface Stat {
  label: string;
  value: string;
  change: string;
  icon: string;
  color: string;
}

interface DashboardData {
  stats: Stat[];
  recentTests: Test[];
  loading: boolean;
}

interface AflatoxinAssessment {
  result: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
}

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

interface MarketplaceForm {
  quantity: string;
  pricePerKg: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<string>('en');
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: [],
    recentTests: [],
    loading: true
  });
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showBatchDetail, setShowBatchDetail] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Marketplace form state
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState<boolean>(false);
  const [marketplaceForm, setMarketplaceForm] = useState<MarketplaceForm>({
    quantity: '',
    pricePerKg: ''
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Translation object
  const translations: Translations = {
    en: {
      welcomeBack: 'Welcome back',
      todayOverview: "Here's your food safety overview for today",
      completeOverview: "Here's the complete food safety overview for all users",
      adminView: 'Administrator View - Showing all system tests',
      totalTests: 'Total Tests',
      totalTestsAll: 'Total Tests (All Users)',
      safeForChildren: 'Safe for Children',
      safeForChildrenAll: 'Safe for Children (All)',
      alerts: 'Alerts',
      alertsSystem: 'Alerts (System-wide)',
      avgAflatoxin: 'Avg. Aflatoxin',
      systemAvgAflatoxin: 'System Avg. Aflatoxin',
      recentTests: 'Recent Tests',
      viewDetails: 'View Details',
      loading: 'Loading dashboard data...',
      safeForChildrenResult: 'Safe for Children',
      adultsOnly: 'Adults Only',
      animalFeedOnly: 'Animal Feed Only',
      unsafe: 'Unsafe',
      batchAnalysis: 'Batch Analysis',
      close: 'Close',
      marketplace: 'Marketplace',
      listOnMarketplace: 'List on Marketplace',
      quantity: 'Quantity (kg)',
      pricePerKg: 'Price per kg (Rwf)',
      listOnMarket: 'List on Market',
      removeFromMarket: 'Remove from Market',
      cancel: 'Cancel',
      listedOnMarket: 'Listed on Market',
      notListed: 'Not Listed',
      available: 'available',
      at: 'at',
      basicInfo: 'Basic Information',
      batchId: 'Batch ID',
      supplier: 'Supplier',
      testDate: 'Test Date',
      testedBy: 'Tested By',
      aflatoxinLevel: 'ppb aflatoxin',
      youOwnBatch: 'You own this batch',
      ownedBy: 'Owned by',
      canListMarketplace: 'Can list on marketplace',
      marketplaceRestricted: 'Marketplace access restricted to cooperatives',
      switchToKinyarwanda: 'Kinyarwanda'
    },
    rw: {
      welcomeBack: 'Murakaza neza',
      todayOverview: 'Dore incamake yumutekano wibiryo uyu munsi',
      completeOverview: 'Dore incamake yuzuye yumutekano wibiryo kubakoresha bose',
      adminView: 'Reba Umuyobozi - Werekana igerageza ryose rya sisitemu',
      totalTests: 'Igerageza Ryose',
      totalTestsAll: 'Igerageza Ryose (Abakoresha Bose)',
      safeForChildren: 'Biryo byiza kubana',
      safeForChildrenAll: 'Biryo byiza kubana (Byose)',
      alerts: 'Iburira',
      alertsSystem: 'Iburira (Muri Sisitemu Yose)',
      avgAflatoxin: 'Aflatoxin Yimpuzandengo',
      systemAvgAflatoxin: 'Aflatoxin Yimpuzandengo ya Sisitemu',
      recentTests: 'Igerageza Rigishije',
      viewDetails: 'Reba Amakuru Arambuye',
      loading: 'Gukura amakuru yikibaho...',
      safeForChildrenResult: 'Biryo byiza kubana',
      adultsOnly: 'Bakuze Gusa',
      animalFeedOnly: 'Indyo zinyamaswa Gusa',
      unsafe: 'Birateje Akaga',
      batchAnalysis: 'Isesengura rya Batch',
      close: 'Gufunga',
      marketplace: 'Isoko',
      listOnMarketplace: 'Shyira mu Isoko',
      quantity: 'Ingano (kg)',
      pricePerKg: 'Igiciro kuri kg (Rwf)',
      listOnMarket: 'Shyira mu Isoko',
      removeFromMarket: 'Gukuramo mu Isoko',
      cancel: 'Kuraguza',
      listedOnMarket: 'Biri mu Isoko',
      notListed: 'Ntabwo biri mu Isoko',
      available: 'biraboneka',
      at: 'kuri',
      basicInfo: 'Amakuru Shingiro',
      batchId: 'ID ya Batch',
      supplier: 'Uwatanze',
      testDate: 'Itariki yo Gerageza',
      testedBy: 'Byagerejwe na',
      aflatoxinLevel: 'ppb aflatoxin',
      youOwnBatch: 'Uri ushobora batch',
      ownedBy: 'Ifite',
      canListMarketplace: 'Ushobora gushyira mu isoko',
      marketplaceRestricted: 'Isoko rihagaritswe kuri cooperative',
      switchToKinyarwanda: 'English'
    }
  };

  const t = translations[language];

  // Load user data and language preference
  useEffect(() => {
    loadUserData();
    loadLanguagePreference();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, language]);

  const loadUserData = async (): Promise<void> => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData) as User);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadLanguagePreference = async (): Promise<void> => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const toggleLanguage = async (): Promise<void> => {
    const newLanguage = language === 'en' ? 'rw' : 'en';
    setLanguage(newLanguage);
    try {
      await AsyncStorage.setItem('language', newLanguage);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Calculate aflatoxin assessment
  const calculateAflatoxinAssessment = (aflatoxinLevel: number | string): AflatoxinAssessment => {
    const level = parseFloat(aflatoxinLevel?.toString() || '0') || 0;
    
    if (level >= 0 && level <= 5) {
      return { result: t.safeForChildrenResult, color: 'green' };
    } else if (level > 5 && level <= 10) {
      return { result: t.adultsOnly, color: 'yellow' };
    } else if (level > 10 && level <= 20) {
      return { result: t.animalFeedOnly, color: 'orange' };
    } else {
      return { result: t.unsafe, color: 'red' };
    }
  };

  // Transform API batch data to tests format
  const transformBatchesToTests = (batches: Batch[]): Test[] => {
    return batches.map(batch => {
      const aflatoxinLevel = parseFloat(batch.aflatoxin?.toString() || '0') || 0;
      const assessment = calculateAflatoxinAssessment(aflatoxinLevel);
      
      return {
        id: batch._id,
        batchId: batch.batchId || 'N/A',
        date: batch.date || new Date().toISOString(),
        supplier: batch.supplier || 'Unknown',
        aflatoxin: aflatoxinLevel,
        result: assessment.result,
        color: assessment.color,
        createdAt: batch.createdAt || new Date().toISOString(),
        userId: batch.userId,
        userName: batch.userName || 'Unknown',
        isOnMarket: batch.isOnMarket || false,
        availableQuantity: batch.availableQuantity || 0,
        pricePerKg: batch.pricePerKg || 0,
      };
    });
  };

  // Calculate dashboard statistics
  const calculateStats = (userBatches: Batch[]): Stat[] => {
    const totalTests = userBatches.length;
    
    const safeForChildren = userBatches.filter(batch => {
      const level = parseFloat(batch.aflatoxin?.toString() || '0') || 0;
      return level >= 0 && level <= 5;
    }).length;
    
    const alertCount = userBatches.filter(batch => {
      const level = parseFloat(batch.aflatoxin?.toString() || '0') || 0;
      return level > 20;
    }).length;

    const warningCount = userBatches.filter(batch => {
      const level = parseFloat(batch.aflatoxin?.toString() || '0') || 0;
      return level > 5 && level <= 20;
    }).length;

    const avgAflatoxin = userBatches.length > 0 
      ? userBatches.reduce((sum, batch) => {
          const level = parseFloat(batch.aflatoxin?.toString() || '0') || 0;
          return sum + level;
        }, 0) / userBatches.length
      : 0;

    return [
      { 
        label: user?.type === 'admin' ? t.totalTestsAll : t.totalTests, 
        value: totalTests.toString(), 
        change: totalTests > 0 ? '+' + Math.floor(Math.random() * 20) + '%' : '0%', 
        icon: 'flask-outline', 
        color: '#3B82F6' 
      },
      { 
        label: user?.type === 'admin' ? t.safeForChildrenAll : t.safeForChildren, 
        value: safeForChildren.toString(), 
        change: safeForChildren > 0 ? '+' + Math.floor(Math.random() * 15) + '%' : '0%', 
        icon: 'checkmark-circle-outline', 
        color: '#10B981' 
      },
      { 
        label: user?.type === 'admin' ? t.alertsSystem : t.alerts, 
        value: (alertCount + warningCount).toString(), 
        change: alertCount > 0 ? '+' + Math.floor(Math.random() * 10) + '%' : '0%', 
        icon: 'warning-outline', 
        color: '#EF4444' 
      },
      { 
        label: user?.type === 'admin' ? t.systemAvgAflatoxin : t.avgAflatoxin, 
        value: avgAflatoxin.toFixed(1) + ' ppb', 
        change: '+' + (Math.random() * 2).toFixed(1) + '%', 
        icon: 'analytics-outline', 
        color: '#8B5CF6' 
      }
    ];
  };

  const fetchDashboardData = async (): Promise<void> => {
    if (!user) return;

    try {
      const response = await fetch('https://back-cap.onrender.com/api/batches');
      const apiData = await response.json();

      if (apiData.success && apiData.data && Array.isArray(apiData.data)) {
        console.log('API Data received:', apiData.data.length, 'batches');
        console.log('Sample batch:', apiData.data[0]); // Debug log to see data structure
        
        const userBatches = user.type === 'admin' 
          ? apiData.data as Batch[]
          : (apiData.data as Batch[]).filter(batch => 
              batch && (
                batch.userId === user.id || 
                batch.userName === user.email || 
                batch.userName === user.username
              )
            );

        // Filter out any null or undefined batches
        const validBatches = userBatches.filter((batch): batch is Batch => batch && !!batch._id);
        
        setAllBatches(validBatches);

        const recentTests = transformBatchesToTests(validBatches)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10);

        const stats = calculateStats(validBatches);

        setDashboardData({
          stats,
          recentTests,
          loading: false
        });
      } else {
        console.log('No valid batch data received:', apiData);
        setDashboardData({
          stats: [
            { label: t.totalTests, value: '0', change: '0%', icon: 'flask-outline', color: '#3B82F6' },
            { label: t.safeForChildren, value: '0', change: '0%', icon: 'checkmark-circle-outline', color: '#10B981' },
            { label: t.alerts, value: '0', change: '0%', icon: 'warning-outline', color: '#EF4444' },
            { label: t.avgAflatoxin, value: '0 ppb', change: '0%', icon: 'analytics-outline', color: '#8B5CF6' }
          ],
          recentTests: [],
          loading: false
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData({
        stats: [
          { label: t.totalTests, value: '0', change: '0%', icon: 'flask-outline', color: '#3B82F6' },
          { label: t.safeForChildren, value: '0', change: '0%', icon: 'checkmark-circle-outline', color: '#10B981' },
          { label: t.alerts, value: '0', change: '0%', icon: 'warning-outline', color: '#EF4444' },
          { label: t.avgAflatoxin, value: '0 ppb', change: '0%', icon: 'analytics-outline', color: '#8B5CF6' }
        ],
        recentTests: [],
        loading: false
      });
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleTestClick = (testId: string): void => {
    const batch = allBatches.find(b => b._id === testId);
    if (batch) {
      setSelectedBatch(batch);
      setShowBatchDetail(true);
    }
  };

  const closeBatchDetail = (): void => {
    setShowBatchDetail(false);
    setSelectedBatch(null);
    setIsMarketplaceOpen(false);
    setMarketplaceForm({ quantity: '', pricePerKg: '' });
  };

  // Marketplace functions
  const handlePutOnMarket = async (): Promise<void> => {
    if (!selectedBatch) return;

    if (!marketplaceForm.quantity || parseFloat(marketplaceForm.quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    if (!marketplaceForm.pricePerKg || parseFloat(marketplaceForm.pricePerKg) <= 0) {
      Alert.alert('Error', 'Please enter a valid price per kg');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`https://back-cap.onrender.com/api/batches/${selectedBatch._id}/market`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: parseFloat(marketplaceForm.quantity),
          pricePerKg: parseFloat(marketplaceForm.pricePerKg)
        })
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Batch successfully listed on marketplace!');
        setIsMarketplaceOpen(false);
        setMarketplaceForm({ quantity: '', pricePerKg: '' });
        
        // Update selectedBatch
        setSelectedBatch(data.data);
        
        // Refresh dashboard data
        await fetchDashboardData();
      } else {
        Alert.alert('Error', data.message || 'Failed to list batch on market');
      }
    } catch (error) {
      console.error('Error listing batch on market:', error);
      Alert.alert('Error', 'Failed to list batch on market');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromMarket = async (): Promise<void> => {
    if (!selectedBatch) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`https://back-cap.onrender.com/api/batches/${selectedBatch._id}/market`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Batch removed from marketplace!');
        
        // Update selectedBatch
        setSelectedBatch(data.data);
        
        // Refresh dashboard data
        await fetchDashboardData();
      } else {
        Alert.alert('Error', data.message || 'Failed to remove batch from market');
      }
    } catch (error) {
      console.error('Error removing batch from market:', error);
      Alert.alert('Error', 'Failed to remove batch from market');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (color: string): string => {
    switch (color) {
      case 'green': return '#10B981';
      case 'yellow': return '#F59E0B';
      case 'orange': return '#FB923C';
      case 'red': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Check if current user owns the batch
  const isOwner = selectedBatch && user && (
    selectedBatch.userId === user.id || 
    selectedBatch.userName === user.email || 
    selectedBatch.userName === user.username
  );

  // Check if user can access marketplace
  const canAccessMarketplace = isOwner && user?.type === 'cooperative';

  if (dashboardData.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>
            {t.welcomeBack}, {user?.name || user?.email}!
          </Text>
          <Text style={styles.subGreeting}>
            {user?.type === 'admin' ? t.completeOverview : t.todayOverview}
          </Text>
          {user?.type === 'admin' && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#3B82F6" />
              <Text style={styles.adminBadgeText}>{t.adminView}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.languageButton} onPress={toggleLanguage}>
          <Ionicons name="language-outline" size={20} color="#10B981" />
          <Text style={styles.languageButtonText}>{t.switchToKinyarwanda}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {dashboardData.stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              <Text style={[styles.statChange, { color: stat.change.startsWith('+') ? '#10B981' : '#EF4444' }]}>
                {stat.change}
              </Text>
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.recentTests}</Text>
        <View style={styles.testsList}>
          {dashboardData.recentTests.length > 0 ? (
            dashboardData.recentTests.map((test) => (
              <TouchableOpacity
                key={test.id}
                style={styles.testCard}
                onPress={() => handleTestClick(test.id)}
              >
                <View style={styles.testHeader}>
                  <View>
                    <Text style={styles.testBatchId}>{test.batchId}</Text>
                    <Text style={styles.testSupplier}>{test.supplier}</Text>
                  </View>
                  <View style={styles.testMeta}>
                    <Text style={styles.testAflatoxin}>{(test.aflatoxin || 0).toFixed(1)} ppb</Text>
                    <Text style={styles.testDate}>{formatDate(test.date)}</Text>
                  </View>
                </View>
                <View style={styles.testFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(test.color) }]}>
                    <Text style={styles.statusText}>{test.result}</Text>
                  </View>
                  {test.isOnMarket && (
                    <View style={styles.marketBadge}>
                      <Ionicons name="storefront-outline" size={14} color="#3B82F6" />
                      <Text style={styles.marketBadgeText}>{t.listedOnMarket}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="flask-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No tests found</Text>
            </View>
          )}
        </View>
      </View>

      {/* Batch Detail Modal */}
      <Modal
        visible={showBatchDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={closeBatchDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.batchAnalysis}</Text>
              <TouchableOpacity onPress={closeBatchDetail}>
                <Ionicons name="close-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedBatch && (
                <>
                  {/* Aflatoxin Assessment */}
                  <View style={[styles.assessmentCard, { backgroundColor: getStatusColor(calculateAflatoxinAssessment(selectedBatch.aflatoxin || 0).color) + '20' }]}>
                    <Text style={styles.aflatoxinValue}>{Math.round(parseFloat(selectedBatch.aflatoxin?.toString() || '0') || 0)}</Text>
                    <Text style={styles.aflatoxinUnit}>{t.aflatoxinLevel}</Text>
                    <View style={[styles.resultBadge, { backgroundColor: getStatusColor(calculateAflatoxinAssessment(selectedBatch.aflatoxin || 0).color) }]}>
                      <Text style={styles.resultText}>{calculateAflatoxinAssessment(selectedBatch.aflatoxin || 0).result}</Text>
                    </View>
                  </View>

                  {/* Marketplace Section - Only for cooperative owners */}
                  {canAccessMarketplace && (
                    <View style={styles.marketplaceSection}>
                      <View style={styles.marketplaceHeader}>
                        <View style={styles.marketplaceTitleContainer}>
                          <Ionicons name="storefront-outline" size={20} color="#3B82F6" />
                          <Text style={styles.marketplaceTitle}>{t.marketplace}</Text>
                        </View>
                        {selectedBatch.isOnMarket ? (
                          <View style={styles.marketStatusBadge}>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                            <Text style={styles.marketStatusText}>{t.listedOnMarket}</Text>
                          </View>
                        ) : (
                          <View style={[styles.marketStatusBadge, { backgroundColor: '#F3F4F6' }]}>
                            <Ionicons name="package-outline" size={16} color="#6B7280" />
                            <Text style={[styles.marketStatusText, { color: '#6B7280' }]}>{t.notListed}</Text>
                          </View>
                        )}
                      </View>

                      {!selectedBatch.isOnMarket && !isMarketplaceOpen && (
                        <TouchableOpacity
                          style={styles.listMarketButton}
                          onPress={() => setIsMarketplaceOpen(true)}
                        >
                          <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
                          <Text style={styles.listMarketButtonText}>{t.listOnMarketplace}</Text>
                        </TouchableOpacity>
                      )}

                      {isMarketplaceOpen && (
                        <View style={styles.marketplaceForm}>
                          <View style={styles.formRow}>
                            <View style={styles.formField}>
                              <Text style={styles.formLabel}>{t.quantity}</Text>
                              <TextInput
                                style={styles.formInput}
                                placeholder="0.0"
                                value={marketplaceForm.quantity}
                                onChangeText={(text: string) => setMarketplaceForm(prev => ({ ...prev, quantity: text }))}
                                keyboardType="numeric"
                              />
                            </View>
                            <View style={styles.formField}>
                              <Text style={styles.formLabel}>{t.pricePerKg}</Text>
                              <TextInput
                                style={styles.formInput}
                                placeholder="0.00"
                                value={marketplaceForm.pricePerKg}
                                onChangeText={(text) => setMarketplaceForm(prev => ({ ...prev, pricePerKg: text }))}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>
                          <View style={styles.formButtons}>
                            <TouchableOpacity
                              style={styles.submitButton}
                              onPress={handlePutOnMarket}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <ActivityIndicator color="#ffffff" />
                              ) : (
                                <Text style={styles.submitButtonText}>{t.listOnMarket}</Text>
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.cancelButton}
                              onPress={() => {
                                setIsMarketplaceOpen(false);
                                setMarketplaceForm({ quantity: '', pricePerKg: '' });
                              }}
                            >
                              <Text style={styles.cancelButtonText}>{t.cancel}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {selectedBatch.isOnMarket && (
                        <View style={styles.marketedBatchInfo}>
                          <View style={styles.marketedBatchDetails}>
                            <Text style={styles.marketedBatchText}>
                              {(selectedBatch.availableQuantity || 0)}kg {t.available} {t.at} {(selectedBatch.pricePerKg || 0)}Rwf/kg
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.removeMarketButton}
                            onPress={handleRemoveFromMarket}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <ActivityIndicator color="#ffffff" />
                            ) : (
                              <Text style={styles.removeMarketButtonText}>{t.removeFromMarket}</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Basic Information */}
                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>{t.basicInfo}</Text>
                    <View style={styles.infoGrid}>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>{t.batchId}</Text>
                        <Text style={styles.infoValue}>{selectedBatch.batchId}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>{t.supplier}</Text>
                        <Text style={styles.infoValue}>{selectedBatch.supplier}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>{t.testDate}</Text>
                        <Text style={styles.infoValue}>{formatDate(selectedBatch.date)}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>{t.testedBy}</Text>
                        <Text style={styles.infoValue}>{selectedBatch.userName}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Ownership Info */}
                  <View style={styles.ownershipSection}>
                    <View style={[styles.ownershipBadge, { backgroundColor: isOwner ? '#ECFDF5' : '#F3F4F6' }]}>
                      <Ionicons 
                        name={isOwner ? "checkmark-circle-outline" : "person-outline"} 
                        size={16} 
                        color={isOwner ? '#10B981' : '#6B7280'} 
                      />
                      <Text style={[styles.ownershipText, { color: isOwner ? '#10B981' : '#6B7280' }]}>
                        {isOwner ? t.youOwnBatch : `${t.ownedBy} ${selectedBatch.userName}`}
                      </Text>
                    </View>
                    
                    {isOwner && (
                      <View style={[styles.accessBadge, { backgroundColor: user?.type === 'cooperative' ? '#EFF6FF' : '#F3F4F6' }]}>
                        <Ionicons 
                          name={user?.type === 'cooperative' ? "storefront-outline" : "close-circle-outline"} 
                          size={16} 
                          color={user?.type === 'cooperative' ? '#3B82F6' : '#6B7280'} 
                        />
                        <Text style={[styles.accessText, { color: user?.type === 'cooperative' ? '#3B82F6' : '#6B7280' }]}>
                          {user?.type === 'cooperative' ? t.canListMarketplace : t.marketplaceRestricted}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeButton} onPress={closeBatchDetail}>
                <Text style={styles.closeButtonText}>{t.close}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
    gap: 8,
  },
  adminBadgeText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  languageButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  testsList: {
    gap: 12,
  },
  testCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  testBatchId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  testSupplier: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  testMeta: {
    alignItems: 'flex-end',
  },
  testAflatoxin: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  testDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  testFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  marketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  marketBadgeText: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    maxHeight: '90%',
    width: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  assessmentCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  aflatoxinValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
  },
  aflatoxinUnit: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  resultBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  marketplaceSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  marketplaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  marketplaceTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  marketplaceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  marketStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  marketStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  listMarketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  listMarketButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  marketplaceForm: {
    gap: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  marketedBatchInfo: {
    gap: 12,
  },
  marketedBatchDetails: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
  },
  marketedBatchText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  removeMarketButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeMarketButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  ownershipSection: {
    gap: 8,
  },
  ownershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  ownershipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  accessText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  closeButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});