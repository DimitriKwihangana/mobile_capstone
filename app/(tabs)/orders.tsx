import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  RefreshControl,
  FlatList,
  Picker
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TypeScript interfaces
interface User {
  id: string;
  name?: string;
  email: string;
  type: string;
}

interface Order {
  _id: string;
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  buyerContact?: string;
  batchNumber: string;
  batchId?: {
    supplier?: string;
  };
  quantityOrdered: number;
  pricePerKg: number;
  totalAmount: number;
  status: string;
  orderDate: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
  sellerNotes?: string;
  deliveryAddress?: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

interface Statistic {
  _id: string;
  count: number;
  totalAmount: number;
}

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  description: string;
}

interface Filters {
  status: string;
  startDate: string;
  endDate: string;
  searchTerm: string;
  sortBy: string;
  sortOrder: string;
}

interface StatusUpdate {
  status: string;
  sellerNotes: string;
  trackingNumber: string;
  estimatedDelivery: string;
}

export default function OrderManagement() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [filters, setFilters] = useState<Filters>({
    status: '',
    startDate: '',
    endDate: '',
    searchTerm: '',
    sortBy: 'orderDate',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);
  const [statusUpdate, setStatusUpdate] = useState<StatusUpdate>({
    status: '',
    sellerNotes: '',
    trackingNumber: '',
    estimatedDelivery: ''
  });
  const [updating, setUpdating] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Status configurations
  const statusConfig: { [key: string]: StatusConfig } = {
    pending: { 
      label: 'Pending', 
      color: '#F59E0B',
      bgColor: '#FEF3C7', 
      textColor: '#92400E', 
      icon: 'time-outline',
      description: 'Awaiting confirmation from seller'
    },
    confirmed: { 
      label: 'Confirmed', 
      color: '#3B82F6',
      bgColor: '#DBEAFE', 
      textColor: '#1D4ED8', 
      icon: 'checkmark-circle-outline',
      description: 'Order confirmed, preparing for shipment'
    },
    preparing: { 
      label: 'Preparing', 
      color: '#8B5CF6',
      bgColor: '#EDE9FE', 
      textColor: '#7C3AED', 
      icon: 'cube-outline',
      description: 'Order is being prepared for shipment'
    },
    shipped: { 
      label: 'Shipped', 
      color: '#10B981',
      bgColor: '#D1FAE5', 
      textColor: '#047857', 
      icon: 'car-outline',
      description: 'Order has been shipped to buyer'
    },
    delivered: { 
      label: 'Delivered', 
      color: '#059669',
      bgColor: '#ECFDF5', 
      textColor: '#065F46', 
      icon: 'checkmark-done-outline',
      description: 'Order successfully delivered'
    },
    rejected: { 
      label: 'Rejected', 
      color: '#EF4444',
      bgColor: '#FEE2E2', 
      textColor: '#DC2626', 
      icon: 'close-circle-outline',
      description: 'Order has been rejected'
    },
    cancelled: { 
      label: 'Cancelled', 
      color: '#6B7280',
      bgColor: '#F3F4F6', 
      textColor: '#374151', 
      icon: 'ban-outline',
      description: 'Order has been cancelled'
    }
  };

  // Load user data
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
    }
  };

  // Fetch orders for seller
  const fetchOrders = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '15',
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.searchTerm && { search: filters.searchTerm }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await fetch(`https://back-cap.onrender.com/api/batches/orders/seller/${user.id}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setOrders(data.data || []);
        setStatistics(data.statistics || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.totalItems || 0);
        setError('');
      } else {
        throw new Error(data.message || 'Failed to fetch orders');
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Error connecting to server');
      setOrders([]);
      setStatistics([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [fetchOrders]);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string): void => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Handle status update
  const handleStatusUpdate = async (): Promise<void> => {
    if (!selectedOrder || updating) return;
    
    setUpdating(true);

    try {
      if (statusUpdate.status === 'shipped' && !statusUpdate.trackingNumber.trim()) {
        throw new Error('Tracking number is required when marking as shipped');
      }

      const response = await fetch(`https://back-cap.onrender.com/api/batches/orders/${selectedOrder.orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId: user?.id,
          status: statusUpdate.status,
          sellerNotes: statusUpdate.sellerNotes.trim(),
          trackingNumber: statusUpdate.trackingNumber.trim(),
          estimatedDelivery: statusUpdate.estimatedDelivery || null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', `Order status updated to ${statusConfig[statusUpdate.status]?.label || statusUpdate.status}`);
        setShowStatusModal(false);
        resetStatusUpdate();
        await fetchOrders();
      } else {
        throw new Error(data.message || 'Failed to update order status');
      }
    } catch (err: any) {
      console.error('Status update error:', err);
      Alert.alert('Error', err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  // Reset status update form
  const resetStatusUpdate = (): void => {
    setStatusUpdate({
      status: '',
      sellerNotes: '',
      trackingNumber: '',
      estimatedDelivery: ''
    });
  };

  // Open status update modal
  const openStatusModal = (order: Order, newStatus: string): void => {
    setSelectedOrder(order);
    setStatusUpdate({
      status: newStatus,
      sellerNotes: order.sellerNotes || '',
      trackingNumber: order.trackingNumber || '',
      estimatedDelivery: order.estimatedDelivery ? 
        new Date(order.estimatedDelivery).toISOString().split('T')[0] : ''
    });
    setShowStatusModal(true);
  };

  // Open order details modal
  const openOrderModal = (order: Order): void => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // Get next possible statuses based on current status
  const getNextStatuses = (currentStatus: string): string[] => {
    const workflows: { [key: string]: string[] } = {
      pending: ['confirmed', 'rejected'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      rejected: [],
      cancelled: []
    };
    return workflows[currentStatus] || [];
  };

  // Format date with error handling
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Clear all filters
  const clearFilters = (): void => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
      searchTerm: '',
      sortBy: 'orderDate',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
  };

  // Calculate statistics totals
  const totalOrders = statistics.reduce((sum, stat) => sum + (stat.count || 0), 0);
  const totalRevenue = statistics.reduce((sum, stat) => sum + (stat.totalAmount || 0), 0);

  // Render order item
  const renderOrderItem = ({ item: order }: { item: Order }) => {
    const config = statusConfig[order.status] || statusConfig.pending;
    const nextStatuses = getNextStatuses(order.status);
    
    return (
      <TouchableOpacity style={styles.orderCard} onPress={() => openOrderModal(order)}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>{order.orderId}</Text>
            <Text style={styles.buyerName}>{order.buyerName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon as any} size={16} color={config.color} />
            <Text style={[styles.statusText, { color: config.textColor }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.orderDetailRow}>
            <Text style={styles.detailLabel}>Batch:</Text>
            <Text style={styles.detailValue}>{order.batchNumber}</Text>
          </View>
          <View style={styles.orderDetailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{order.quantityOrdered} kg</Text>
          </View>
          <View style={styles.orderDetailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>{order.totalAmount.toLocaleString()} Rwf</Text>
          </View>
          <View style={styles.orderDetailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(order.orderDate)}</Text>
          </View>
        </View>

        <View style={styles.orderActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => openOrderModal(order)}>
            <Ionicons name="eye-outline" size={16} color="#3B82F6" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>
          
          {nextStatuses.length > 0 && (
            <View style={styles.statusActions}>
              {nextStatuses.slice(0, 2).map(status => {
                const statusConf = statusConfig[status];
                return (
                  <TouchableOpacity
                    key={status}
                    style={[styles.statusActionButton, { backgroundColor: statusConf.bgColor }]}
                    onPress={() => openStatusModal(order, status)}
                  >
                    <Ionicons name={statusConf.icon as any} size={14} color={statusConf.color} />
                    <Text style={[styles.statusActionText, { color: statusConf.textColor }]}>
                      {statusConf.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Order Management</Text>
          <Text style={styles.headerSubtitle}>
            Manage orders for your grain batches • {totalItems} total orders
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => setShowFiltersModal(true)}
          >
            <Ionicons name="filter-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={onRefresh}
            disabled={loading}
          >
            <Ionicons 
              name="refresh-outline" 
              size={20} 
              color="#6B7280" 
              style={loading ? { opacity: 0.5 } : {}}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="analytics-outline" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>{totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="cash-outline" size={24} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{totalRevenue.toLocaleString()} Rwf</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>

        {statistics.slice(0, 2).map((stat) => {
          const config = statusConfig[stat._id] || statusConfig.pending;
          return (
            <View key={stat._id} style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name={config.icon as any} size={24} color={config.color} />
              </View>
              <Text style={styles.statValue}>{stat.count}</Text>
              <Text style={styles.statLabel}>{config.label} Orders</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Error State */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error Loading Orders</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Orders List */}
      {!loading && !error && (
        <>
          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptyMessage}>
                {Object.values(filters).some(f => f) ? 
                  'No orders match your current filters.' : 
                  'You haven\'t received any orders yet.'
                }
              </Text>
              {Object.values(filters).some(f => f) && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                  <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={orders}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.ordersList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <Text style={styles.paginationButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <Text style={styles.paginationText}>
            Page {currentPage} of {totalPages}
          </Text>
          
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
            onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <Text style={styles.paginationButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filters Modal */}
      <Modal visible={showFiltersModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Orders</Text>
              <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                <Ionicons name="close-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Search</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Search orders, buyers..."
                  value={filters.searchTerm}
                  onChangeText={(text) => handleFilterChange('searchTerm', text)}
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.statusFilters}>
                  <TouchableOpacity
                    style={[styles.statusFilter, !filters.status && styles.statusFilterActive]}
                    onPress={() => handleFilterChange('status', '')}
                  >
                    <Text style={[styles.statusFilterText, !filters.status && styles.statusFilterTextActive]}>
                      All Statuses
                    </Text>
                  </TouchableOpacity>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <TouchableOpacity
                      key={key}
                      style={[styles.statusFilter, filters.status === key && styles.statusFilterActive]}
                      onPress={() => handleFilterChange('status', key)}
                    >
                      <Ionicons name={config.icon as any} size={16} color={config.color} />
                      <Text style={[styles.statusFilterText, filters.status === key && styles.statusFilterTextActive]}>
                        {config.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Date Range</Text>
                <View style={styles.dateFilters}>
                  <TextInput
                    style={[styles.filterInput, styles.dateInput]}
                    placeholder="Start Date (YYYY-MM-DD)"
                    value={filters.startDate}
                    onChangeText={(text) => handleFilterChange('startDate', text)}
                  />
                  <TextInput
                    style={[styles.filterInput, styles.dateInput]}
                    placeholder="End Date (YYYY-MM-DD)"
                    value={filters.endDate}
                    onChangeText={(text) => handleFilterChange('endDate', text)}
                  />
                </View>
              </View>

              <View style={styles.filterActions}>
                <TouchableOpacity style={styles.clearFiltersModalButton} onPress={clearFilters}>
                  <Text style={styles.clearFiltersModalButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyFiltersButton} 
                  onPress={() => setShowFiltersModal(false)}
                >
                  <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Order Details Modal */}
      <Modal visible={showOrderModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                <Ionicons name="close-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailSectionTitle}>Order Information</Text>
                  <View style={styles.orderDetailCard}>
                    <View style={styles.orderDetailRow}>
                      <Text style={styles.detailLabel}>Order ID:</Text>
                      <Text style={styles.detailValue}>{selectedOrder.orderId}</Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <Text style={styles.detailLabel}>Batch:</Text>
                      <Text style={styles.detailValue}>{selectedOrder.batchNumber}</Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <Text style={styles.detailLabel}>Quantity:</Text>
                      <Text style={styles.detailValue}>{selectedOrder.quantityOrdered} kg</Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <Text style={styles.detailLabel}>Price per kg:</Text>
                      <Text style={styles.detailValue}>{selectedOrder.pricePerKg} Rwf</Text>
                    </View>
                    <View style={[styles.orderDetailRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Total Amount:</Text>
                      <Text style={styles.totalValue}>{selectedOrder.totalAmount.toLocaleString()} Rwf</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailSectionTitle}>Buyer Information</Text>
                  <View style={styles.orderDetailCard}>
                    <View style={styles.buyerInfoRow}>
                      <Ionicons name="person-outline" size={16} color="#6B7280" />
                      <Text style={styles.buyerInfoText}>{selectedOrder.buyerName}</Text>
                    </View>
                    <View style={styles.buyerInfoRow}>
                      <Ionicons name="mail-outline" size={16} color="#6B7280" />
                      <Text style={styles.buyerInfoText}>{selectedOrder.buyerEmail}</Text>
                    </View>
                    {selectedOrder.buyerContact && (
                      <View style={styles.buyerInfoRow}>
                        <Ionicons name="call-outline" size={16} color="#6B7280" />
                        <Text style={styles.buyerInfoText}>{selectedOrder.buyerContact}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.orderDetailSection}>
                  <Text style={styles.orderDetailSectionTitle}>Order Status</Text>
                  <View style={styles.orderDetailCard}>
                    <View style={styles.statusRow}>
                      <Text style={styles.detailLabel}>Current Status:</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig[selectedOrder.status]?.bgColor }]}>
                        <Ionicons 
                          name={statusConfig[selectedOrder.status]?.icon as any} 
                          size={16} 
                          color={statusConfig[selectedOrder.status]?.color} 
                        />
                        <Text style={[styles.statusText, { color: statusConfig[selectedOrder.status]?.textColor }]}>
                          {statusConfig[selectedOrder.status]?.label}
                        </Text>
                      </View>
                    </View>
                    
                    {selectedOrder.trackingNumber && (
                      <View style={styles.orderDetailRow}>
                        <Text style={styles.detailLabel}>Tracking Number:</Text>
                        <Text style={styles.detailValue}>{selectedOrder.trackingNumber}</Text>
                      </View>
                    )}
                    
                    {selectedOrder.estimatedDelivery && (
                      <View style={styles.orderDetailRow}>
                        <Text style={styles.detailLabel}>Estimated Delivery:</Text>
                        <Text style={styles.detailValue}>
                          {new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {(selectedOrder.notes || selectedOrder.sellerNotes) && (
                  <View style={styles.orderDetailSection}>
                    <Text style={styles.orderDetailSectionTitle}>Notes</Text>
                    {selectedOrder.notes && (
                      <View style={styles.notesCard}>
                        <Text style={styles.notesTitle}>Buyer Notes:</Text>
                        <Text style={styles.notesText}>{selectedOrder.notes}</Text>
                      </View>
                    )}
                    {selectedOrder.sellerNotes && (
                      <View style={styles.notesCard}>
                        <Text style={styles.notesTitle}>Seller Notes:</Text>
                        <Text style={styles.notesText}>{selectedOrder.sellerNotes}</Text>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowOrderModal(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal visible={showStatusModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.statusUpdateSection}>
                <Text style={styles.statusUpdateLabel}>New Status</Text>
                <View style={[styles.statusUpdateCard, { backgroundColor: statusConfig[statusUpdate.status]?.bgColor }]}>
                  <View style={styles.statusUpdateHeader}>
                    <Ionicons 
                      name={statusConfig[statusUpdate.status]?.icon as any} 
                      size={20} 
                      color={statusConfig[statusUpdate.status]?.color} 
                    />
                    <Text style={[styles.statusUpdateTitle, { color: statusConfig[statusUpdate.status]?.textColor }]}>
                      {statusConfig[statusUpdate.status]?.label || 'Unknown Status'}
                    </Text>
                  </View>
                  <Text style={styles.statusUpdateDescription}>
                    {statusConfig[statusUpdate.status]?.description || 'Status update'}
                  </Text>
                </View>
              </View>

              {(statusUpdate.status === 'shipped' || statusUpdate.status === 'preparing') && (
                <View style={styles.statusUpdateSection}>
                  <Text style={styles.statusUpdateLabel}>
                    Tracking Number {statusUpdate.status === 'shipped' ? '(Required)' : '(Optional)'}
                  </Text>
                  <TextInput
                    style={styles.statusUpdateInput}
                    placeholder="Enter tracking number"
                    value={statusUpdate.trackingNumber}
                    onChangeText={(text) => setStatusUpdate(prev => ({ ...prev, trackingNumber: text }))}
                  />
                </View>
              )}

              {(statusUpdate.status === 'shipped' || statusUpdate.status === 'preparing') && (
                <View style={styles.statusUpdateSection}>
                  <Text style={styles.statusUpdateLabel}>Estimated Delivery Date</Text>
                  <TextInput
                    style={styles.statusUpdateInput}
                    placeholder="YYYY-MM-DD"
                    value={statusUpdate.estimatedDelivery}
                    onChangeText={(text) => setStatusUpdate(prev => ({ ...prev, estimatedDelivery: text }))}
                  />
                </View>
              )}

              <View style={styles.statusUpdateSection}>
                <Text style={styles.statusUpdateLabel}>Notes for Buyer</Text>
                <TextInput
                  style={[styles.statusUpdateInput, styles.statusUpdateTextArea]}
                  placeholder="Add any notes for the buyer..."
                  value={statusUpdate.sellerNotes}
                  onChangeText={(text) => setStatusUpdate(prev => ({ ...prev, sellerNotes: text }))}
                  multiline
                  maxLength={500}
                />
                <Text style={styles.characterCount}>
                  {statusUpdate.sellerNotes.length}/500 characters
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowStatusModal(false)}
                disabled={updating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.updateButton, updating && styles.updateButtonDisabled]} 
                onPress={handleStatusUpdate}
                disabled={updating || (statusUpdate.status === 'shipped' && !statusUpdate.trackingNumber?.trim())}
              >
                {updating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.updateButtonText}>Update Status</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  statsContainer: {
    paddingVertical: 16,
    paddingLeft: 24,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearFiltersButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  buyerName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusActionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  paginationButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  paginationText: {
    fontSize: 14,
    color: '#6B7280',
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
    width: '90%',
    maxHeight: '90%',
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
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  closeButton: {
    flex: 1,
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
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  filterInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusFilterActive: {
    backgroundColor: '#10B981',
  },
  statusFilterText: {
    fontSize: 12,
    color: '#374151',
  },
  statusFilterTextActive: {
    color: '#ffffff',
  },
  dateFilters: {
    gap: 12,
  },
  dateInput: {
    marginBottom: 0,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  clearFiltersModalButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearFiltersModalButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  orderDetailSection: {
    marginBottom: 20,
  },
  orderDetailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  orderDetailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  buyerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  buyerInfoText: {
    fontSize: 14,
    color: '#374151',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusUpdateSection: {
    marginBottom: 20,
  },
  statusUpdateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  statusUpdateCard: {
    borderRadius: 8,
    padding: 12,
  },
  statusUpdateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  statusUpdateTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusUpdateDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusUpdateInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  statusUpdateTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6B7280',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    opacity: 0.5,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});