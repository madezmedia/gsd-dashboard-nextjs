import posthog from 'posthog-js';

/**
 * Track Assessment Booking conversion event
 * @param tier - Selected tier (e.g. "Tier 1" or "Tier 2")
 * @param companyName - Optional company name
 */
export function trackAssessmentBooking(tier: string, companyName?: string): void {
  if (typeof window !== 'undefined') {
    posthog.capture('assessment_booking', {
      tier,
      company_name: companyName || 'Unknown',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Track ROI Calculator interaction event
 * @param employeeCount - Team size / employee count
 * @param calculatedSavings - Calculated annual or total savings amount
 */
export function trackRoiCalculatorInteraction(employeeCount: number, calculatedSavings: number): void {
  if (typeof window !== 'undefined') {
    posthog.capture('roi_calculator_interaction', {
      employee_count: employeeCount,
      calculated_savings: calculatedSavings,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Track Coaching Enrollment conversion event
 */
export function trackCoachingEnrollment(): void {
  if (typeof window !== 'undefined') {
    posthog.capture('coaching_enrollment', {
      plan: 'Monthly Coaching Retainer',
      price: 1500,
      timestamp: new Date().toISOString(),
    });
  }
}
