import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  arrayUnion,
  increment,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../config/firebase";
import {
  TradingAccount,
  Strategy,
  ChecklistItem,
  PsychologyLog,
  Trade,
  ChecklistTemplate,
  Routine, // Add Routine import
  RoutineItem // Add RoutineItem import
} from "../types";

// Utility function to remove undefined values from an object
function removeUndefinedFields(obj: any): any {
  const filteredObj: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      filteredObj[key] = obj[key];
    }
  });
  return filteredObj;
}

// Helper function to check if Firebase is properly initialized
function isFirebaseInitialized(): boolean {
  try {
    return !!db && typeof db === 'object';
  } catch (error) {
    return false;
  }
}

// Helper function to check if Firebase Auth is properly initialized
function isFirebaseAuthInitialized(): boolean {
  try {
    return !!auth && typeof auth === 'object' && 'onAuthStateChanged' in auth;
  } catch (error) {
    return false;
  }
}

// ==================== AUTHENTICATION ====================

export async function signUp(email: string, password: string) {
  try {
    // Check if Firebase Auth is properly initialized
    if (!isFirebaseAuthInitialized()) {
      console.warn('Firebase Auth not properly initialized. Skipping sign up.');
      return null;
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
}

export async function login(email: string, password: string) {
  try {
    // Check if Firebase Auth is properly initialized
    if (!isFirebaseAuthInitialized()) {
      console.warn('Firebase Auth not properly initialized. Skipping login.');
      return null;
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
}

export async function logout() {
  try {
    // Check if Firebase Auth is properly initialized
    if (!isFirebaseAuthInitialized()) {
      console.warn('Firebase Auth not properly initialized. Skipping logout.');
      return;
    }
    
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
}

export async function resetPassword(email: string) {
  try {
    // Check if Firebase Auth is properly initialized
    if (!isFirebaseAuthInitialized()) {
      console.warn('Firebase Auth not properly initialized. Skipping password reset.');
      return;
    }
    
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
}

export function observeAuthState(callback: (user: any) => void) {
  // Check if Firebase Auth is properly initialized
  if (!isFirebaseAuthInitialized()) {
    console.warn('Firebase Auth not properly initialized. Skipping auth state change listener.');
    return () => {}; // Return noop unsubscribe function
  }
  
  return onAuthStateChanged(auth, callback);
}

// ==================== ACCOUNTS ====================

export async function createAccount(
  userId: string,
  name: string,
  startingBalance: number
) {
  try {
    // Check if Firebase is properly initialized
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not properly initialized. Skipping account creation.');
      return null;
    }

    // Create account data with all fields including timestamps
    const accountData = removeUndefinedFields({
      userId,
      name,
      startingBalance,
      currentBalance: startingBalance,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const docRef = await addDoc(collection(db, "accounts"), accountData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
}

export async function updateAccount(
  accountId: string,
  updates: Partial<TradingAccount>
) {
  try {
    // Check if Firebase is properly initialized
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not properly initialized. Skipping account update.');
      return;
    }

    const filteredUpdates = removeUndefinedFields({
      ...updates,
      updatedAt: Timestamp.now(),
    });

    await updateDoc(doc(db, "accounts", accountId), filteredUpdates);
  } catch (error) {
    console.error("Error updating account:", error);
    throw error;
  }
}

export async function deleteAccount(accountId: string) {
  try {
    // Check if Firebase is properly initialized
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not properly initialized. Skipping account deletion.');
      return;
    }

    await deleteDoc(doc(db, "accounts", accountId));
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
}

export async function getUserAccounts(
  userId: string
): Promise<TradingAccount[]> {
  try {
    // Check if Firebase is properly initialized
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not properly initialized. Returning empty accounts array.');
      return [];
    }

    const q = query(collection(db, "accounts"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as TradingAccount;
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
}

// ==================== STRATEGIES ====================

export async function createStrategy(
  userId: string,
  name: string,
  checklist: ChecklistItem[]
) {
  try {
    const strategyData = removeUndefinedFields({
      userId,
      name,
      checklist,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const docRef = await addDoc(collection(db, "strategies"), strategyData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating strategy:", error);
    throw error;
  }
}

export async function updateStrategy(
  strategyId: string,
  updates: Partial<Strategy>
) {
  try {
    await updateDoc(doc(db, "strategies", strategyId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating strategy:", error);
    throw error;
  }
}

export async function deleteStrategy(strategyId: string) {
  try {
    await deleteDoc(doc(db, "strategies", strategyId));
  } catch (error) {
    console.error("Error deleting strategy:", error);
    throw error;
  }
}

export async function getUserStrategies(userId: string): Promise<Strategy[]> {
  try {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not properly initialized. Returning empty strategies.');
      return [];
    }
    
    const q = query(
      collection(db, "strategies"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Strategy));
  } catch (error) {
    console.error("Error fetching user strategies:", error);
    return [];
  }
}

// ==================== CHECKLIST TEMPLATE ====================

export async function getOrCreateChecklistTemplate(
  userId: string
): Promise<ChecklistTemplate> {
  try {
    const q = query(
      collection(db, "checklist_template"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Create default template if none exists
      const defaultItems: ChecklistItem[] = [
        {
          id: "item-1",
          label: "Market Structure",
          description: "Confirmed market structure (HH/HL or LH/LL)",
          category: "Critical",
          weight: 25,
          createdAt: new Date(),
        },
        {
          id: "item-2",
          label: "Liquidity Zones",
          description: "Identified institutional liquidity zones",
          category: "Critical",
          weight: 25,
          createdAt: new Date(),
        },
        {
          id: "item-3",
          label: "Macro Confluence",
          description: "Verified confluence with macro data/events",
          category: "Important",
          weight: 20,
          createdAt: new Date(),
        },
        {
          id: "item-4",
          label: "Risk Management",
          description: "Defined clear risk management parameters",
          category: "Critical",
          weight: 20,
          createdAt: new Date(),
        },
        {
          id: "item-5",
          label: "Market Sentiment",
          description: "Assessed market sentiment and positioning",
          category: "Important",
          weight: 10,
          createdAt: new Date(),
        },
      ];

      const templateData = removeUndefinedFields({
        userId,
        items: defaultItems,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const docRef = await addDoc(collection(db, "checklist_template"), templateData);

      const newDoc = await getDoc(doc(db, "checklist_template", docRef.id));
      const data = newDoc.data();

      return {
        ...data,
        id: newDoc.id,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
      } as any as ChecklistTemplate;
    } else {
      // Return existing template
      const docData = snapshot.docs[0].data();
      return {
        ...docData,
        id: snapshot.docs[0].id,
        createdAt: docData.createdAt?.toDate() || new Date(),
        updatedAt: docData.updatedAt?.toDate() || new Date(),
      } as any as ChecklistTemplate;
    }
  } catch (error) {
    console.error("Error getting or creating checklist template:", error);
    throw error;
  }
}

export async function updateChecklistTemplate(
  templateId: string,
  items: ChecklistItem[]
) {
  try {
    const template = await getDoc(doc(db, "checklist_template", templateId));
    if (!template.exists()) throw new Error("Template not found");

    const updateData = removeUndefinedFields({
      items,
      updatedAt: Timestamp.now(),
    });

    await updateDoc(doc(db, "checklist_template", templateId), updateData);
  } catch (error) {
    console.error("Error updating checklist template:", error);
    throw error;
  }
}

export async function addChecklistItem(
  templateId: string,
  item: Omit<ChecklistItem, "id">
) {
  try {
    const template = await getDoc(doc(db, "checklist_template", templateId));
    if (!template.exists()) throw new Error("Template not found");

    const items = [...(template.data().items || []), { ...item, id: `item-${Date.now()}` }];
    
    const updateData = removeUndefinedFields({
      items,
      updatedAt: Timestamp.now(),
    });

    await updateDoc(doc(db, "checklist_template", templateId), updateData);
  } catch (error) {
    console.error("Error adding checklist item:", error);
    throw error;
  }
}

export async function updateChecklistItem(
  templateId: string,
  item: ChecklistItem
) {
  try {
    const template = await getDoc(doc(db, "checklist_template", templateId));
    if (!template.exists()) throw new Error("Template not found");

    const items = (template.data().items || []).map((i: ChecklistItem) =>
      i.id === item.id ? item : i
    );
    
    const updateData = removeUndefinedFields({
      items,
      updatedAt: Timestamp.now(),
    });

    await updateDoc(doc(db, "checklist_template", templateId), updateData);
  } catch (error) {
    console.error("Error updating checklist item:", error);
    throw error;
  }
}

export async function deleteChecklistItem(templateId: string, itemId: string) {
  try {
    const template = await getDoc(doc(db, "checklist_template", templateId));
    if (!template.exists()) throw new Error("Template not found");

    const items = (template.data().items || []).filter(
      (i: ChecklistItem) => i.id !== itemId
    );
    
    const updateData = removeUndefinedFields({
      items,
      updatedAt: Timestamp.now(),
    });

    await updateDoc(doc(db, "checklist_template", templateId), updateData);
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    throw error;
  }
}

// ==================== PSYCHOLOGY LOGS ====================

export async function addPsychologyLog(
  userId: string,
  logData: Omit<PsychologyLog, "id">
) {
  try {
    const filteredLogData = removeUndefinedFields({
      ...logData,
      userId,
    });
    
    const docRef = await addDoc(collection(db, "psychology_logs"), filteredLogData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding psychology log:", error);
    throw error;
  }
}

export async function getUserPsychologyLogs(
  userId: string
): Promise<PsychologyLog[]> {
  try {
    const q = query(
      collection(db, "psychology_logs"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
        } as PsychologyLog)
    );
  } catch (error) {
    console.error("Error fetching psychology logs:", error);
    throw error;
  }
}

// ==================== TRADES ====================

export async function addTrade(userId: string, tradeData: Omit<Trade, "id">) {
  try {
    const filteredTradeData = removeUndefinedFields({
      ...tradeData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    const docRef = await addDoc(collection(db, "trades"), filteredTradeData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding trade:", error);
    throw error;
  }
}

export async function updateTrade(tradeId: string, updates: Partial<Trade>) {
  try {
    const filteredUpdates = removeUndefinedFields({
      ...updates,
      updatedAt: Timestamp.now(),
    });
    
    await updateDoc(doc(db, "trades", tradeId), filteredUpdates);
  } catch (error) {
    console.error("Error updating trade:", error);
    throw error;
  }
}

export async function deleteTrade(tradeId: string) {
  try {
    await deleteDoc(doc(db, "trades", tradeId));
  } catch (error) {
    console.error("Error deleting trade:", error);
    throw error;
  }
}

export async function getUserTrades(userId: string): Promise<Trade[]> {
  try {
    const q = query(collection(db, "trades"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Trade;
    });
  } catch (error) {
    console.error("Error fetching trades:", error);
    throw error;
  }
}

// ==================== ROUTINES ====================

export async function createRoutine(
  userId: string,
  name: string,
  schedule: 'weekday' | 'weekend' | 'both' = 'both'
) {
  try {
    const routineData = removeUndefinedFields({
      userId,
      name,
      items: [],
      schedule,
      streak: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    const docRef = await addDoc(collection(db, "routines"), routineData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating routine:", error);
    throw error;
  }
}

export async function getRoutines(userId: string): Promise<Routine[]> {
  try {
    const q = query(collection(db, "routines"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      // Process items to ensure proper date conversion
      const items = (data.items || []).map((item: any) => ({
        ...item,
        completedAt: item.completedAt?.toDate ? item.completedAt.toDate() : item.completedAt || undefined
      }));
      
      return {
        ...data,
        id: doc.id,
        items,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt || new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt || new Date(),
        lastCompleted: data.lastCompleted?.toDate ? data.lastCompleted.toDate() : data.lastCompleted || undefined,
      } as Routine;
    });
  } catch (error) {
    console.error("Error fetching routines:", error);
    throw error;
  }
}

export async function updateRoutine(
  routineId: string,
  updates: Partial<Routine>
) {
  try {
    const filteredUpdates = removeUndefinedFields({
      ...updates,
      updatedAt: Timestamp.now(),
    });
    
    await updateDoc(doc(db, "routines", routineId), filteredUpdates);
  } catch (error) {
    console.error("Error updating routine:", error);
    throw error;
  }
}

export async function deleteRoutine(routineId: string) {
  try {
    await deleteDoc(doc(db, "routines", routineId));
  } catch (error) {
    console.error("Error deleting routine:", error);
    throw error;
  }
}

export async function addRoutineItem(
  routineId: string,
  item: Omit<RoutineItem, 'id'>
) {
  try {
    // Create a new item with proper ID
    const newItem: any = {
      ...item,
      id: `item-${Date.now()}`,
    };
    
    // Convert completedAt to Timestamp if it exists
    if (newItem.completedAt && newItem.completedAt instanceof Date) {
      newItem.completedAt = Timestamp.fromDate(newItem.completedAt);
    }
    
    const routineRef = doc(db, "routines", routineId);
    const routineDoc = await getDoc(routineRef);
    
    if (!routineDoc.exists()) {
      throw new Error("Routine not found");
    }
    
    const routine = routineDoc.data();
    const updatedItems = [...(routine.items || []), newItem];
    
    const updateData = removeUndefinedFields({
      items: updatedItems,
      updatedAt: Timestamp.now(),
    });
    
    await updateDoc(routineRef, updateData);
    
    return newItem.id;
  } catch (error) {
    console.error("Error adding routine item:", error);
    throw error;
  }
}

export async function updateRoutineItem(
  routineId: string,
  itemId: string,
  updates: Partial<RoutineItem>
) {
  try {
    const routineRef = doc(db, "routines", routineId);
    const routineDoc = await getDoc(routineRef);
    
    if (!routineDoc.exists()) {
      throw new Error("Routine not found");
    }
    
    const routine = routineDoc.data();
    const updatedItems = routine.items.map((item: any) => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    
    // Convert completedAt to Timestamp if it exists
    const finalUpdatedItems = updatedItems.map((item: any) => {
      if (item.completedAt && item.completedAt instanceof Date) {
        return {
          ...item,
          completedAt: Timestamp.fromDate(item.completedAt)
        };
      }
      return item;
    });
    
    const updateData = removeUndefinedFields({
      items: finalUpdatedItems,
      updatedAt: Timestamp.now(),
    });
    
    await updateDoc(routineRef, updateData);
  } catch (error) {
    console.error("Error updating routine item:", error);
    throw error;
  }
}

export async function deleteRoutineItem(routineId: string, itemId: string) {
  try {
    const routineRef = doc(db, "routines", routineId);
    const routineDoc = await getDoc(routineRef);
    
    if (!routineDoc.exists()) {
      throw new Error("Routine not found");
    }
    
    const routine = routineDoc.data();
    const updatedItems = (routine.items || []).filter((item: any) => item.id !== itemId);
    
    const updateData = removeUndefinedFields({
      items: updatedItems,
      updatedAt: Timestamp.now(),
    });
    
    await updateDoc(routineRef, updateData);
  } catch (error) {
    console.error("Error deleting routine item:", error);
    throw error;
  }
}

export async function completeRoutine(routineId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const updateData = removeUndefinedFields({
      streak: increment(1),
      lastCompleted: Timestamp.fromDate(today),
      updatedAt: Timestamp.now(),
    });
    
    await updateDoc(doc(db, "routines", routineId), updateData);
  } catch (error) {
    console.error("Error completing routine:", error);
    throw error;
  }
}

// ==================== FILE UPLOADS (DEPRECATED - NOW USING SUPABASE) ====================
// These functions have been deprecated in favor of Supabase Storage functions
// See src/services/supabaseImageService.ts for the new implementation

export async function uploadTradeScreenshot(
  userId: string,
  tradeId: string,
  imageUri: string
): Promise<string | null> {
  console.warn("uploadTradeScreenshot is deprecated. Use uploadTradeImage from supabaseImageService instead.");
  return null;
}

export async function deleteTradeScreenshot(screenshotUrl: string): Promise<void> {
  console.warn("deleteTradeScreenshot is deprecated. Use deleteTradeImage from supabaseImageService instead.");
}