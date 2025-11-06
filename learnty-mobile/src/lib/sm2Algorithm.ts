/**
 * Enhanced SM-2 Spaced Repetition Algorithm
 * Incorporates neuroscience principles, circadian rhythm optimization,
 * and Jim Kwik's learning state optimization
 * 
 * Based on:
 * - Original SM-2 algorithm by Piotr Wozniak
 * - Forgetting curve research by Hermann Ebbinghaus
 * - Circadian rhythm studies for optimal learning times
 * - Jim Kwik's brain performance optimization
 */

interface SM2Result {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  qualityAssessment: string;
  optimalReviewTime: string;
  neuroscience_insights: string[];
}

interface OptimalStudySession {
  focusDuration: number;
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLongBreak: number;
  optimalTimes: string[];
  avoidTimes: string[];
  neuroscience_rationale: string;
}

/**
 * Calculate next review schedule using enhanced SM-2 algorithm
 * @param quality - Performance rating (0-5)
 *   0: Complete blackout, total failure
 *   1: Incorrect response, barely remembered
 *   2: Incorrect but recognized correct answer
 *   3: Correct with significant difficulty
 *   4: Correct with some hesitation
 *   5: Perfect recall, effortless
 * @param easinessFactor - Current easiness factor (1.3-2.5+)
 * @param interval - Current interval in days
 * @param repetitions - Number of consecutive successful reviews
 * @param lastReviewDate - Date of last review
 */
export function calculateNextReview(
  quality: number,
  easinessFactor: number,
  interval: number,
  repetitions: number,
  lastReviewDate: Date = new Date()
): SM2Result {
  // Neuroscience Enhancement 1: Circadian Rhythm Optimization
  const timeOfDay = new Date().getHours();
  const isOptimalTime = 
    (timeOfDay >= 9 && timeOfDay <= 11) ||  // Morning peak
    (timeOfDay >= 15 && timeOfDay <= 17);   // Afternoon peak
  
  // Bonus for learning during optimal times
  const stateBonus = isOptimalTime ? 0.1 : 0;
  
  // Neuroscience Enhancement 2: Sleep Consolidation
  // Reviews done before sleep get a slight bonus
  const isPreSleep = timeOfDay >= 21 && timeOfDay <= 23;
  const sleepBonus = isPreSleep ? 0.05 : 0;

  // Calculate new easiness factor with enhancements
  // Original SM-2: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  let newEF = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Apply state and sleep bonuses
  newEF += stateBonus + sleepBonus;
  
  // Minimum EF to prevent cards from becoming too difficult
  if (newEF < 1.3) newEF = 1.3;
  
  // Cap maximum EF for realistic intervals
  if (newEF > 2.8) newEF = 2.8;

  let newInterval: number;
  let newRepetitions: number;
  const insights: string[] = [];

  // Quality threshold check
  if (quality < 3) {
    // Failed review - reset with forgetting curve consideration
    newRepetitions = 0;
    newInterval = 1; // Start over tomorrow
    
    insights.push(
      '❌ Reset: Review tomorrow. This is normal - the forgetting curve is steep initially.',
      '💡 Tip: Try creating a memory hook or visual association for this card.'
    );
  } else {
    // Successful review - apply spacing with neuroscience optimization
    newRepetitions = repetitions + 1;
    
    // Neuroscience Enhancement 3: Optimized Spacing Intervals
    if (newRepetitions === 1) {
      // First successful review: 1 day
      // Research shows 24 hours is optimal for initial consolidation
      newInterval = 1;
      insights.push(
        '✅ Great start! Your brain will consolidate this during sleep.',
        '🔄 Next review: Tomorrow at the same time for optimal retention.'
      );
    } else if (newRepetitions === 2) {
      // Second review: 6 days (modified from standard 6 for most learners)
      // This hits the optimal point before the forgetting curve drops significantly
      newInterval = 6;
      insights.push(
        '💪 Strong retention! The spacing effect is working.',
        '🧠 Your neural pathways are strengthening.'
      );
    } else {
      // Subsequent reviews: exponential spacing
      newInterval = Math.round(interval * newEF);
      
      // Cap maximum interval at 180 days (6 months) for practical reasons
      if (newInterval > 180) newInterval = 180;
      
      if (newInterval > 30) {
        insights.push(
          '🌟 Excellent! This knowledge is becoming long-term memory.',
          '📅 Long interval means strong retention.'
        );
      }
    }
  }

  // Neuroscience Enhancement 4: Optimal Review Time
  // Schedule reviews during peak cognitive performance times
  const nextReviewDate = new Date(lastReviewDate);
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  
  // Set to optimal morning time (10 AM) by default
  nextReviewDate.setHours(10, 0, 0, 0);
  
  const optimalTime = isOptimalTime 
    ? 'Perfect timing! You\'re in a peak learning state.' 
    : 'Try reviewing during 9-11 AM or 3-5 PM for best results.';

  // Quality assessment feedback
  const assessments: Record<number, string> = {
    0: '🚨 Total blackout - needs reteaching from scratch',
    1: '⚠️ Wrong answer - review immediately and create memory hook',
    2: '🛠️ Recognized but couldn\'t recall - practice active retrieval',
    3: '🟡 Correct with effort - good progress, keep practicing!',
    4: '🟢 Easy recall - excellent retention, neural pathway strong!',
    5: '🌟 Perfect recall - mastered! Knowledge is in long-term memory.'
  };

  // Add neuroscience insights based on performance
  if (quality >= 4) {
    insights.push(
      '🧠 Your myelin sheath is strengthening around these neural pathways!'
    );
  }
  
  if (isOptimalTime) {
    insights.push('⏰ Great timing! Your circadian rhythm is at peak cognitive performance.');
  }

  return {
    easinessFactor: parseFloat(newEF.toFixed(2)),
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
    qualityAssessment: assessments[quality],
    optimalReviewTime: optimalTime,
    neuroscience_insights: insights
  };
}

