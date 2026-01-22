import * as THREE from 'three';

/**
 * CSS variable names for Three.js colors
 */
const CSS_VARS = {
  bg: '--three-bg',
  grid: '--three-grid',
  axisX: '--three-axis-x',
  axisY: '--three-axis-y',
  axisZ: '--three-axis-z',
  mesh: '--three-mesh',
  toolpath: '--three-toolpath',
  travel: '--three-travel'
} as const;

/**
 * Reads a CSS variable value from the document root
 */
const getCSSVariable = (varName: string): string => {
  // Try inline style first
  const inlineValue = document.documentElement.style.getPropertyValue(varName).trim();
  if (inlineValue) {
    return inlineValue;
  }
  
  // Fallback to computed style
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
};

/**
 * Converts hex color string to THREE.Color
 */
const hexToThreeColor = (hex: string): THREE.Color => {
  return new THREE.Color(hex);
};

/**
 * Gets all Three.js colors from CSS variables
 * @returns Object containing all Three.js colors synchronized with current theme
 */
export const getThreeColors = () => {
  return {
    bg: hexToThreeColor(getCSSVariable(CSS_VARS.bg)),
    grid: hexToThreeColor(getCSSVariable(CSS_VARS.grid)),
    axisX: hexToThreeColor(getCSSVariable(CSS_VARS.axisX)),
    axisY: hexToThreeColor(getCSSVariable(CSS_VARS.axisY)),
    axisZ: hexToThreeColor(getCSSVariable(CSS_VARS.axisZ)),
    mesh: hexToThreeColor(getCSSVariable(CSS_VARS.mesh)),
    toolpath: hexToThreeColor(getCSSVariable(CSS_VARS.toolpath)),
    travel: hexToThreeColor(getCSSVariable(CSS_VARS.travel))
  };
};

/**
 * Type for the colors object returned by getThreeColors()
 */
export type ThreeColors = ReturnType<typeof getThreeColors>;

/**
 * Gets the toolpath extrusion color from CSS variables
 * Useful for components that need the color dynamically
 */
export const getThreeToolpathColor = (): THREE.Color => {
  return getThreeColors().toolpath;
};
