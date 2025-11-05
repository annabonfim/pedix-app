import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';

export function Dropdown({ options, selectedValue, onSelect, placeholder = 'Selecione...' }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.id === selectedValue);

  return (
    <View>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[styles.dropdownText, !selectedValue && styles.placeholder]}>
          {selectedOption ? selectedOption.nome || selectedOption.label : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione uma opção</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    selectedValue === item.id && styles.selectedOption,
                  ]}
                  onPress={() => {
                    onSelect(item.id);
                    setIsOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedValue === item.id && styles.selectedOptionText,
                    ]}
                  >
                    {item.nome || item.label}
                  </Text>
                  {selectedValue === item.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
  },
  placeholder: {
    color: '#95A5A6',
  },
  arrow: {
    fontSize: 12,
    color: '#7F8C8D',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  selectedOption: {
    backgroundColor: '#FF6B35',
  },
  optionText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});


