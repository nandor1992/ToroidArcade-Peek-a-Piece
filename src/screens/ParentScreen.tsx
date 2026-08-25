import React from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../theme/colors';
import type { Puzzle } from '../types/puzzle';

export interface ParentScreenProps {
  userPuzzles: Puzzle[];
  onAddPuzzle: (puzzle: Puzzle) => void;
  onDeletePuzzle: (id: string) => void;
  defaultImagesEnabled: boolean;
  onToggleDefaultImages: (enabled: boolean) => void;
  onBack?: () => void;
  onOpenSettings?: () => void;
}

export function ParentScreen({
  userPuzzles,
  onAddPuzzle,
  onDeletePuzzle,
  defaultImagesEnabled,
  onToggleDefaultImages,
  onBack,
  onOpenSettings,
}: ParentScreenProps) {
  const handleAddPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, response => {
      if (response.didCancel || response.errorCode) {
        return;
      }
      const asset = response.assets?.[0];
      if (!asset?.uri) {
        return;
      }
      onAddPuzzle({
        id: `user-${Date.now()}`,
        title: asset.fileName ?? 'Photo',
        source: 'user',
        imageUri: asset.uri,
      });
    });
  };

  const handleDelete = (puzzle: Puzzle) => {
    Alert.alert('Delete photo?', `Remove "${puzzle.title}" from puzzles?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDeletePuzzle(puzzle.id),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
          ]}>
          <Text style={styles.iconGlyph}>←</Text>
        </Pressable>
        <Text style={styles.title}>Parent Settings</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={onOpenSettings}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
          ]}>
          <Text style={styles.iconGlyph}>⚙️</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Show starter puzzles</Text>
        <Switch
          accessibilityLabel="Show starter puzzles"
          value={defaultImagesEnabled}
          onValueChange={onToggleDefaultImages}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add photo"
        onPress={handleAddPhoto}
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.addButtonPressed,
        ]}>
        <Text style={styles.addButtonLabel}>+ Add Photo</Text>
      </Pressable>

      {userPuzzles.length === 0 ? (
        <Text style={styles.emptyState}>No photos uploaded yet.</Text>
      ) : (
        <FlatList
          data={userPuzzles}
          numColumns={3}
          keyExtractor={puzzle => puzzle.id}
          contentContainerStyle={styles.grid}
          renderItem={({ item: puzzle }) => (
            <View style={styles.thumbWrapper}>
              <Image
                source={{ uri: puzzle.imageUri }}
                style={styles.thumbImage}
                resizeMode="cover"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${puzzle.title}`}
                onPress={() => handleDelete(puzzle)}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.deleteButtonPressed,
                ]}>
                <Text style={styles.deleteGlyph}>✕</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    opacity: 0.6,
  },
  iconGlyph: {
    fontSize: 22,
    color: colors.navy,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: 16,
    color: colors.navy,
  },
  addButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.teal,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addButtonLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    textAlign: 'center',
    color: colors.navy,
    opacity: 0.6,
    marginTop: 24,
  },
  grid: {
    paddingHorizontal: 12,
  },
  thumbWrapper: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 4,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  deleteButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  deleteGlyph: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
});