/**
 * Get optimal review schedule based on difficulty level
 * Incorporates forgetting curve research and spacing effect
 */
export function getOptimalReviewSchedule(
  difficulty: 'easy' | 'medium' | 'hard'
): number[] {
  // Based on forgetting curve research:
  // - Easy content: Slower forgetting, longer intervals
  // - Hard content: Faster forgetting, shorter intervals initially
  
  const schedules = {
    // Easy: Standard exponential growth
    easy: [1, 3, 7, 14, 30, 60, 120],
    
    // Medium: Balanced approach
    medium: [1, 4, 10, 21, 45, 90, 180],
    
    // Hard: More frequent initial reviews
    hard: [1, 2, 5, 12, 25, 50, 100, 180]
  };
  
  return schedules[difficulty];
}

/**
 * Jim Kwik's brain-friendly study session configuration
 * Based on Pomodoro Technique + neuroscience research
 */
export function getOptimalStudySession(): OptimalStudySession {
  return {
    // Pomodoro-style focus duration
    focusDuration: 25, // minutes - optimal attention span
    
    // Short break for recovery
    shortBreak: 5, // minutes - allows mental reset
    
    // Long break for deeper recovery
    longBreak: 15, // minutes - allows memory consolidation
    
    // Sessions before long break
    sessionsBeforeLongBreak: 4, // Classic Pomodoro pattern
    
    // Peak cognitive performance times
    optimalTimes: [
      '9:00-11:00 AM',  // Morning peak - highest alertness
      '3:00-5:00 PM'    // Afternoon peak - second wind
    ],
    
    // Times to avoid for challenging learning
    avoidTimes: [
      '1:00-3:00 PM',   // Post-lunch dip (adenosine buildup)
      '10:00 PM-6:00 AM' // Circadian low point
    ],
    
    // Neuroscience rationale
    neuroscience_rationale: 'Cortisol and core body temperature peak 2-4 hours after waking. The post-lunch dip is caused by adenosine buildup. 25-minute sessions match natural attention spans and prevent mental fatigue.'
  };
}

/**
 * Calculate optimal learning state score (0-100)
 * Based on Jim Kwik's FASTER method - State optimization
 */
