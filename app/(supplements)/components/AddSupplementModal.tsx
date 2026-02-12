import { Supplement } from '@/api/types';
import { theme } from '@/constants/theme';
import { useAddUserSupplement, useInfiniteSupplements } from '@/hooks/useSupplements';
import { validateSupplementDosage, validateSupplementFrequency } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface AddSupplementModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddSupplementModal({ visible, onClose }: AddSupplementModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<{
    base: Supplement | null;
    dosage: string;
    freq: string;
    time: string;
  }>({ base: null, dosage: '', freq: 'daily', time: '' });

  const { data, fetchNextPage, hasNextPage } = useInfiniteSupplements(50);
  const addMutation = useAddUserSupplement();

  const availableSupplements = data?.pages.flatMap((page) => page.results) || [];

  const handleClose = () => {
    onClose();
    setStep(1);
    setFormData({ base: null, dosage: '', freq: 'daily', time: '' });
  };

  const handleSubmit = async () => {
    if (!formData.base || !formData.dosage) return;

    const dosage = parseFloat(formData.dosage);

    const dosageValidation = validateSupplementDosage(dosage);
    if (!dosageValidation.isValid) {
      Alert.alert('Validation Error', dosageValidation.errors.join('\n'));
      return;
    }

    const frequencyValidation = validateSupplementFrequency(formData.freq);
    if (!frequencyValidation.isValid) {
      Alert.alert('Validation Error', frequencyValidation.errors.join('\n'));
      return;
    }

    try {
      await addMutation.mutateAsync({
        supplement_id: formData.base.id,
        dosage: dosage,
        frequency: formData.freq,
        time_of_day: formData.time,
      });
      handleClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add supplement');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{step === 1 ? 'Add Supplement' : 'Details'}</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close-circle" size={30} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {step === 1 ? (
          <FlatList
            data={availableSupplements}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.selectionRow}
                onPress={() => {
                  setFormData((prev) => ({
                    ...prev,
                    base: item,
                    dosage: item.default_dosage?.toString() || '',
                  }));
                  setStep(2);
                }}
              >
                <Text style={styles.selectionText}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            )}
            ListFooterComponent={
              hasNextPage ? (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() => fetchNextPage()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loadMoreText}>Load More</Text>
                </TouchableOpacity>
              ) : null
            }
          />
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={styles.formContent}>
              <View style={styles.previewBanner}>
                <Text style={styles.previewText}>{formData.base?.name}</Text>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.changeLink}>Change</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>DOSAGE ({formData.base?.dosage_unit})</Text>
              <TextInput
                style={styles.input}
                value={formData.dosage}
                onChangeText={(t) => setFormData((p) => ({ ...p, dosage: t }))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.text.tertiary}
                autoFocus
              />

              <Text style={styles.label}>FREQUENCY</Text>
              <View style={styles.pillRow}>
                {['Daily', 'Weekly'].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.pill,
                      formData.freq.toLowerCase() === f.toLowerCase() && styles.pillActive,
                    ]}
                    onPress={() => setFormData((p) => ({ ...p, freq: f.toLowerCase() }))}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        formData.freq.toLowerCase() === f.toLowerCase() && styles.pillTextActive,
                      ]}
                    >
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>TIME OF DAY (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                value={formData.time}
                onChangeText={(t) => setFormData((p) => ({ ...p, time: t }))}
                placeholder="Morning, Pre-workout..."
                placeholderTextColor={theme.colors.text.tertiary}
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                <Text style={styles.saveButtonText}>Add Supplement</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ui.border,
    backgroundColor: theme.colors.ui.glassStrong,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.l,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.ui.border,
    backgroundColor: theme.colors.ui.glass,
  },
  selectionText: {
    fontSize: theme.typography.sizes.m,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  formContent: {
    padding: theme.spacing.l,
    backgroundColor: theme.colors.background,
  },
  previewBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.ui.glassStrong,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  previewText: {
    fontSize: theme.typography.sizes.m,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  changeLink: {
    color: theme.colors.status.active,
    fontSize: theme.typography.sizes.m,
    fontWeight: '600',
  },
  label: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.s,
    fontWeight: '600',
    marginBottom: theme.spacing.s,
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.wide,
  },
  input: {
    backgroundColor: theme.colors.ui.glassStrong,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    fontSize: theme.typography.sizes.m,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  pillRow: {
    flexDirection: 'row',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.xl,
  },
  pill: {
    flex: 1,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.ui.glassStrong,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: theme.colors.status.active,
    borderColor: theme.colors.status.active,
  },
  pillText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontSize: theme.typography.sizes.m,
  },
  pillTextActive: {
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: theme.colors.status.active,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    marginTop: theme.spacing.s,
  },
  saveButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.sizes.m,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: theme.typography.tracking.wide,
  },
  loadMoreButton: {
    backgroundColor: theme.colors.ui.glass,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    marginTop: theme.spacing.m,
    marginHorizontal: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.ui.border,
  },
  loadMoreText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.sizes.m,
    fontWeight: '600',
  },
});
