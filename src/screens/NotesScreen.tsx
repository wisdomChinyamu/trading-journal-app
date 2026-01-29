import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import NotesPageList from "../components/NotesPageList";
import NotesBlockList from "../components/NotesBlockList";

export default function NotesScreen({ navigation }: any) {
  const [selectedPage, setSelectedPage] = useState<any>(null);
  return (
    <View style={styles.container}>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
      >
        <Text style={styles.title}>Notes</Text>
        {selectedPage && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedPage(null)}
          >
            <Text style={styles.backBtnText}>← Pages</Text>
          </TouchableOpacity>
        )}
      </View>
      {!selectedPage ? (
        <NotesPageList onSelectPage={setSelectedPage} />
      ) : (
        <NotesBlockList
          pageId={selectedPage.pageId}
          pageTitle={selectedPage.title}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    padding: 16,
    position: "relative",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#00d4d4",
    marginBottom: 8,
    flex: 1,
  },
  backBtn: {
    backgroundColor: "#222",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  backBtnText: {
    color: "#00d4d4",
    fontWeight: "700",
    fontSize: 14,
  },
});
