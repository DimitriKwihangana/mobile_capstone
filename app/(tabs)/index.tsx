import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TestPage() {
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    batchId: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    userId: '',
    userName: '',
    laboratoryEmail: ''
  });

  const [laboratoryUsers, setLaboratoryUsers] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [showLabModal, setShowLabModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Translation object
  const translations = {
    en: {
      createNewTest: 'Create New Test',
      submitGrainTesting: 'Submit grain testing information with laboratory assignment',
      batchInformation: 'Batch Information',
      laboratoryAssignment: 'Laboratory Assignment',
      batchId: 'Batch ID',
      supplier: 'Supplier',
      date: 'Date',
      selectLaboratory: 'Select Laboratory',
      enterBatchId: 'Enter batch ID',
      enterSupplierName: 'Enter supplier name',
      selectLabPlaceholder: 'Select a laboratory...',
      loadingLaboratories: 'Loading laboratories...',
      noLaboratoriesFound: 'No laboratories found',
      selectedLaboratory: 'Selected Laboratory:',
      email: 'Email:',
      organization: 'Organization:',
      createTest: 'Create Test',
      submitting: 'Submitting...',
      testCreatedSuccess: 'Test created successfully!',
      errorPrefix: 'Error:',
      failedToCreateTest: 'Failed to create test',
      errorCreatingTest: 'Error creating test. Please try again.',
      switchToKinyarwanda: 'Kinyarwanda',
      close: 'Close'
    },
    rw: {
      createNewTest: 'Kurema Igerageza Rishya',
      submitGrainTesting: 'Kwinjiza amakuru yo gupima ibinyampeke hamwe no guhagararira ubushakashatsi',
      batchInformation: 'Amakuru ya Batch',
      laboratoryAssignment: 'Guhagararira Ubushakashatsi',
      batchId: 'ID ya Batch',
      supplier: 'Uwatanze',
      date: 'Itariki',
      selectLaboratory: 'Hitamo Ubushakashatsi',
      enterBatchId: 'Injiza ID ya batch',
      enterSupplierName: 'Injiza izina ry\'uwatanze',
      selectLabPlaceholder: 'Hitamo ubushakashatsi...',
      loadingLaboratories: 'Gukura ubushakashatsi...',
      noLaboratoriesFound: 'Nta bushakashatsi bwaboneka',
      selectedLaboratory: 'Ubushakashatsi Bwahitanwe:',
      email: 'Imeri:',
      organization: 'Ikigo:',
      createTest: 'Kurema Igerageza',
      submitting: 'Kwinjiza...',
      testCreatedSuccess: 'Igerageza ryaremwe neza!',
      errorPrefix: 'Ikosa:',
      failedToCreateTest: 'Kunanirwa kurema igerageza',
      errorCreatingTest: 'Ikosa mu kurema igerageza. Gerageza ukundi.',
      switchToKinyarwanda: 'English',
      close: 'Gufunga'
    }
  };

  const t = translations[language];

  // Load user data and language preference
  useEffect(() => {
    loadUserData();
    loadLanguagePreference();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUser(user);
        setFormData(prev => ({
          ...prev,
          userId: user.id || '',
          userName: user.email || ''
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const toggleLanguage = async () => {
    const newLanguage = language === 'en' ? 'rw' : 'en';
    setLanguage(newLanguage);
    try {
      await AsyncStorage.setItem('language', newLanguage);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Fetch laboratory users
  useEffect(() => {
    fetchLaboratoryUsers();
  }, []);

  const fetchLaboratoryUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://back-cap.onrender.com/api/users');
      const data = await response.json();
      
      if (data.status && data.data) {
        const labUsers = data.data.filter(user => user.type === 'laboratory');
        setLaboratoryUsers(labUsers);
      }
    } catch (error) {
      console.error('Error fetching laboratory users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLabSelection = (labUser) => {
    setSelectedLab(labUser);
    setFormData(prev => ({
      ...prev,
      laboratoryEmail: labUser.email
    }));
    setShowLabModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.batchId || !formData.supplier || !selectedLab) {
      Alert.alert('Error', 'Please fill in all required fields and select a laboratory.');
      return;
    }

    setSubmitLoading(true);
    
    try {
      const response = await fetch('https://back-cap.onrender.com/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', t.testCreatedSuccess);
        // Reset form
        setFormData({
          batchId: '',
          supplier: '',
          date: new Date().toISOString().split('T')[0],
          userId: user?.id || '',
          userName: user?.email || '',
          laboratoryEmail: ''
        });
        setSelectedLab(null);
      } else {
        Alert.alert('Error', result.message || t.failedToCreateTest);
      }
    } catch (error) {
      console.error('Error creating test:', error);
      Alert.alert('Error', t.errorCreatingTest);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t.createNewTest}</Text>
          <Text style={styles.subtitle}>{t.submitGrainTesting}</Text>
        </View>
        <TouchableOpacity style={styles.languageButton} onPress={toggleLanguage}>
          <Ionicons name="language-outline" size={20} color="#10B981" />
          <Text style={styles.languageButtonText}>{t.switchToKinyarwanda}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Form */}
      <View style={styles.formContainer}>
        {/* Batch Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.batchInformation}</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>{t.batchId}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.enterBatchId}
                placeholderTextColor="#9CA3AF"
                value={formData.batchId}
                onChangeText={(value) => handleInputChange('batchId', value)}
              />
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.label}>{t.supplier}</Text>
              <TextInput
                style={styles.input}
                placeholder={t.enterSupplierName}
                placeholderTextColor="#9CA3AF"
                value={formData.supplier}
                onChangeText={(value) => handleInputChange('supplier', value)}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t.date}</Text>
            <TextInput
              style={styles.input}
              value={formData.date}
              onChangeText={(value) => handleInputChange('date', value)}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        {/* Laboratory Assignment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.laboratoryAssignment}</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t.selectLaboratory}</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowLabModal(true)}
            >
              <Text style={[styles.dropdownText, !selectedLab && styles.placeholderText]}>
                {selectedLab ? `${selectedLab.username} (${selectedLab.organisation})` : t.selectLabPlaceholder}
              </Text>
              <Ionicons name="chevron-down-outline" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>

          {selectedLab && (
            <View style={styles.selectedLabContainer}>
              <Text style={styles.selectedLabTitle}>{t.selectedLaboratory}</Text>
              <View style={styles.selectedLabDetails}>
                <Text style={styles.selectedLabDetail}>
                  <Text style={styles.selectedLabLabel}>{t.email}</Text> {selectedLab.email}
                </Text>
                <Text style={styles.selectedLabDetail}>
                  <Text style={styles.selectedLabLabel}>{t.organization}</Text> {selectedLab.organisation}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (!selectedLab || submitLoading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!selectedLab || submitLoading}
        >
          {submitLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>{t.createTest}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Laboratory Selection Modal */}
      <Modal
        visible={showLabModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLabModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.selectLaboratory}</Text>
              <TouchableOpacity onPress={() => setShowLabModal(false)}>
                <Ionicons name="close-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {loading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator color="#10B981" />
                  <Text style={styles.modalLoadingText}>{t.loadingLaboratories}</Text>
                </View>
              ) : laboratoryUsers.length > 0 ? (
                laboratoryUsers.map((lab) => (
                  <TouchableOpacity
                    key={lab._id}
                    style={styles.labOption}
                    onPress={() => handleLabSelection(lab)}
                  >
                    <View>
                      <Text style={styles.labName}>{lab.username}</Text>
                      <Text style={styles.labEmail}>{lab.email}</Text>
                      <Text style={styles.labOrganization}>{lab.organisation}</Text>
                    </View>
                    <Ionicons name="chevron-forward-outline" size={20} color="#10B981" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.modalLoading}>
                  <Text style={styles.modalLoadingText}>{t.noLaboratoriesFound}</Text>
                </View>
              )}
            </ScrollView>
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
  header: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#10B981',
    lineHeight: 22,
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
  formContainer: {
    padding: 24,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ECFDF5',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  dropdownButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  selectedLabContainer: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  selectedLabTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 8,
  },
  selectedLabDetails: {
    gap: 4,
  },
  selectedLabDetail: {
    fontSize: 14,
    color: '#047857',
  },
  selectedLabLabel: {
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  modalContent: {
    maxHeight: 400,
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  modalLoadingText: {
    color: '#6B7280',
    fontSize: 16,
  },
  labOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  labName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  labEmail: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 2,
  },
  labOrganization: {
    fontSize: 12,
    color: '#6B7280',
  },
});