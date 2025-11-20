import React, { useCallback } from 'react';
import { Platform, View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';

type ImageUploaderProps = {
  screenshots: string[];
  onAdd: (localUri: string, file?: File) => void;
  onRemove: (uri: string) => void;
};

export default function ImageUploader({ screenshots, onAdd, onRemove }: ImageUploaderProps) {
  const { colors } = useTheme();

  const handleWebPicker = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file: File = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      onAdd(url, file);
    };
    input.click();
  }, [onAdd]);

  const handleNative = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        console.warn('Image picker not available on web, use handleWebPicker instead');
        return;
      }

      const ImagePicker = await import('expo-image-picker');
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!res.cancelled) {
        onAdd(res.uri);
      }
    } catch (err) {
      console.error('Image picker error (this is normal on web):', err);
      if (Platform.OS === 'web') {
        console.info('Falling back to web file picker...');
        handleWebPicker();
      }
    }
  }, [onAdd, handleWebPicker]);

  const handlePress = useCallback(() => {
    if (Platform.OS === 'web') {
      handleWebPicker();
    } else {
      handleNative();
    }
  }, [handleWebPicker, handleNative]);

  return (
    <View>
      <View style={styles.row}>
        {screenshots.map((s) => (
          <View key={s} style={styles.thumbWrap}>
            <Image 
              source={{ uri: s }} 
              style={[styles.thumb, { backgroundColor: colors.surface }]} 
            />
            <TouchableOpacity 
              style={[styles.remove, { backgroundColor: colors.lossEnd }]} 
              onPress={() => onRemove(s)}
              accessibilityLabel="Remove image"
            >
              <Text style={[styles.removeText, { color: colors.surface }]}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.highlight }]}
        onPress={handlePress}
        accessibilityLabel="Upload screenshot"
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>
          {Platform.OS === 'web' ? 'Choose Image' : 'Upload Screenshot'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { 
    flexDirection: 'row', 
    gap: 8, 
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  thumbWrap: { 
    position: 'relative' 
  },
  thumb: { 
    width: 80, 
    height: 80, 
    borderRadius: 8,
    resizeMode: 'cover',
  },
  remove: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { 
    fontWeight: '700',
    fontSize: 16,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { 
    fontWeight: '700',
    fontSize: 14,
  },
});
