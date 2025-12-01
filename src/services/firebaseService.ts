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
} from "../types";

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

export function onAuthStateChange(callback: (user: any) => void) {
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

    const docRef = await addDoc(collection(db, "accounts"), {
      userId,
      name,
      startingBalance,
      currentBalance: startingBalance,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
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

    await updateDoc(doc(db, "accounts", accountId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
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
    const docRef = await addDoc(collection(db, "strategies"), {
      userId,
      name,
      checklist,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
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
    const q = query(
      collection(db, "strategies"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as Strategy)
    );
  } catch (error) {
    console.error("Error fetching strategies:", error);
    throw error;
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

      const docRef = await addDoc(collection(db, "checklist_template"), {
        userId,
        items: defaultItems,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const newDoc = await getDoc(doc(db, "checklist_template", docRef.id));
      const data = newDoc.data();

      return {
        ...data,
        id: newDoc.id,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
      } as ChecklistTemplate;
    } else {
      // Return existing template
      const docData = snapshot.docs[0].data();
      return {
        ...docData,
        id: snapshot.docs[0].id,
        createdAt: docData.createdAt?.toDate() || new Date(),
        updatedAt: docData.updatedAt?.toDate() || new Date(),
      } as ChecklistTemplate;
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

    await updateDoc(doc(db, "checklist_template", templateId), {
      items,
      updatedAt: Timestamp.now(),
    });
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

    await updateDoc(doc(db, "checklist_template", templateId), {
      items,
      updatedAt: Timestamp.now(),
    });
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

    await updateDoc(doc(db, "checklist_template", templateId), {
      items,
      updatedAt: Timestamp.now(),
    });
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

    await updateDoc(doc(db, "checklist_template", templateId), {
      items,
      updatedAt: Timestamp.now(),
    });
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
    const docRef = await addDoc(collection(db, "psychology_logs"), {
      ...logData,
      userId,
    });
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
    const docRef = await addDoc(collection(db, "trades"), {
      ...tradeData,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding trade:", error);
    throw error;
  }
}

export async function updateTrade(tradeId: string, updates: Partial<Trade>) {
  try {
    await updateDoc(doc(db, "trades", tradeId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
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