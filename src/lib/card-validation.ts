/**
 * Convertit un caractère alphanumérique en nombre
 * A-Z → 10-35, 0-9 → 0-9
 */
const charToNumber = (char: string): number => {
  const upper = char.toUpperCase();
  if (upper >= 'A' && upper <= 'Z') {
    return upper.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
  }
  return parseInt(char, 10);
};

/**
 * Convertit un code alphanumérique en chaîne de chiffres
 * Ex: "AB123" → "10111213"
 */
export const alphanumericToNumeric = (code: string): string => {
  return code
    .split('')
    .map(char => charToNumber(char).toString())
    .join('');
};

/**
 * Calcule le chiffre de contrôle Luhn pour un code alphanumérique
 */
export const calculateLuhnCheckDigit = (code: string): number => {
  const numeric = alphanumericToNumeric(code);
  let sum = 0;
  let isEven = true;

  // Parcourir de droite à gauche
  for (let i = numeric.length - 1; i >= 0; i--) {
    let digit = parseInt(numeric[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit;
};

/**
 * Valide un code alphanumérique avec Luhn
 * Format: XX000 (2 lettres + 3 chiffres, le dernier chiffre est le check digit)
 */
export const validateLuhnAlphanumeric = (code: string): boolean => {
  if (!code || code.length !== 5) {
    return false;
  }

  // Vérifier le format: 2 lettres + 3 chiffres
  const regex = /^[A-Z]{2}[0-9]{3}$/;
  if (!regex.test(code)) {
    return false;
  }

  // Extraire le code sans le check digit
  const codeWithoutCheck = code.slice(0, 4);
  const providedCheckDigit = parseInt(code[4], 10);

  // Calculer le check digit attendu
  const expectedCheckDigit = calculateLuhnCheckDigit(codeWithoutCheck);

  return providedCheckDigit === expectedCheckDigit;
};

/**
 * Génère un code de carte valide avec Luhn
 * Format: XX000 (2 lettres + 2 chiffres + 1 check digit)
 */
export const generateCardCodeWithLuhn = (customerNumber: number): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numStr = customerNumber.toString().padStart(2, '0').slice(-2);
  
  const letter1 = letters[Math.floor(customerNumber / 100) % 26];
  const letter2 = letters[customerNumber % 26];
  
  const codeWithoutCheck = `${letter1}${letter2}${numStr}`;
  const checkDigit = calculateLuhnCheckDigit(codeWithoutCheck);
  
  return `${codeWithoutCheck}${checkDigit}`;
};

/**
 * Formate un code de carte pour l'affichage
 * Ex: "AB123" → "AB 12 3"
 */
export const formatCardCode = (code: string): string => {
  if (!code || code.length !== 5) return code;
  return `${code.slice(0, 2)} ${code.slice(2, 4)} ${code.slice(4)}`;
};

/**
 * Nettoie un code de carte (enlève les espaces)
 * Ex: "AB 12 3" → "AB123"
 */
export const cleanCardCode = (code: string): string => {
  return code.replace(/\s/g, '').toUpperCase();
};