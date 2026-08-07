import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { listOrganizationUsers } from './userService';

// const now = new Date();

describe('listOrganizationUsers', () => {
  it('scopes the query to the organization', async () => {
    jest.spyOn(prisma.user, 'findMany').mockResolvedValue([
      {
        id: 'user_1',
        name: 'Ada Admin',
        email: 'admin@acme.test',
        role: Role.ADMIN,
        department: null,
        position: null,
        employmentType: null,
        salary: null,
      },
    ] as never);

    const result = await listOrganizationUsers('org_1');

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org_1' } }),
    );
    expect(result).toHaveLength(1);
  });
});
