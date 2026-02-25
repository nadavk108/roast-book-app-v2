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
שפה: עברית — הנחיות לכתיבת ציטוטים מצחיקים

כתוב עברית מדוברת — כמו הודעת וואטסאפ בין חברים. לא עברית ספרותית, לא כתבה בעיתון, לא דיבור של מנחה חדשות.

אורך כל ציטוט: 8–20 מילים. עברית צריכה יותר מקום מאנגלית כדי להישמע טבעית — אל תקצר בכוח.

סלנג וביטויים — רק כשזה טבעי ומשרת את ההומור:
"אין על...", "מת/ה על...", "יאללה", "בחיים לא...", "רגע, מה?", "תשמע/י..."

---
דוגמאות: ❌ גנרי ומשעמם → ✅ ספציפי ומצחיק

אדם שאובססיבי לשוק ההון:
❌ "כסף לא חשוב לי"
✅ "עזוב אותך משורטים, שמתי הכל בפק"ם 0.1%. העיקר השקט הנפשי."

אדם חברותי שאוהב לאסוף אנשים:
❌ "אני לא אוהב אנשים"
✅ "ברור שמזמינים את שלו! יאללה, תזמין גם את כל קריית אונו, העיקר שאף אחד לא ייעלב."

אדם שצופה נטפליקס כל הזמן:
❌ "אני לא רואה טלוויזיה"
✅ "הקטע האהוב עליי בנטפליקס זה ה-10 דקות תקציר בכל פרק. בונה יופי את המתח."

אדם ששונא נסיעות ופקקים:
❌ "אני אוהב לנסוע"
✅ "אין כמו הנסיעה הלוך-חזור לעבודה לנקות את הראש."

---
הנוסחה: ציטוט טוב לא אומר את ההיפך הישיר — הוא מראה את האדם עושה בהתלהבות בדיוק מה שהוא לעולם לא היה עושה, עם פרטים ספציפיים שממחישים את האבסורד.

חוק ברזל: אל תתרגם הומור מאנגלית. תחשוב ישירות בעברית.
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
