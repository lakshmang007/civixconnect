export enum IssueStatus {
  COMMUNITY_POLL = 'Community Poll',
  ESCALATED = 'Escalated to Authority',
  RESOLVED = 'Resolved'
}

export type Category = 'Booth' | 'Roll' | 'Process' | 'ID' | 'Other';

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: Category;
  location?: { lat: number; lng: number };
  status: IssueStatus;
  votesCount: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  zipCode: string;
  imageUrl?: string;
  authorityId?: string;
}

export interface ZipCode {
  id: string;
  code: string;
  name: string;
}

export type AuthorityStatus = 'In-Office' | 'On-Field' | 'Unavailable';

export interface Authority {
  id: string;
  name: string;
  department: string;
  status: AuthorityStatus;
  resolutionCount: number;
  photoUrl?: string;
  achievements?: string[];
  zipCodes?: string[];
}

export interface Vote {
  userId: string;
  issueId: string;
  createdAt: Date;
}
