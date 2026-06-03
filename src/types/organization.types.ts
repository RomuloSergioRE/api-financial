export type OrgMemberRole = 'admin' | 'finance' | 'viewer';
export type OrgMemberStatus = 'active' | 'pending';

export interface OrganizationInterface {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMemberInterface {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgMemberRole;
  status: OrgMemberStatus;
  invitedBy: string;
  createdAt: Date;
}

export type OrganizationCreateInput = {
  name: string;
};

export type OrganizationUpdateInput = {
  name: string;
};

export type InviteMemberInput = {
  email: string;
  role?: OrgMemberRole;
};

export type UpdateMemberRoleInput = {
  role: OrgMemberRole;
};

export type AcceptInviteInput = {
  status: 'active';
};

export type OrgMemberDTO = {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: OrgMemberRole;
  status: OrgMemberStatus;
  invitedAt: Date;
};

export type OrganizationDTO = {
  id: string;
  name: string;
  ownerId: string;
  role: OrgMemberRole;
  memberCount: number;
  createdAt: Date;
};
