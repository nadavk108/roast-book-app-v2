/**
 * Hebrew Language Detection and RTL Utilities
 */

/**
 * Detects if a string contains Hebrew characters
 */
export function isHebrew(text: string): boolean {
  if (!text) return false;
  // Hebrew Unicode range: \u0590-\u05FF
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
}

/**
 * Detects if the majority of a string is Hebrew
 */
export function isPredominantlyHebrew(text: string): boolean {
  if (!text) return false;
  const hebrewChars = text.match(/[\u0590-\u05FF]/g);
  const totalChars = text.replace(/\s/g, '').length; // Remove whitespace

  if (totalChars === 0) return false;

  const hebrewRatio = hebrewChars ? hebrewChars.length / totalChars : 0;
  return hebrewRatio > 0.3; // If more than 30% Hebrew, treat as Hebrew
}

/**
 * Get Hebrew book title with gender support
 */
export function getHebrewBookTitle(victimName: string, gender?: string): string {
  // אומר = masculine, אומרת = feminine
  const verb = gender === 'female' ? 'אומרת' : 'אומר';
  return `משפטים שלא תשמע את ${victimName} ${verb}`;
}

/**
 * Get RTL text direction class
 */
export function getRTLClass(text: string): string {
  return isPredominantlyHebrew(text) ? 'rtl' : 'ltr';
}

/**
 * Get text alignment class based on language
 */
export function getTextAlignClass(text: string): string {
  return isPredominantlyHebrew(text) ? 'text-right' : 'text-left';
}

/**
 * Detect if an array of quotes contains Hebrew
 */
export function hasHebrewQuotes(quotes: string[]): boolean {
  if (!quotes || quotes.length === 0) return false;
  return quotes.some(quote => isPredominantlyHebrew(quote));
}

/**
 * Get localized prompt instruction for Hebrew
 */
export function getHebrewPromptInstruction(): string {
  return `
HEBREW OUTPUT REQUIREMENTS:
- Return quotes in Hebrew (עברית)
- Maintain the same sharp, satirical "Mortal Enemy" tone
- Adapt for Israeli cultural context:
  * Replace "HR Manager" with "פקיד בירוקרטי יבש" (dry bureaucratic clerk)
  * Replace "corporate speak" with "שפה רשמית ממשלתית" (formal government language)
  * Use Israeli cultural references (IDF, kibbutz, Tel Aviv lifestyle, etc.)
- Output must be RIGHT-TO-LEFT (RTL) Hebrew text
- Keep quotes under 15 words in Hebrew
`;
}

/**
 * Detect language and return appropriate instruction
 */
export function getLanguageInstruction(sampleText: string): string {
  if (isPredominantlyHebrew(sampleText)) {
    return getHebrewPromptInstruction();
  }
  return ''; // No special instruction for English
}
