
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  link: string;
  datePublished: string;
  querySource: string;
}

export interface AgentStatus {
  isSearching: boolean;
  currentQueryIndex: number;
  totalQueries: number;
  logs: string[];
}

export enum AppStep {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED'
}
