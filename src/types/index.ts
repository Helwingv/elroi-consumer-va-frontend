export interface User {
  id: string;
  name: string;
  email: string;
  twoFactorEnabled: boolean;
  profile?: UserProfile;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  website?: string;
  privacyPolicy?: string;
}

export interface Contract {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'ended';
  companyId: string;
  company?: Company;
  createdAt: string;
  updatedAt: string;
}

export interface DataElement {
  id: string;
  name: string;
  description: string;
  type: string;
  sensitive: boolean;
  category: string;
}

export interface UserDataElement {
  id: string;
  userId: string;
  companyId: string;
  dataElementId: string;
  status: 'granted' | 'revoked';
  dataElement?: DataElement;
  company?: Company;
}

export interface PrivacyStatement {
  id: string;
  companyId: string;
  title: string;
  content: string;
  version: string;
  status: 'draft' | 'published';
  effectiveDate: string;
  company?: Company;
}

export interface DashboardCounts {
  companies: number;
  contracts: number;
  dataElements: number;
  privacyStatements: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  contractNotifications: boolean;
  privacyNotifications: boolean;
  marketingNotifications: boolean;
}