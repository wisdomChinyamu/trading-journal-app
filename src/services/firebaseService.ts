// ==================== ACCOUNTS ====================

import { TradingAccount } from "../types";

export async function createAccount(
  userId: string,
  name: string,
  startingBalance: number
) {
  try {
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

import { Strategy } from "../types";

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
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Strategy;
    });
  } catch (error) {
    console.error("Error fetching strategies:", error);
    throw error;
  }
}
import { db, storage } from "../config/firebase";
import { auth as firebaseAuth } from "../config/firebase";
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
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  Trade,
  ChecklistTemplate,
  ChecklistItem,
  PsychologyLog,
} from "../types";

// ==================== TRADES ====================

export const auth = firebaseAuth;

export async function addTrade(
  userId: string,
  tradeData: Omit<Trade, "id" | "createdAt" | "updatedAt">
) {
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

export async function getTrade(tradeId: string): Promise<Trade | null> {
  try {
    const snapshot = await getDoc(doc(db, "trades", tradeId));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Trade;
  } catch (error) {
    console.error("Error fetching trade:", error);
    throw error;
  }
}

// ==================== CHECKLIST TEMPLATES ====================

export async function createChecklistTemplate(
  userId: string,
  items: Omit<ChecklistItem, "id" | "createdAt">[]
) {
  try {
    const itemsWithIds = items.map((item) => ({
      ...item,
      id: doc(collection(db, "dummy")).id,
      createdAt: Timestamp.now(),
    }));

    const docRef = await addDoc(collection(db, "checklist_template"), {
      userId,
      items: itemsWithIds,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating checklist template:", error);
    throw error;
  }
}

export async function updateChecklistTemplate(
  templateId: string,
  items: ChecklistItem[]
) {
  try {
    await updateDoc(doc(db, "checklist_template", templateId), {
      items,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating checklist template:", error);
    throw error;
  }
}

export async function getUserChecklistTemplate(
  userId: string
): Promise<ChecklistTemplate | null> {
  try {
    const q = query(
      collection(db, "checklist_template"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      items: data.items || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as ChecklistTemplate;
  } catch (error) {
    console.error("Error fetching checklist template:", error);
    throw error;
  }
}

export async function addChecklistItem(
  templateId: string,
  item: Omit<ChecklistItem, "id" | "createdAt">
) {
  try {
    const template = await getDoc(doc(db, "checklist_template", templateId));
    if (!template.exists()) throw new Error("Template not found");

    const newItem: ChecklistItem = {
      ...item,
      id: doc(collection(db, "dummy")).id,
      createdAt: new Date(),
    };

    const items = template.data().items || [];
    items.push(newItem);

    await updateDoc(doc(db, "checklist_template", templateId), {
      items,
      updatedAt: Timestamp.now(),
    });

    return newItem.id;
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
