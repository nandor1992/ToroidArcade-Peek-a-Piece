import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import {
  LEGAL_CONTACT,
  LEGAL_DOCS_URL,
  LEGAL_EFFECTIVE_DATE,
  type LegalDocument,
} from '../legal/legalDocuments';

export interface LegalDocumentViewProps {
  document: LegalDocument;
  /** Returns to the About sheet. */
  onBack: () => void;
}

/**
 * Renders one bundled legal document as scrollable text.
 *
 * It is a plain View, not a Modal: the About sheet swaps its own contents for
 * this instead of stacking a second modal on top, which Android handles
 * unreliably. See docs/specs/components/LegalDocumentView.md.
 */
export function LegalDocumentView({
  document,
  onBack,
}: LegalDocumentViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{document.title}</Text>
      <Text style={styles.effective}>Effective {LEGAL_EFFECTIVE_DATE}</Text>
      <View style={styles.rule} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        // The scrollbar is the only cue that there's more below — a parent
        // reading a policy should never think they've seen it all.
        persistentScrollbar>
        {document.blocks.map((block, index) => (
          <View key={block.heading ?? `block-${index}`} style={styles.block}>
            {block.heading != null && (
              <Text style={styles.heading}>{block.heading}</Text>
            )}
            {block.text?.map(paragraph => (
              <Text key={paragraph} style={styles.body}>
                {paragraph}
              </Text>
            ))}
            {block.bullets?.map(bullet => (
              <View key={bullet} style={styles.bulletRow}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={[styles.body, styles.bulletText]}>{bullet}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.block}>
          <Text style={styles.footnote}>Questions: {LEGAL_CONTACT}</Text>
          <Text style={styles.footnote}>
            The full-length version of this document is published at{'\n'}
            {LEGAL_DOCS_URL}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.rule} />
      <Pressable
        accessibilityRole="button"
        // Not plain "Back": the Settings header's own back button already
        // owns that label, and a screen-reader user hearing two of them has
        // no way to tell which leaves the document.
        accessibilityLabel="Back to About"
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}>
        <Text style={styles.backLabel}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 12,
    // Caps the sheet so the Back button stays on screen on a small phone
    // even though the document itself is long.
    maxHeight: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
  },
  effective: {
    fontSize: 13,
    color: colors.navy,
    opacity: 0.6,
  },
  rule: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: colors.navy,
    opacity: 0.15,
  },
  scroll: {
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    gap: 16,
    paddingVertical: 4,
  },
  block: {
    gap: 8,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.navy,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 4,
  },
  bulletMark: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.navy,
  },
  bulletText: {
    flex: 1,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.navy,
    opacity: 0.7,
  },
  backButton: {
    backgroundColor: colors.teal,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
