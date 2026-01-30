import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { useAppContext } from "../hooks/useAppContext";
import {
  listNoteBlocks,
  createNoteBlock,
  updateNoteBlock,
  deleteNoteBlock,
  updateNotePage,
} from "../services/firebaseService";
import { NoteBlock } from "../types/notes";
import SlashCommandMenu, { SlashCommand } from "./SlashCommandMenu";
import ImageUploader from "./ImageUploader";

const BLOCK_TYPE_LABELS: Record<string, string> = {
  paragraph: "Paragraph",
  heading: "Heading",
  heading2: "Heading 2",
  heading3: "Heading 3",
  image: "Image",
  todo: "To-Do",
  list: "List",
  quote: "Quote",
  divider: "Divider",
};

// Simple Image Upload Modal component
// Image upload modal uses the shared ImageUploader component (same UX as AddTrade)
const ImageUploadModal = ({
  visible,
  onImageUrl,
  onCancel,
}: {
  visible: boolean;
  onImageUrl: (url: string) => void;
  onCancel: () => void;
}) => {
  const [screenshots, setScreenshots] = useState<Array<{ uri: string }>>([]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Add Image</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ImageUploader
            screenshots={screenshots}
            onAdd={(uri: string) => {
              // Keep modal open while image is being processed
              // User must explicitly close after selecting
              setScreenshots((s) => [...s, { uri }]);
              onImageUrl(uri);
            }}
            onRemove={(uri: string) =>
              setScreenshots((s) => s.filter((x) => x.uri !== uri))
            }
            onUpdateLabel={() => {}}
            maxImages={1}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// EditableBlock component for viewing and editing blocks
const EditableBlock = ({
  block,
  onUpdate,
  onDelete,
  onAddBlockAfter,
  isEditingProp,
  setEditingBlockId,
  blockIndex,
  totalBlocks,
  onNavigateBlock,
}: {
  block: NoteBlock;
  onUpdate: (updatedBlock: NoteBlock) => void;
  onDelete: (blockId: string) => void;
  onAddBlockAfter: (blockType: string) => Promise<string | null>;
  isEditingProp?: boolean;
  setEditingBlockId?: (id: string | null) => void;
  blockIndex?: number;
  totalBlocks?: number;
  onNavigateBlock?: (index: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(block.properties?.text || "");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashSearch, setSlashSearch] = useState("");
  const [imageUri, setImageUri] = useState(block.properties?.url || "");
  const [showImageModal, setShowImageModal] = useState(false);

  const autoCap = (s: string) =>
    s.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_m, p1, p2) => p1 + p2.toUpperCase());

  const handleSave = () => {
    const cleaned = text.replace(/\n+$/g, "");
    const capitalized = autoCap(cleaned);

    if (capitalized.trim() === "" && !imageUri) {
      onDelete(block.blockId);
      return;
    }

    const updatedBlock = {
      ...block,
      properties: {
        ...block.properties,
        text: block.type === "image" ? "" : capitalized,
        url: block.type === "image" ? imageUri : undefined,
      },
    };
    onUpdate(updatedBlock);
    setIsEditing(false);
    setEditingBlockId?.(null);
  };

  const handleKeyPress = (e: any) => {
    const key = e?.nativeEvent?.key;
    const shift = e?.nativeEvent?.shiftKey;

    // Arrow navigation
    if (key === "ArrowUp" || key === "ArrowDown") {
      if (blockIndex !== undefined && onNavigateBlock) {
        try {
          e.preventDefault?.();
        } catch (err) {}

        if (key === "ArrowUp" && blockIndex > 0) {
          handleSave();
          onNavigateBlock(blockIndex - 1);
          return;
        }
        if (
          key === "ArrowDown" &&
          blockIndex !== undefined &&
          totalBlocks !== undefined &&
          blockIndex < totalBlocks - 1
        ) {
          handleSave();
          onNavigateBlock(blockIndex + 1);
          return;
        }
      }
      return;
    }

    if (key === "Enter") {
      // Shift+Enter -> insert newline
      if (shift) {
        setText((t: string) => t + "\n");
        return;
      }

      // Enter -> finish this block and create a new paragraph
      try {
        e.preventDefault?.();
      } catch (err) {}
      handleSave();
      // fire-and-forget creation of next block
      void onAddBlockAfter("paragraph");
    }
  };

  const handleTextChange = (newText: string) => {
    // detect and handle headings at the start of line
    const headingMatch = newText.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch && newText.trim().startsWith("#")) {
      const level = headingMatch[1].length;
      const newType =
        level === 1 ? "heading" : level === 2 ? "heading2" : "heading3";
      const cleaned = newText.replace(/^(#{1,3})\s+/, "");
      setText(cleaned);
      onUpdate({
        ...block,
        type: newType,
        properties: { ...block.properties, text: cleaned },
      });
      return;
    }

    // divider: detect exactly "---" and convert
    if (
      newText === "---" ||
      (newText.endsWith("\n---") && newText.trim() === "---")
    ) {
      onUpdate({ ...block, type: "divider", properties: { text: "" } });
      setShowSlashMenu(false);
      setText("");
      void onAddBlockAfter("paragraph");
      return;
    }

    // detect slash command start: "/" followed by optional chars, at start or after space
    const slashMatch = newText.match(/\/(\w*)$/);
    if (slashMatch !== null) {
      // User is typing a slash command
      setShowSlashMenu(true);
      setSlashSearch(slashMatch[1] || "");
      setText(newText);
      return;
    } else {
      // Not in slash mode anymore
      if (showSlashMenu) {
        setShowSlashMenu(false);
        setSlashSearch("");
      }
    }

    // default: auto-capitalize sentences
    setText(autoCap(newText));
  };

  const handleSlashCommand = (command: SlashCommand) => {
    // Remove the "/" and search text from input before executing command
    const cleanText = text.replace(/\/\w*$/, "");
    setText(cleanText);
    setShowSlashMenu(false);
    setSlashSearch("");

    if (command.type === "image") {
      setShowImageModal(true);
      return;
    }
    if (command.type === "divider") {
      onUpdate({ ...block, type: "divider", properties: { text: cleanText } });
      void onAddBlockAfter("paragraph");
      return;
    }
    if (
      command.type === "todo" ||
      command.type === "list" ||
      command.type === "quote"
    ) {
      onUpdate({
        ...block,
        type: command.type,
        properties: { text: cleanText },
      });
      setIsEditing(false);
      void onAddBlockAfter("paragraph");
      return;
    }
    if (
      command.type === "heading" ||
      command.type === "heading2" ||
      command.type === "heading3"
    ) {
      onUpdate({
        ...block,
        type: command.type,
        properties: { text: cleanText },
      });
      setIsEditing(false);
      void onAddBlockAfter("paragraph");
      return;
    }
  };

  const handleImagePaste = (imageUrl: string) => {
    setImageUri(imageUrl);
    setShowImageModal(false);
    onUpdate({
      ...block,
      type: "image",
      properties: { ...block.properties, url: imageUrl, text: "" },
    });
    setIsEditing(false);
    setEditingBlockId?.(null);
  };

  const inputRef = React.useRef<TextInput | null>(null);

  React.useEffect(() => {
    if (isEditingProp) {
      setIsEditing(true);
    }
  }, [isEditingProp]);

  React.useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputRef.current?.focus?.(), 30);
      setEditingBlockId?.(block.blockId);
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <>
        <View style={styles.editableBlockContainer}>
          {block.type === "image" && imageUri ? (
            <View style={styles.imageEditContainer}>
              <TextInput
                style={styles.editableInput}
                value={`Image: ${imageUri.split("/").pop() || "Image"}`}
                editable={false}
                multiline
                placeholder={`Image block - press backspace to delete...`}
                placeholderTextColor="#555"
              />
            </View>
          ) : (
            <TextInput
              ref={inputRef}
              style={[styles.editableInput, { borderWidth: 0 }]}
              value={text}
              onChangeText={handleTextChange}
              onBlur={() => {
                if (!showSlashMenu) handleSave();
              }}
              multiline
              autoFocus
              blurOnSubmit={false}
              placeholder={`Type "/" for options... or just start typing...`}
              placeholderTextColor="#555"
              onKeyPress={handleKeyPress}
              underlineColorAndroid="transparent"
              selectionColor="#00d4d4"
            />
          )}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>✓</Text>
          </TouchableOpacity>
        </View>
        <SlashCommandMenu
          visible={showSlashMenu}
          onSelectCommand={handleSlashCommand}
          onClose={() => setShowSlashMenu(false)}
          searchText={slashSearch}
        />
        <ImageUploadModal
          visible={showImageModal}
          onImageUrl={handleImagePaste}
          onCancel={() => setShowImageModal(false)}
        />
      </>
    );
  }

  return (
    <TouchableOpacity
      style={styles.blockRow}
      onPress={() => setIsEditing(true)}
    >
      <View style={styles.blockInfo}>
        <Text style={styles.blockContent}>
          {block.type === "image" && block.properties?.url
            ? `Image: ${block.properties.url.split("/").pop()}`
            : block.properties?.text || "(Empty)"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function NotesBlockList({
  pageId,
  pageTitle = "Untitled Page",
}: {
  pageId: string;
  pageTitle?: string;
}) {
  const { state } = useAppContext();
  const userId = state.user?.uid;
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingPageTitle, setEditingPageTitle] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState(pageTitle);

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

  const handleAddBlock = async (
    blockType: string = "paragraph",
  ): Promise<string | null> => {
    if (!userId || !pageId) return null;
    const id = await createNoteBlock(userId, {
      pageId,
      parentId: pageId,
      type: blockType,
      properties: blockType === "divider" ? {} : { text: "" },
      order: blocks.length,
      depth: 0,
    });
    // Optimistically add the new block to state instead of refetching
    // This preserves any unsaved changes in other blocks
    if (id) {
      const newBlock: NoteBlock = {
        blockId: id,
        pageId,
        parentId: pageId,
        type: blockType,
        properties: blockType === "divider" ? {} : { text: "" },
        order: blocks.length,
        depth: 0,
        isCollapsed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
    }
    if (id) {
      // focus the newly created block for editing
      setEditingBlockId(id);
    }
    return id;
  };

  const handleUpdateBlock = async (updatedBlock: NoteBlock) => {
    if (!userId) return;

    // Update local state optimistically
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.blockId === updatedBlock.blockId ? updatedBlock : block,
      ),
    );

    // Update in Firebase
    await updateNoteBlock(userId, updatedBlock.blockId, {
      properties: updatedBlock.properties,
      updatedAt: new Date(),
    });
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!userId) return;

    // Update local state optimistically
    setBlocks((prevBlocks) =>
      prevBlocks.filter((block) => block.blockId !== blockId),
    );

    // Delete from Firebase
    await deleteNoteBlock(userId, blockId);
  };

  const handleSavePageTitle = async () => {
    if (!userId || !pageId) return;

    await updateNotePage(userId, pageId, {
      title: newPageTitle,
      updatedAt: new Date(),
    });

    setEditingPageTitle(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        {editingPageTitle ? (
          <View style={styles.editPageTitleContainer}>
            <TextInput
              style={styles.editPageTitleInput}
              value={newPageTitle}
              onChangeText={setNewPageTitle}
              onBlur={handleSavePageTitle}
              onSubmitEditing={handleSavePageTitle}
              autoFocus
              placeholder="Page title..."
              placeholderTextColor="#555"
            />
            <TouchableOpacity
              style={styles.savePageTitleBtn}
              onPress={handleSavePageTitle}
            >
              <Text style={styles.savePageTitleText}>✓</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditingPageTitle(true)}>
            <View>
              <Text style={styles.pageTitle}>{newPageTitle}</Text>
              <Text style={styles.blockCount}>
                {blocks.length} {blocks.length === 1 ? "block" : "blocks"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => handleAddBlock()}
        >
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator color="#00d4d4" />
      ) : (
        <View style={styles.blocksWrapper}>
          {blocks.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyState}
              onPress={() => handleAddBlock()}
            >
              <Text style={styles.emptyStateIcon}>📝</Text>
              <Text style={styles.emptyStateText}>No blocks yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap here, press "+" or press Enter to start writing
              </Text>
            </TouchableOpacity>
          ) : (
            <FlatList
              data={blocks}
              keyExtractor={(item) => item.blockId}
              renderItem={({ item, index }) => (
                <EditableBlock
                  block={item}
                  onUpdate={handleUpdateBlock}
                  onDelete={handleDeleteBlock}
                  onAddBlockAfter={handleAddBlock}
                  isEditingProp={editingBlockId === item.blockId}
                  setEditingBlockId={setEditingBlockId}
                  blockIndex={index}
                  totalBlocks={blocks.length}
                  onNavigateBlock={(nextIndex) => {
                    setEditingBlockId(blocks[nextIndex]?.blockId || null);
                  }}
                />
              )}
              scrollEnabled={true}
              nestedScrollEnabled={true}
            />
          )}
          {blocks.length > 0 && (
            <TouchableOpacity
              style={styles.bottomCreateArea}
              onPress={() => handleAddBlock()}
              activeOpacity={0.3}
            >
              <Text style={styles.bottomCreateText}>Tap to add block</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d" },
  blocksWrapper: {
    flex: 1,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#222",
  },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#f5f5f5" },
  blockCount: { fontSize: 12, color: "#666", marginTop: 4 },
  editPageTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  editPageTitleInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: "#f5f5f5",
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 30,
  },
  savePageTitleBtn: {
    backgroundColor: "#00d4d4",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  savePageTitleText: {
    color: "#0d0d0d",
    fontWeight: "bold",
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: "#00d4d4",
    borderRadius: 16,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: { color: "#0d0d0d", fontSize: 20, fontWeight: "800" },
  blockRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  blockInfo: {
    flex: 1,
    flexDirection: "column",
  },
  blockContent: { fontSize: 15, color: "#f5f5f5", lineHeight: 20 },
  editableBlockContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
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
    textAlignVertical: "top",
    marginLeft: 8,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
    padding: 8,
    marginLeft: 8,
    justifyContent: "center",
  },
  imageEditContainer: {
    flex: 1,
  },
  imageUrl: {
    color: "#00d4d4",
    fontSize: 13,
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
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f5f5f5",
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#666",
  },
  bottomCreateArea: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "#222",
    minHeight: 50,
  },
  bottomCreateText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#00d4d4",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f5f5f5",
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: "#0d0d0d",
    color: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalButtonCancel: {
    backgroundColor: "#222",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  modalButtonConfirm: {
    backgroundColor: "#00d4d4",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  modalButtonText: {
    color: "#0d0d0d",
    fontWeight: "600",
    fontSize: 14,
  },
});
