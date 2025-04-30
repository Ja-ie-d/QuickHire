// components/Star.js
import React from 'react';
import { FontAwesome } from '@expo/vector-icons';

const Star = ({ size = 16, color = '#FFD700', fill = '#FFD700' }) => {
  return (
    <FontAwesome name="star" size={size} color={fill} />
  );
};

export default Star;
