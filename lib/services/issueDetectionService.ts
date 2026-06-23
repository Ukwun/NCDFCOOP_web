export interface DetectedIssue {
  issueId: string;
  issueType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestedAction: string;
  affectedCount: number;
  impactValue?: number;
  firstDetected: Date;
  lastDetected: Date;
}

export class IssueDetectionService {
  static async detectAllIssues(startDate: Date, endDate: Date): Promise<DetectedIssue[]> {
    return [];
  }
}
