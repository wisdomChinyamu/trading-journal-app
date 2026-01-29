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
  listNoteBlocks,
  createNoteBlock,
  updateNoteBlock,
  deleteNoteBlock,
} from "../services/firebaseService";
import { NoteBlock } from "../types/notes";

const BLOCK_TYPE_LABELS: Record<string, string> = {
  paragraph: "Paragraph",
  heading: "Heading",
  image: "Image",
  todo: "To-Do",
  list: "List",
  quote: "Quote",
  divider: "Divider",
};

// EditableBlock component for inline editing
const EditableBlock = ({ block, onUpdate }: { block: NoteBlock, onUpdate: (updatedBlock: NoteBlock) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(block.properties?.text || "");
  
  const handleSave = () => {
    const updatedBlock = {
      ...block,
      properties: { ...block.properties, text }
    };
    onUpdate(updatedBlock);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <View style={styles.editableBlockContainer}>
        <TextInput
          style={styles.editableInput}
          value={text}
          onChangeText={setText}
          onBlur={handleSave}
          multiline
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
      style={styles.blockRow} 
      onPress={() => setIsEditing(true)}
      onLongPress={() => setIsEditing(true)}
    >
      <Text style={styles.blockType}>
        {BLOCK_TYPE_LABELS[block.type] || block.type}
      </Text>
      <Text style={styles.blockContent}>
        {block.properties?.text || "(empty)"}
      </Text>
    </TouchableOpacity>
  );
};

export default function NotesBlockList({ pageId }: { pageId: string }) {
  const { state } = useAppContext();
  const userId = state.user?.uid;
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBlocks = async () => {
    if (!userId || !pageId) return;
    setLoading(true);
    const data = await listNoteBlocks(userId, pageId);
    setBlocks(
      data.map((d: any) => ({
        blockId: d.blockId,
        pageId: d.pageId,
        parentId: d.parentId,
        type: d.type,
        properties: d.properties ?? {},
        order: d.order ?? 0,
        depth: d.depth ?? 0,
        isCollapsed: d.isCollapsed ?? false,
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
    fetchBlocks();
  }, [userId, pageId]);

  const handleAddBlock = async () => {
    if (!userId || !pageId) return;
    await createNoteBlock(userId, {
      pageId,
      parentId: pageId,
      type: "paragraph",
      properties: { text: "" },
      order: blocks.length,
      depth: 0,
    });
    fetchBlocks();
  };

  const handleUpdateBlock = async (updatedBlock: NoteBlock) => {
    if (!userId) return;
    
    // Update local state optimistically
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.blockId === updatedBlock.blockId ? updatedBlock : block
      )
    );
    
    // Update in Firebase
    await updateNoteBlock(userId, updatedBlock.blockId, {
      properties: updatedBlock.properties,
      updatedAt: new Date(),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Blocks</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddBlock}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#00d4d4" />
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={(item) => item.blockId}
          renderItem={({ item }) => (
            <EditableBlock block={item} onUpdate={handleUpdateBlock} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "800", color: "#00d4d4", flex: 1 },
  addBtn: {
    backgroundColor: "#00d4d4",
    borderRadius: 16,
    padding: 6,
    marginLeft: 8,
  },
  addBtnText: { color: "#0d0d0d", fontSize: 20, fontWeight: "800" },
  blockRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#222",
  },
  blockType: { fontSize: 14, color: "#aaa", width: 90 },
  blockContent: { fontSize: 15, color: "#f5f5f5", flex: 1 },
  editableBlockContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#222",
  },
  editableInput: {
    flex: 1,
    fontSize: 15,
    color: "#f5f5f5",
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
    padding: 8,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: "#00d4d4",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#0d0d0d",
    fontWeight: "bold",
    fontSize: 16,
  },
});