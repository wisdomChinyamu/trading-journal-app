import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useAppContext } from "../hooks/useAppContext";
import {
  listNotePages,
  createNotePage,
  updateNotePage,
  deleteNotePage,
} from "../services/firebaseService";
import { NotePage } from "../types/notes";

// EditablePage component for inline editing of page titles
const EditablePage = ({ page, onUpdate }: { page: NotePage, onUpdate: (updatedPage: NotePage) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(page.title);
  
  const handleSave = () => {
    const updatedPage = {
      ...page,
      title
    };
    onUpdate(updatedPage);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <View style={styles.editablePageContainer}>
        <TextInput
          style={styles.editableInput}
          value={title}
          onChangeText={setTitle}
          onBlur={handleSave}
          onSubmitEditing={handleSave}
          multiline={false}
          autoFocus
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>✓</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.pageRow} 
      onPress={() => setIsEditing(true)}
      onLongPress={() => setIsEditing(true)}
    >
      <Text style={styles.pageIcon}>{page.icon || "📄"}</Text>
      <Text style={styles.pageTitle}>{page.title}</Text>
    </TouchableOpacity>
  );
};

export default function NotesPageList({
  onSelectPage,
}: {
  onSelectPage: (page: NotePage) => void;
}) {
  const { state } = useAppContext();
  const userId = state.user?.uid;
  const [pages, setPages] = useState<NotePage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPages = async () => {
    if (!userId) return;
    setLoading(true);
    const data = await listNotePages(userId);
    setPages(
      data.map((d: any) => ({
        pageId: d.pageId,
        ownerId: d.ownerId,
        parentPageId: d.parentPageId ?? null,
        title: d.title,
        icon: d.icon ?? null,
        cover: d.cover ?? null,
        order: d.order ?? 0,
        isArchived: d.isArchived ?? false,
        createdAt: d.createdAt?.toDate
          ? d.createdAt.toDate()
          : new Date(d.createdAt),
        updatedAt: d.updatedAt?.toDate
          ? d.updatedAt.toDate()
          : new Date(d.updatedAt),
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchPages();
  }, [userId]);

  const handleAddPage = async () => {
    if (!userId) return;
    const title = `Untitled`;
    await createNotePage(userId, {
      title,
      order: pages.length,
      isArchived: false,
    });
    fetchPages();
  };

  const handleUpdatePage = async (updatedPage: NotePage) => {
    if (!userId) return;
    
    // Update local state optimistically
    setPages(prevPages => 
      prevPages.map(page => 
        page.pageId === updatedPage.pageId ? updatedPage : page
      )
    );
    
    // Update in Firebase
    await updateNotePage(userId, updatedPage.pageId, {
      title: updatedPage.title,
      updatedAt: new Date(),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Pages</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddPage}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#00d4d4" />
      ) : (
        <FlatList
          data={pages}
          keyExtractor={(item) => item.pageId}
          renderItem={({ item }) => (
            <EditablePage page={item} onUpdate={handleUpdatePage} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#00d4d4", flex: 1 },
  addBtn: {
    backgroundColor: "#00d4d4",
    borderRadius: 16,
    padding: 6,
    marginLeft: 8,
  },
  addBtnText: { color: "#0d0d0d", fontSize: 20, fontWeight: "800" },
  pageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#222",
  },
  pageIcon: { fontSize: 20, marginRight: 10 },
  pageTitle: { fontSize: 16, color: "#f5f5f5" },
  editablePageContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#222",
  },
  editableInput: {
    flex: 1,
    fontSize: 16,
    color: "#f5f5f5",
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
    padding: 8,
    minHeight: 30,
  },
  saveButton: {
    backgroundColor: "#00d4d4",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  saveButtonText: {
    color: "#0d0d0d",
    fontWeight: "bold",
    fontSize: 16,
  },
});