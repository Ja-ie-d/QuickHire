// components/ColorPicker.js
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';

const blueShades = [
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Royal Blue', hex: '#4169E1' },
  { name: 'Navy Blue', hex: '#000080' },
  { name: 'Teal Blue', hex: '#008080' },
  { name: 'Baby Blue', hex: '#89CFF0' },
  { name: 'Steel Blue', hex: '#4682B4' },
  { name: 'Powder Blue', hex: '#B0E0E6' },
  { name: 'Cornflower Blue', hex: '#6495ED' }
];

export default function ColorPicker({ selectedColor, onSelectColor }) {
  return (
    <View style={styles.container}>
      <View style={styles.colorGrid}>
        {blueShades.map((shade) => (
          <TouchableOpacity
            key={shade.hex}
            style={[
              styles.colorOption,
              { backgroundColor: shade.hex },
              selectedColor === shade.hex && styles.selectedColor
            ]}
            onPress={() => onSelectColor(shade.hex)}
          />
        ))}
      </View>
      <Text style={styles.selectedColorText}>
        Selected: {blueShades.find(shade => shade.hex === selectedColor)?.name || selectedColor}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  colorOption: {
    width: '23%',
    height: 50,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#000',
  },
  selectedColorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
});