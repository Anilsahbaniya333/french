/**
 * Methodology page content schema
 */

export interface MethodologyContent {
  id?: string;
  introduction?: string | null;
  teachingApproach?: string | null;
  weeklyStructure?: string | null;
  grammarApproach?: string | null;
  listeningApproach?: string | null;
  speakingApproach?: string | null;
  readingApproach?: string | null;
  writingApproach?: string | null;
  assignmentWorkflow?: string | null;
  progressTracking?: string | null;
  updatedAt?: string;
}
