import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  orderBy,
  limit,
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
  RoutineItem, // Add RoutineItem import
} from "../types";

// Utility function to remove undefined values from an object
function removeUndefinedFields(obj: any): any {
  const filteredObj: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      filteredObj[key] = obj[key];
    }
  });
  return filteredObj;
}

// Helper function to check if Firebase is properly initialized
function isFirebaseInitialized(): boolean {
  try {
    return !!db && typeof db === "object";
  } catch (error) {
    return false;
  }
}

// Helper function to check if Firebase Auth is properly initialized
function isFirebaseAuthInitialized(): boolean {
  try {
    return !!auth && typeof auth === "object" && "onAuthStateChanged" in auth;
  } catch (error) {
    return false;
  }
}

// ==================== AUTHENTICATION ====================

export async function signUp(email: string, password: string) {
  try {
    // Check if Firebase Auth is properly initialized
    if (!isFirebaseAuthInitialized()) {
      console.warn("Firebase Auth not properly initialized. Skipping sign up.");
      return null;
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
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
      console.warn("Firebase Auth not properly initialized. Skipping login.");
      return null;
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
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
      console.warn("Firebase Auth not properly initialized. Skipping logout.");
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
      console.warn(
        "Firebase Auth not properly initialized. Skipping password reset."
      );
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
    console.warn(
      "Firebase Auth not properly initialized. Skipping auth state change listener."
    );
    return () => {}; // Return noop unsubscribe function
  }

  return onAuthStateChanged(auth, callback);
}

// Create a user profile document (stores display name and optional fields)
export async function createUserProfile(
  userId: string,
  profile: {
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    timezone?: string;
    displayPreference?: string;
  }
) {
  try {
    if (!isFirebaseInitialized()) {
      console.warn(
        "Firebase not properly initialized. Skipping createUserProfile."
      );
      return;
    }

    const payload: any = removeUndefinedFields({
      uid: userId,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      displayPreference: profile.displayPreference,
      timezone:
        profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await setDoc(doc(db, "users", userId), payload, { merge: true });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}

// ==================== ACCOUNTS ====================

export async function createAccount(
  userId: string,
  name: string,
  startingBalance: number,
  accountType: "demo" | "live" = "demo"
) {
  try {
    // Check if Firebase is properly initialized
    if (!isFirebaseInitialized()) {
      console.warn(
        "Firebase not properly initialized. Skipping account creation."
      );
      return null;
    }

    // Ensure Auth is available and user is authenticated. Use the authenticated
    // user's UID as the account owner to avoid permission mismatches with
    // Firestore security rules that require request.auth.uid === userId.
    if (!isFirebaseAuthInitialized()) {
      throw new Error("Firebase Auth not initialized. Cannot create account.");
    }

    const currentUid = auth?.currentUser?.uid;
    if (!currentUid) {
      throw new Error("No authenticated user found. Cannot create account.");
    }

    if (userId && userId !== currentUid) {
      console.warn(
        `createAccount called with userId=${userId} but auth.currentUser.uid=${currentUid}. Using authenticated UID.`
      );
    }

    const finalUserId = currentUid;

    // Create account data with all fields including timestamps
    const accountData = removeUndefinedFields({
      userId: finalUserId,
      name,
      startingBalance,
      currentBalance: startingBalance,
      type: accountType,
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
      console.warn(
        "Firebase not properly initialized. Skipping account update."
      );
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

// ==================== ACCOUNT TRANSACTIONS ====================

export async function addAccountTransaction(
  userId: string,
  accountId: string,
  type: "deposit" | "withdrawal",
  amount: number,
  balanceAfter: number
) {
  try {
    if (!isFirebaseInitialized()) {
      console.warn(
        "Firebase not properly initialized. Skipping addAccountTransaction."
      );
      return null;
    }

    const payload = removeUndefinedFields({
      userId,
      accountId,
      type,
      amount,
      balanceAfter,
      createdAt: Timestamp.now(),
    });

    const docRef = await addDoc(collection(db, "transactions"), payload);
    return docRef.id;
  } catch (error) {
    console.error("Error adding account transaction:", error);
    throw error;
  }
}

export async function getAccountTransactions(
  accountId: string,
  maxResults: number = 10
) {
  try {
    if (!isFirebaseInitialized()) {
      console.warn(
        "Firebase not properly initialized. Returning empty transactions."
      );
      return [];
    }

    // First, verify that the user has access to this account
    // This prevents attempts to access transactions for accounts the user doesn't own
    const accountRef = doc(db, "accounts", accountId);
    const accountSnap = await getDoc(accountRef);

    if (!accountSnap.exists()) {
      console.warn(`Account with ID ${accountId} does not exist`);
      return [];
    }

    const accountData = accountSnap.data();
    if (accountData.userId !== auth.currentUser?.uid) {
      console.warn(`User does not own account with ID ${accountId}`);
      return [];
    }

    // Primary query by accountId field. Wrap in try/catch to detect missing composite index errors
    const q = query(
      collection(db, "transactions"),
      where("accountId", "==", accountId),
      where("userId", "==", auth.currentUser?.uid), // Additional safety check
      orderBy("createdAt", "desc"),
      limit(maxResults)
    );

    try {
      const snapshot = await getDocs(q);
      if (snapshot && snapshot.docs && snapshot.docs.length > 0) {
        return snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate
            ? d.data().createdAt.toDate()
            : d.data().createdAt || new Date(),
        }));
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (
        msg.includes("requires an index") ||
        msg.toLowerCase().includes("index")
      ) {
        console.error("Firestore query requires a composite index:", msg);
        // Try to extract the index creation URL that Firebase includes in the error message
        const urlMatch = msg.match(/https?:\/\/[^\s)]+/);
        if (urlMatch) console.error("Create the index at:", urlMatch[0]);

        // Fallback: fetch a larger recent set ordered by createdAt (no where filters), then filter client-side.
        // This avoids relying on a composite index while still returning recent, relevant transactions.
        try {
          const fallbackLimit = Math.max(maxResults * 20, 200);
          const fallbackQ = query(
            collection(db, "transactions"),
            orderBy("createdAt", "desc"),
            limit(fallbackLimit)
          );
          const fallbackSnap = await getDocs(fallbackQ);
          const filtered = fallbackSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((row: any) => {
              const acctVal =
                row.accountId ||
                row.account ||
                row.account_id ||
                row.accountRef ||
                null;
              return (
                String(row.userId) === String(auth.currentUser?.uid) &&
                String(acctVal) === String(accountId)
              );
            })
            .slice(0, maxResults)
            .map((d: any) => ({
              id: d.id,
              ...d,
              createdAt: d.createdAt?.toDate
                ? d.createdAt.toDate()
                : d.createdAt || new Date(),
            }));

          return filtered;
        } catch (fallbackErr) {
          console.error("Fallback fetch also failed:", fallbackErr);
          return [];
        }
      }

      // If it's not an index error, rethrow or log and continue to the broader fallback below
      console.error("Error executing primary transactions query:", err);
    }

    // Fallback: some transactions may use a different field name. Fetch recent transactions and filter client-side.
    const broadQ = query(
      collection(db, "transactions"),
      where("userId", "==", auth.currentUser?.uid), // Ensure we only get user's own transactions
      orderBy("createdAt", "desc"),
      limit(Math.max(maxResults * 3, 50))
    );
    const broadSnap = await getDocs(broadQ);
    const candidates = broadSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((row: any) => {
        const v =
          row.accountId ||
          row.account ||
          row.account_id ||
          row.accountRef ||
          null;
        return String(v) === String(accountId);
      })
      .slice(0, maxResults)
      .map((d: any) => ({
        id: d.id,
        ...d,
        createdAt: d.createdAt?.toDate
          ? d.createdAt.toDate()
          : d.createdAt || new Date(),
      }));

    return candidates;
  } catch (error) {
    console.error("Error fetching account transactions:", error);
    return [];
  }
}

export async function deleteAccount(accountId: string) {
  try {
    // Check if Firebase is properly initialized
    if (!isFirebaseInitialized()) {
      console.warn(
        "Firebase not properly initialized. Skipping account deletion."
      );
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
      console.warn(
        "Firebase not properly initialized. Returning empty accounts array."
      );
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
    console.warn("deleteStrategy called for id:", strategyId);
    if (!isFirebaseInitialized()) {
      throw new Error("Firebase not initialized");
    }
    await deleteDoc(doc(db, "strategies", strategyId));
    return true;
  } catch (error) {
    console.error("Error deleting strategy:", error);
    throw error;
  }
}

export async function getUserStrategies(userId: string): Promise<Strategy[]> {
  try {
    if (!isFirebaseInitialized()) {
      console.warn(
        "Firebase not properly initialized. Returning empty strategies."
      );
      return [];
    }

    const q = query(
      collection(db, "strategies"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Strategy)
    );
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

      const docRef = await addDoc(
        collection(db, "checklist_template"),
        templateData
      );

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

    const items = [
      ...(template.data().items || []),
      { ...item, id: `item-${Date.now()}` },
    ];

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
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const docRef = await addDoc(
      collection(db, "psychology_logs"),
      filteredLogData
    );
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
    console.warn("deleteTrade called for id:", tradeId);
    // Guard against uninitialized Firebase (fallback in config sets empty objects)
    if (!db || (typeof db === "object" && Object.keys(db).length === 0)) {
      throw new Error(
        "Firebase not initialized. Missing Firebase configuration (EXPO_PUBLIC_FIREBASE_* env vars)."
      );
    }
    await deleteDoc(doc(db, "trades", tradeId));
    return true;
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

export async function getUserProfile(userId: string) {
  try {
    if (!isFirebaseInitialized()) {
      console.warn(
        "Firebase not properly initialized. Returning null profile."
      );
      return null;
    }
    const docRef = doc(db, "users", userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid: data.uid || userId,
      email: data.email || undefined,
      username: data.username || undefined,
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
      timezone: data.timezone || undefined,
      displayPreference: data.displayPreference || undefined,
      createdAt: data.createdAt?.toDate
        ? data.createdAt.toDate()
        : data.createdAt || new Date(),
    } as any;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: any) {
  try {
    if (!isFirebaseInitialized()) {
      console.warn("Firebase not properly initialized. Skipping updateUserProfile.");
      return null;
    }
    const filtered = removeUndefinedFields({ ...updates, updatedAt: Timestamp.now() });
    await updateDoc(doc(db, "users", userId), filtered);
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

// ==================== ROUTINES ====================

// Helper: return true if given date is a scheduled day for the routine
export function isScheduledDay(
  date: Date,
  schedule: "weekday" | "weekend" | "both"
) {
  const d = new Date(date);
  const day = d.getDay();
  if (schedule === "both") return true;
  if (schedule === "weekday") return day !== 0 && day !== 6;
  return day === 0 || day === 6;
}

// How many scheduled-days gap to tolerate before considering the streak broken.
// Default of 1 means: lastCompleted -> today with exactly 1 scheduled-day gap is treated as consecutive.
// Module-level streak reset threshold. Default set to 1 (can be overridden via settings).
export let STREAK_RESET_THRESHOLD = 1;

export function setStreakResetThreshold(v: number) {
  STREAK_RESET_THRESHOLD = Number(v) || 0;
}

// Count how many scheduled days occur in the (startDate, endDate] range
export function countScheduledDaysBetween(
  startDate: Date,
  endDate: Date,
  schedule: "weekday" | "weekend" | "both"
) {
  const s = new Date(startDate);
  s.setHours(0, 0, 0, 0);
  const e = new Date(endDate);
  e.setHours(0, 0, 0, 0);
  let count = 0;
  const cursor = new Date(s);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor.getTime() <= e.getTime()) {
    if (isScheduledDay(cursor, schedule)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export async function createRoutine(
  userId: string,
  name: string,
  schedule: "weekday" | "weekend" | "both" = "both"
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
        completedAt: item.completedAt?.toDate
          ? item.completedAt.toDate()
          : item.completedAt || undefined,
      }));

      return {
        ...data,
        id: doc.id,
        items,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt || new Date(),
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : data.updatedAt || new Date(),
        lastCompleted: data.lastCompleted?.toDate
          ? data.lastCompleted.toDate()
          : data.lastCompleted || undefined,
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
    console.warn("deleteRoutine called for id:", routineId);
    await deleteDoc(doc(db, "routines", routineId));
    return true;
  } catch (error) {
    console.error("Error deleting routine:", error);
    throw error;
  }
}

export async function addRoutineItem(
  routineId: string,
  item: Omit<RoutineItem, "id">
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
          completedAt: Timestamp.fromDate(item.completedAt),
        };
      }
      return item;
    });

    // Clean each item to remove any undefined fields inside the items array
    const cleanedItems = finalUpdatedItems.map((item: any) =>
      removeUndefinedFields(item)
    );

    const updateData: any = removeUndefinedFields({
      items: cleanedItems,
      updatedAt: Timestamp.now(),
    });

    // If user unchecked an item, reset the routine streak and clear lastCompleted
    // If the user explicitly unchecks an item, do not aggressively reset the
    // whole routine streak here. Streak resets are handled elsewhere based on
    // missed scheduled days. Removing the earlier behavior prevents quick
    // disappearing toggles when the streak is 1.

    // If after this update all items are completed (user manually checked the last item),
    // increment the streak similar to `completeRoutine` and set lastCompleted to today.
    const allCompletedNow =
      cleanedItems.length > 0 &&
      cleanedItems.every((i: any) => i.completed === true);
    const wereAllCompletedBefore =
      (routine.items || []).length > 0 &&
      (routine.items || []).every((i: any) => i.completed === true);

    if (allCompletedNow && !wereAllCompletedBefore) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastCompletedTs = routine.lastCompleted
        ? routine.lastCompleted.toDate
          ? routine.lastCompleted.toDate()
          : new Date(routine.lastCompleted)
        : null;
      let newStreak = 1;

      if (lastCompletedTs) {
        const lastCompDate = new Date(lastCompletedTs);
        lastCompDate.setHours(0, 0, 0, 0);
        // Count scheduled days between last completed and today according to routine.schedule
        const scheduledCount = countScheduledDaysBetween(
          lastCompDate,
          today,
          routine.schedule || "both"
        );

        if (scheduledCount === STREAK_RESET_THRESHOLD) {
          newStreak = (routine.streak || 0) + 1;
        } else if (scheduledCount === 0) {
          newStreak = routine.streak || 1;
        } else {
          newStreak = 1;
        }
      }

      updateData.streak = newStreak;
      updateData.lastCompleted = Timestamp.fromDate(today);
    }

    // If items were all completed before and now are not, consider decrementing streak
    const becameIncomplete = !allCompletedNow && wereAllCompletedBefore;
    if (becameIncomplete) {
      // Only decrement if the routine was marked completed today (i.e. user is undoing today's completion)
      const lastCompletedTs = routine.lastCompleted
        ? routine.lastCompleted.toDate
          ? routine.lastCompleted.toDate()
          : new Date(routine.lastCompleted)
        : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let shouldDecrement = false;
      if (lastCompletedTs) {
        const lastCompDate = new Date(lastCompletedTs);
        lastCompDate.setHours(0, 0, 0, 0);
        if (lastCompDate.getTime() === today.getTime()) {
          shouldDecrement = true;
        }
      }

      if (shouldDecrement) {
        const currentStreak = routine.streak || 0;
        const newStreak = Math.max(0, currentStreak - 1);
        updateData.streak = newStreak;
        // Clear lastCompleted so next completion will set appropriately
        updateData.lastCompleted = null;
      }
      // If lastCompleted was not today, do not change the streak (editing historical items should not affect streak)
    }

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
    const updatedItems = (routine.items || []).filter(
      (item: any) => item.id !== itemId
    );

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
    const routineRef = doc(db, "routines", routineId);
    const routineDoc = await getDoc(routineRef);

    if (!routineDoc.exists()) {
      throw new Error("Routine not found");
    }

    const routine = routineDoc.data();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the last completed date
    const lastCompleted = routine.lastCompleted
      ? routine.lastCompleted.toDate
        ? routine.lastCompleted.toDate()
        : new Date(routine.lastCompleted)
      : null;

    let newStreak = 1; // Default to 1 if it's the first time or no consecutive day

    if (lastCompleted) {
      const lastCompDate = new Date(lastCompleted);
      lastCompDate.setHours(0, 0, 0, 0);
      const scheduledCount = countScheduledDaysBetween(
        lastCompDate,
        today,
        routine.schedule || "both"
      );

      // If scheduledCount equals the configured threshold we treat this as
      // consecutive (increase streak). If it's 0, it's the same day (keep
      // previous streak). If it's greater than the threshold, treat as a
      // missed scheduled day(s) and start a new streak (1).
      if (scheduledCount === STREAK_RESET_THRESHOLD) {
        newStreak = (routine.streak || 0) + 1;
      } else if (scheduledCount === 0) {
        newStreak = routine.streak || 1;
      } else {
        newStreak = 1;
      }
    }

    const updateData = removeUndefinedFields({
      streak: newStreak,
      lastCompleted: Timestamp.fromDate(today),
      // Mark all items as completed and set completedAt to today
      items: (routine.items || []).map((item: any) =>
        removeUndefinedFields({
          ...item,
          completed: true,
          completedAt: Timestamp.fromDate(today),
        })
      ),
      updatedAt: Timestamp.now(),
    });

    await updateDoc(routineRef, updateData);
    return true;
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
  console.warn(
    "uploadTradeScreenshot is deprecated. Use uploadTradeImage from supabaseImageService instead."
  );
  return null;
}

export async function deleteTradeScreenshot(
  screenshotUrl: string
): Promise<void> {
  console.warn(
    "deleteTradeScreenshot is deprecated. Use deleteTradeImage from supabaseImageService instead."
  );
}
