/**
 * SM-2 Algorithm Implementation
 * Based on SuperMemo 2 algorithm for spaced repetition
 * 
 * Quality ratings (q):
 * 0 - Complete blackout
 * 1 - Incorrect response with correct answer seeming familiar
 * 2 - Incorrect response with correct answer remembered
 * 3 - Correct response with serious difficulty
 * 4 - Correct response with hesitation
 * 5 - Perfect response
 */

export interface SM2Result {
  interval: number        // Days until next review
  easeFactor: number     // Updated ease factor
  repetitions: number    // Number of successful repetitions
}

export interface SRSCard {
  id: string
  user_id: string
  book_id: string
  question: string
  answer: string
  ease_factor: number
  interval_days: number
  review_count: number
  next_review: string
  confidence_level: number
  milestone_id?: string
  chapter_id?: string
  created_at: string
}

/**
 * Calculate next review interval and ease factor using SM-2 algorithm
 * @param quality - Rating from 0-5 (0=complete failure, 5=perfect recall)
 * @param currentEaseFactor - Current ease factor (default 2.5)
 * @param currentInterval - Current interval in days (default 1)
 * @param currentRepetitions - Current number of repetitions (default 0)
 * @returns Updated SM-2 values
 */
export function calculateSM2(
  quality: number,
  currentEaseFactor: number = 2.5,
  currentInterval: number = 1,
  currentRepetitions: number = 0
): SM2Result {
  // Ensure quality is between 0 and 5
  quality = Math.max(0, Math.min(5, quality))
  
  // Calculate new ease factor
  let newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  
  // Ease factor should never be less than 1.3
  newEaseFactor = Math.max(1.3, newEaseFactor)
  
  let newInterval: number
  let newRepetitions: number
  
  if (quality < 3) {
    // Incorrect response - reset interval to 1 day and repetitions to 0
    newInterval = 1
    newRepetitions = 0
  } else {
    // Correct response - increment repetitions
    newRepetitions = currentRepetitions + 1
    
    if (newRepetitions === 1) {
      newInterval = 1
    } else if (newRepetitions === 2) {
      newInterval = 6
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor)
    }
  }
  
  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions
  }
}

/**
 * Calculate the next review date based on interval
 */
export function calculateNextReviewDate(intervalDays: number): Date {
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + intervalDays)
  return nextReview
}

/**
 * Check if a card is due for review
 */
export function isCardDue(nextReviewDate: string | Date): boolean {
  const now = new Date()
  const reviewDate = typeof nextReviewDate === 'string' ? new Date(nextReviewDate) : nextReviewDate
  return reviewDate <= now
}

/**
 * Get cards due for review from a list of cards
 */
export function getDueCards(cards: SRSCard[]): SRSCard[] {
  return cards.filter(card => isCardDue(card.next_review))
}

/**
 * Sort cards by next review date (earliest first)
 */
export function sortCardsByDueDate(cards: SRSCard[]): SRSCard[] {
  return [...cards].sort((a, b) => {
    const dateA = new Date(a.next_review).getTime()
    const dateB = new Date(b.next_review).getTime()
    return dateA - dateB
  })
}

/**
 * Convert confidence level (1-5) to quality rating (0-5) for SM-2
 * This maps user-friendly confidence ratings to SM-2 quality ratings
 */
export function confidenceToQuality(confidence: number, wasCorrect: boolean): number {
  if (!wasCorrect) {
    // If answer was incorrect, map to lower quality ratings (0-2)
    return Math.max(0, confidence - 3)
  }
  // If correct, use confidence as quality directly (3-5)
  return Math.max(3, confidence)
}

/**
 * Get descriptive text for confidence level
 */
export function getConfidenceText(level: number): string {
  const texts = {
    1: 'No idea',
    2: 'Hard to recall',
    3: 'Some difficulty',
    4: 'Somewhat easy',
    5: 'Very easy'
  }
  return texts[level as keyof typeof texts] || 'Unknown'
}
