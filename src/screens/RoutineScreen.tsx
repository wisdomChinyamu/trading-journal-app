import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Platform,
  TextInput
} from 'react-native';
import { useAppContext } from '../hooks/useAppContext';
import { useTheme } from '../components/ThemeProvider';
import { 
  createRoutine, 
  updateRoutine, 
  deleteRoutine, 
  addRoutineItem, 
  updateRoutineItem, 
  deleteRoutineItem, 
  completeRoutine,
  getRoutines
} from '../services/firebaseService';
import { Routine, RoutineItem } from '../types';

export default function RoutineScreen() {
  const { colors } = useTheme();
  const { state, dispatch } = useAppContext();
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [showNewRoutineForm, setShowNewRoutineForm] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<'weekday' | 'weekend' | 'both'>('both');

  // Filter routines based on current day (weekday/weekend)
  const getFilteredRoutines = () => {
    const today = new Date();
    const isWeekend = today.getDay() === 0 || today.getDay() === 6; // Sunday=0, Saturday=6
    
    return state.routines.filter(routine => {
      if (routine.schedule === 'both') return true;
      if (routine.schedule === 'weekday' && !isWeekend) return true;
      if (routine.schedule === 'weekend' && isWeekend) return true;
      return false;
    });
  };

  // Set the first routine as active when routines load
  useEffect(() => {
    if (state.routines.length > 0 && !activeRoutine) {
      setActiveRoutine(state.routines[0]);
    }
  }, [state.routines]);

  // Reset completed items at midnight
  useEffect(() => {
    const checkAndResetDailyItems = async () => {
      if (!activeRoutine) return;
      
      // Check if we need to reset items (if last completed was yesterday or earlier)
      const now = new Date();
      const lastCompleted = activeRoutine.lastCompleted ? new Date(activeRoutine.lastCompleted) : null;
      
      if (!lastCompleted || 
          lastCompleted.getDate() !== now.getDate() || 
          lastCompleted.getMonth() !== now.getMonth() || 
          lastCompleted.getFullYear() !== now.getFullYear()) {
        
        // Reset all completed items
        try {
          for (const item of activeRoutine.items) {
            if (item.completed) {
              await updateRoutineItem(activeRoutine.id, item.id, {
                completed: false,
                completedAt: undefined,
              });
            }
          }
          
          // Refresh routines
          if (state.user?.uid) {
            const routines = await getRoutines(state.user.uid);
            dispatch({ type: 'SET_ROUTINES', payload: routines });
            
            // Update active routine
            const updatedRoutine = routines.find(r => r.id === activeRoutine.id);
            if (updatedRoutine) {
              setActiveRoutine(updatedRoutine);
            }
          }
        } catch (error) {
          console.error('Error resetting daily routine items:', error);
        }
      }
    };

    // Check on component mount and when active routine changes
    checkAndResetDailyItems();

    // Set up interval to check every hour
    const interval = setInterval(checkAndResetDailyItems, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [activeRoutine, state.user?.uid, dispatch]);

  const handleCreateRoutine = async () => {
    if (!newRoutineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    try {
      if (!state.user?.uid) {
        throw new Error('User not authenticated');
      }

      const routineId = await createRoutine(state.user.uid, newRoutineName, selectedSchedule);
      
      // Refresh routines
      const routines = await getRoutines(state.user.uid);
      dispatch({ type: 'SET_ROUTINES', payload: routines });
      
      // Set as active routine
      const newRoutine = routines.find(r => r.id === routineId);
      if (newRoutine) {
        setActiveRoutine(newRoutine);
      }
      
      // Reset form
      setNewRoutineName('');
      setShowNewRoutineForm(false);
      Alert.alert('Success', 'Routine created successfully');
    } catch (error) {
      console.error('Error creating routine:', error);
      Alert.alert('Error', 'Failed to create routine');
    }
  };

  const handleDeleteRoutine = async (routineId: string) => {
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoutine(routineId);
              
              // Refresh routines
              if (state.user?.uid) {
                const routines = await getRoutines(state.user.uid);
                dispatch({ type: 'SET_ROUTINES', payload: routines });
                
                // If we deleted the active routine, set a new one
                if (activeRoutine?.id === routineId) {
                  setActiveRoutine(routines.length > 0 ? routines[0] : null);
                }
              }
              
              Alert.alert('Success', 'Routine deleted successfully');
            } catch (error) {
              console.error('Error deleting routine:', error);
              Alert.alert('Error', 'Failed to delete routine');
            }
          }
        }
      ]
    );
  };

  const handleAddItem = async () => {
    if (!newItemText.trim()) {
      Alert.alert('Error', 'Please enter an item');
      return;
    }

    if (!activeRoutine) {
      Alert.alert('Error', 'No active routine selected');
      return;
    }

    try {
      await addRoutineItem(activeRoutine.id, {
        label: newItemText,
        category: 'Optional',
        completed: false,
      });
      
      // Refresh routines
      if (state.user?.uid) {
        const routines = await getRoutines(state.user.uid);
        dispatch({ type: 'SET_ROUTINES', payload: routines });
        
        // Update active routine
        const updatedRoutine = routines.find(r => r.id === activeRoutine.id);
        if (updatedRoutine) {
          setActiveRoutine(updatedRoutine);
        }
      }
      
      // Reset form
      setNewItemText('');
    } catch (error) {
      console.error('Error adding routine item:', error);
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleToggleItem = async (itemId: string) => {
    if (!activeRoutine) return;

    try {
      const item = activeRoutine.items.find(i => i.id === itemId);
      if (!item) return;

      await updateRoutineItem(activeRoutine.id, itemId, {
        completed: !item.completed,
        completedAt: !item.completed ? new Date() : undefined,
      });
      
      // Refresh routines
      if (state.user?.uid) {
        const routines = await getRoutines(state.user.uid);
        dispatch({ type: 'SET_ROUTINES', payload: routines });
        
        // Update active routine
        const updatedRoutine = routines.find(r => r.id === activeRoutine.id);
        if (updatedRoutine) {
          setActiveRoutine(updatedRoutine);
        }
      }
    } catch (error) {
      console.error('Error toggling routine item:', error);
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const handleCompleteRoutine = async () => {
    if (!activeRoutine) return;

    try {
      await completeRoutine(activeRoutine.id);
      
      // Refresh routines
      if (state.user?.uid) {
        const routines = await getRoutines(state.user.uid);
        dispatch({ type: 'SET_ROUTINES', payload: routines });
        
        // Update active routine
        const updatedRoutine = routines.find(r => r.id === activeRoutine.id);
        if (updatedRoutine) {
          setActiveRoutine(updatedRoutine);
        }
      }
      
      Alert.alert('Success', 'Routine completed! Streak increased.');
    } catch (error) {
      console.error('Error completing routine:', error);
      Alert.alert('Error', 'Failed to complete routine');
    }
  };

  const filteredRoutines = getFilteredRoutines();
  const completedItems = activeRoutine?.items.filter(item => item.completed).length || 0;
  const totalItems = activeRoutine?.items.length || 0;
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Trading Routines
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Build discipline with daily checklists
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Streak Banner */}
        {activeRoutine && (
          <View style={[styles.streakBanner, { backgroundColor: colors.surface }]}>
            <View style={styles.streakContent}>
              <Text style={[styles.streakEmoji]}>🔥</Text>
              <View>
                <Text style={[styles.streakLabel, { color: colors.subtext }]}>Current Streak</Text>
                <Text style={[styles.streakValue, { color: colors.highlight }]}>{activeRoutine.streak} days</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.completeButton, { backgroundColor: colors.highlight }]}
              onPress={handleCompleteRoutine}
            >
              <Text style={styles.completeButtonText}>Complete Routine</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Routine Selector */}
        <View style={styles.routineSelector}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Routines</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routineTabs}>
            {filteredRoutines.map((routine) => (
              <TouchableOpacity
                key={routine.id}
                style={[
                  styles.routineTab,
                  activeRoutine?.id === routine.id && styles.activeRoutineTab,
                  { 
                    backgroundColor: activeRoutine?.id === routine.id ? colors.highlight : colors.surface,
                    borderColor: activeRoutine?.id === routine.id ? colors.highlight : colors.neutral,
                  }
                ]}
                onPress={() => setActiveRoutine(routine)}
              >
                <Text 
                  style={[
                    styles.routineTabText,
                    { color: activeRoutine?.id === routine.id ? '#000' : colors.text }
                  ]}
                >
                  {routine.name}
                </Text>
                <Text 
                  style={[
                    styles.routineStreak,
                    { color: activeRoutine?.id === routine.id ? '#000' : colors.subtext }
                  ]}
                >
                  🔥 {routine.streak}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.newRoutineButton, { backgroundColor: colors.surface }]}
              onPress={() => setShowNewRoutineForm(true)}
            >
              <Text style={[styles.newRoutineText, { color: colors.text }]}>+ New Routine</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* New Routine Form */}
        {showNewRoutineForm && (
          <View style={[styles.newRoutineForm, { backgroundColor: colors.card }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>Create New Routine</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Routine Name</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Morning Routine, Evening Review..."
                  placeholderTextColor={colors.subtext}
                  value={newRoutineName}
                  onChangeText={setNewRoutineName}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Schedule</Text>
              <View style={styles.scheduleOptions}>
                {(['weekday', 'weekend', 'both'] as const).map((schedule) => (
                  <TouchableOpacity
                    key={schedule}
                    style={[
                      styles.scheduleOption,
                      selectedSchedule === schedule && styles.selectedScheduleOption,
                      { 
                        backgroundColor: selectedSchedule === schedule ? colors.highlight : colors.surface,
                        borderColor: selectedSchedule === schedule ? colors.highlight : colors.neutral,
                      }
                    ]}
                    onPress={() => setSelectedSchedule(schedule)}
                  >
                    <Text 
                      style={[
                        styles.scheduleText,
                        { color: selectedSchedule === schedule ? '#000' : colors.text }
                      ]}
                    >
                      {schedule.charAt(0).toUpperCase() + schedule.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  setShowNewRoutineForm(false);
                  setNewRoutineName('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.highlight }]}
                onPress={handleCreateRoutine}
              >
                <Text style={styles.createButtonText}>Create Routine</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Active Routine Content */}
        {activeRoutine ? (
          <View style={[styles.routineContent, { backgroundColor: colors.card }]}>
            <View style={styles.routineHeader}>
              <View>
                <Text style={[styles.routineName, { color: colors.text }]}>{activeRoutine.name}</Text>
                <Text style={[styles.routineSchedule, { color: colors.subtext }]}>
                  {activeRoutine.schedule === 'both' ? 'Every day' : 
                   activeRoutine.schedule === 'weekday' ? 'Weekdays only' : 'Weekends only'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteRoutine(activeRoutine.id)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarBackground, { backgroundColor: colors.surface }]} />
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    backgroundColor: colors.highlight,
                    width: `${completionPercentage}%`
                  }
                ]} 
              />
              <Text style={[styles.progressText, { color: colors.text }]}>
                {completionPercentage}% completed ({completedItems}/{totalItems})
              </Text>
            </View>
            
            {/* Add Item Form */}
            <View style={[styles.addItemForm, { backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.itemInput, { color: colors.text }]}
                placeholder="Add a new routine item..."
                placeholderTextColor={colors.subtext}
                value={newItemText}
                onChangeText={setNewItemText}
              />
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: colors.highlight }]}
                onPress={handleAddItem}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            {/* Routine Items */}
            <View style={styles.itemsContainer}>
              {activeRoutine.items.length === 0 ? (
                <View style={styles.emptyItems}>
                  <Text style={[styles.emptyItemsText, { color: colors.subtext }]}>
                    No items in this routine yet. Add your first item above.
                  </Text>
                </View>
              ) : (
                activeRoutine.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.item,
                      item.completed && styles.completedItem,
                      { backgroundColor: colors.surface }
                    ]}
                    onPress={() => handleToggleItem(item.id)}
                  >
                    <View style={[
                      styles.checkbox,
                      item.completed && styles.checked,
                      { borderColor: item.completed ? colors.highlight : colors.neutral }
                    ]}>
                      {item.completed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={[
                        styles.itemText,
                        item.completed && styles.completedItemText,
                        { color: item.completed ? colors.highlight : colors.text }
                      ]}>
                        {item.label}
                      </Text>
                      {item.completed && item.completedAt && (
                        <Text style={[styles.completedAt, { color: colors.subtext }]}>
                          Completed {item.completedAt.toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyIcon, { color: colors.subtext }]}>📋</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Routines Yet</Text>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Create your first trading routine to build consistency
            </Text>
            <TouchableOpacity
              style={[styles.createFirstButton, { backgroundColor: colors.highlight }]}
              onPress={() => setShowNewRoutineForm(true)}
            >
              <Text style={styles.createFirstButtonText}>Create Your First Routine</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  streakBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  streakLabel: {
    fontSize: 14,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  completeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  routineSelector: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  routineTabs: {
    flexDirection: 'row',
  },
  routineTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  activeRoutineTab: {
    // Styles applied conditionally
  },
  routineTabText: {
    fontWeight: '600',
    fontSize: 14,
  },
  routineStreak: {
    fontSize: 12,
    marginTop: 2,
  },
  newRoutineButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  newRoutineText: {
    fontSize: 14,
  },
  newRoutineForm: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 8,
  },
  input: {
    padding: 12,
    fontSize: 16,
  },
  scheduleOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  scheduleOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  selectedScheduleOption: {
    // Styles applied conditionally
  },
  scheduleText: {
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  routineContent: {
    borderRadius: 12,
    padding: 16,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  routineName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  routineSchedule: {
    fontSize: 14,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  progressBarContainer: {
    position: 'relative',
    height: 30,
    marginBottom: 20,
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 15,
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 30,
    borderRadius: 15,
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: '600',
  },
  addItemForm: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
  },
  itemInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  itemsContainer: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  completedItem: {
    // Styles applied conditionally
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    // Styles applied conditionally
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 4,
  },
  completedItemText: {
    textDecorationLine: 'line-through',
    // Styles applied conditionally
  },
  completedAt: {
    fontSize: 12,
  },
  emptyItems: {
    padding: 20,
    alignItems: 'center',
  },
  emptyItemsText: {
    textAlign: 'center',
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});