export function calculateLearningStateScore(
  timeOfDay: number,
  energyLevel: 'low' | 'medium' | 'high',
  focusLevel: 'distracted' | 'neutral' | 'focused',
  stressLevel: 'high' | 'medium' | 'low'
): number {
  let score = 50; // Base score
  
  // Time of day impact (30 points)
  if ((timeOfDay >= 9 && timeOfDay <= 11) || (timeOfDay >= 15 && timeOfDay <= 17)) {
    score += 30; // Peak times
  } else if (timeOfDay >= 1 && timeOfDay <= 3) {
    score -= 20; // Post-lunch dip
  } else if (timeOfDay >= 22 || timeOfDay <= 6) {
    score -= 30; // Late night / early morning
  }
  
  // Energy level impact (25 points)
  const energyScores = { high: 25, medium: 0, low: -25 };
  score += energyScores[energyLevel];
  
  // Focus level impact (25 points)
  const focusScores = { focused: 25, neutral: 0, distracted: -25 };
  score += focusScores[focusLevel];
  
  // Stress level impact (20 points)
  const stressScores = { low: 20, medium: 0, high: -20 };
  score += stressScores[stressLevel];
  
  // Normalize to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get personalized study recommendations based on current state
 */
export function getStudyRecommendations(
  stateScore: number
): string[] {
  if (stateScore >= 80) {
    return [
      '🌟 Excellent state! Perfect for challenging material.',
      '📚 Focus on: New concepts, difficult flashcards, synthesis tasks.',
      '⏱️ Aim for: 45-60 minute deep work session.'
    ];
  } else if (stateScore >= 60) {
    return [
      '🟢 Good state for learning.',
      '📚 Focus on: Regular reviews, practice problems.',
      '⏱️ Aim for: 25-30 minute focused sessions.'
    ];
  } else if (stateScore >= 40) {
    return [
      '🟡 Moderate state - adjust approach.',
      '📚 Focus on: Easy reviews, familiar material.',
      '💡 Tip: Take a 5-minute walk or do light stretches first.'
    ];
  } else {
    return [
      '🔴 Suboptimal state - consider rescheduling.',
      '☕ Suggestion: Take a break, hydrate, or come back during peak hours.',
      '😴 Alternative: If tired, prioritize sleep - learning happens during rest!'
    ];
  }
}

/**
 * Memory technique suggestions based on content type
 * Jim Kwik's memory palace and association techniques
 */
export function getMemoryTechniqueForContent(
  contentType: 'definition' | 'process' | 'list' | 'concept' | 'numerical'
): { technique: string; description: string; example: string } {
  const techniques = {
    definition: {
      technique: 'Acronym + Visualization',
      description: 'Create an acronym and vivid mental image',
      example: 'For "Photosynthesis", think: "Plants Have Oper amazing Technology Of Synthesizing". Visualize a plant as a high-tech factory.'
    },
    process: {
      technique: 'Story Method',
      description: 'Convert steps into a memorable narrative',
      example: 'For cell division: "The Cell Commander (nucleus) orders troops (chromosomes) to line up, then splits forces to conquer new territories (daughter cells)."'
    },
    list: {
      technique: 'Memory Palace',
      description: 'Place items in familiar locations',
      example: 'To remember planets: Walk through your house placing each planet in a room. Sun at front door, Mercury in hallway, etc.'
    },
    concept: {
      technique: 'Analogy + Association',
      description: 'Link to something you already know well',
      example: 'Electricity is like water: Voltage = pressure, Current = flow rate, Resistance = pipe narrowness.'
    },
    numerical: {
      technique: 'Chunking + Pattern',
      description: 'Break into groups and find patterns',
      example: 'For 1776: "Three sevens minus one, then six (1-7-7-6). Independence Day pattern!"'
    }
  };
  
  return techniques[contentType];
}

/**
 * Assess if it's time for a review checkpoint
 * Implements interleaving and review checkpoints
 */
export function shouldCreateReviewCheckpoint(
  completedMilestones: number
): boolean {
  // Review checkpoint every 3 milestones
  // This implements the testing effect and interleaving
  return completedMilestones > 0 && completedMilestones % 3 === 0;
}

/**
 * Get interleaving suggestions for practice
 */
export function getInterleavingSuggestions(
  currentTopic: string,
  previousTopics: string[]
): string[] {
  if (previousTopics.length === 0) {
    return ['Focus on mastering this topic first.'];
  }
  
  const suggestions = [
    `🔄 Mix in review from: ${previousTopics[previousTopics.length - 1]}`,
    '🧠 Interleaving strengthens learning by forcing discrimination between concepts.',
    `📚 Pattern: Study ${currentTopic} (15 min) → Review ${previousTopics[0]} (5 min) → Continue ${currentTopic}`
  ];
  
  return suggestions;
}
