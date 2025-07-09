import { PrismaClient, Role, PropertyType, PropertyCategory, UnitStatus, FacingDirection, MediaType, InfrastructureItem } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Utility functions for random data generation
const getRandomEnum = <T>(enumObj: { [key: string]: T }): T => {
  const values = Object.values(enumObj);
  return values[Math.floor(Math.random() * values.length)];
};

const getRandomEnums = <T>(enumObj: { [key: string]: T }, count: number): T[] => {
  const values = Object.values(enumObj);
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(values[Math.floor(Math.random() * values.length)]);
  }
  return result;
};

const generateUser = (role: Role) => {
  const baseUser = {
    email: faker.internet.email(),
    phoneNumber: faker.phone.number({ style: 'international' }),
    name: faker.person.fullName(),
    profileImage: faker.image.avatar(),
    role,
  };

  switch (role) {
    case Role.OWNER:
      return {
        ...baseUser,
        Owner: {
          create: {
            companyName: faker.company.name(),
          },
        },
      };
    case Role.BROKER:
      return {
        ...baseUser,
        Broker: {
          create: {
            isLicensed: faker.datatype.boolean(),
            licenseNumber: faker.string.alphanumeric(8).toUpperCase(),
          },
        },
      };
    case Role.DEVELOPER:
      return {
        ...baseUser,
        Developer: {
          create: {
            isLicensed: faker.datatype.boolean(),
            hasWafi: faker.datatype.boolean(),
            acceptsBanks: faker.datatype.boolean(),
            companyName: faker.company.name(),
          },
        },
      };
    case Role.BUYER:
      return {
        ...baseUser,
        Buyer: {
          create: {
            name: faker.person.firstName(),
            lastName: faker.person.lastName(),
          },
        },
      };
    default:
      return baseUser;
  }
};

const generateProperty = (ownerId: string, brokerId: string, projectId?: string) => {
  const mediaUrls = Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
    url: faker.image.url(),
    key: `properties/${Date.now()}-${faker.string.uuid()}.jpg`,
    type: MediaType.photo,
    name: faker.system.fileName({ extensionCount: 1 }),
  }));

  const videoUrls = Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => ({
    url: faker.internet.url(),
    key: `properties/${Date.now()}-${faker.string.uuid()}.mp4`,
    type: MediaType.video,
    name: faker.system.fileName({ extensionCount: 1 }),
  }));

  const documentUrls = Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => ({
    url: faker.internet.url(),
    key: `properties/${Date.now()}-${faker.string.uuid()}.pdf`,
    type: MediaType.document,
    name: faker.system.fileName({ extensionCount: 1 }),
  }));

  return {
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: faker.number.int({ min: 100000, max: 5000000 }),
    currency: 'USD',
    downPaymentPercentage: faker.number.int({ min: 10, max: 30 }),
    cashBackPercentage: faker.number.int({ min: 0, max: 10 }),
    city: faker.location.city(),
    address: faker.location.streetAddress(),
    space: faker.number.int({ min: 50, max: 2000 }),
    numberOfLivingRooms: faker.number.int({ min: 0, max: 5 }),
    numberOfRooms: faker.number.int({ min: 1, max: 10 }),
    numberOfKitchen: faker.number.int({ min: 1, max: 3 }),
    numberOfWC: faker.number.int({ min: 1, max: 6 }),
    numberOfFloors: faker.number.int({ min: 1, max: 5 }),
    streetWidth: faker.number.int({ min: 5, max: 20 }),
    age: faker.number.int({ min: 0, max: 20 }),
    facing: getRandomEnum(FacingDirection),
    type: getRandomEnum(PropertyType),
    category: getRandomEnum(PropertyCategory),
    unitStatus: getRandomEnum(UnitStatus),
    infrastructureItems: getRandomEnums(InfrastructureItem, faker.number.int({ min: 2, max: 6 })),
    locationLat: faker.location.latitude(),
    locationLng: faker.location.longitude(),
    ownerId,
    brokerId,
    ...(projectId && { projectId }),
    media: {
      create: [...mediaUrls, ...videoUrls, ...documentUrls],
    },
  };
};

const generateProject = (developerId: string) => {
  const mediaUrls = Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
    url: faker.image.url(),
    key: `projects/${Date.now()}-${faker.string.uuid()}.jpg`,
    type: MediaType.photo,
    name: faker.system.fileName({ extensionCount: 1 }),
  }));

  const videoUrls = Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => ({
    url: faker.internet.url(),
    key: `projects/${Date.now()}-${faker.string.uuid()}.mp4`,
    type: MediaType.video,
    name: faker.system.fileName({ extensionCount: 1 }),
  }));

  const documentUrls = Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
    url: faker.internet.url(),
    key: `projects/${Date.now()}-${faker.string.uuid()}.pdf`,
    type: MediaType.document,
    name: faker.system.fileName({ extensionCount: 1 }),
  }));

  return {
    name: faker.company.name(),
    description: faker.commerce.productDescription(),
    city: faker.location.city(),
    type: getRandomEnum(PropertyType),
    category: getRandomEnum(PropertyCategory),
    infrastructureItems: getRandomEnums(InfrastructureItem, faker.number.int({ min: 2, max: 6 })),
    developerId,
    media: {
      create: [...mediaUrls, ...videoUrls, ...documentUrls],
    },
    nearbyPlaces: {
      create: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => ({
        name: faker.location.street(),
        distance: faker.number.float({ min: 0.1, max: 5, fractionDigits: 1 }),
      })),
    },
  };
};

async function main() {
  // Configuration
  const config = {
    users: {
      admin: 1,
      owner: 5,
      broker: 10,
      developer: 3,
      buyer: 20,
    },
    propertiesPerOwner: 10,
    projectsPerDeveloper: 3,
  };

  // Create users
  const users: {
    admin: any[];
    owner: any[];
    broker: any[];
    developer: any[];
    buyer: any[];
  } = {
    admin: [],
    owner: [],
    broker: [],
    developer: [],
    buyer: [],
  };

  // Create admin users
  for (let i = 0; i < config.users.admin; i++) {
    users.admin.push(await prisma.user.create({ data: generateUser(Role.ADMIN) }));
  }

  // Create owner users
  for (let i = 0; i < config.users.owner; i++) {
    users.owner.push(await prisma.user.create({ data: generateUser(Role.OWNER) }));
  }

  // Create broker users
  for (let i = 0; i < config.users.broker; i++) {
    users.broker.push(await prisma.user.create({ data: generateUser(Role.BROKER) }));
  }

  // Create developer users
  for (let i = 0; i < config.users.developer; i++) {
    users.developer.push(await prisma.user.create({ data: generateUser(Role.DEVELOPER) }));
  }

  // Create buyer users
  for (let i = 0; i < config.users.buyer; i++) {
    users.buyer.push(await prisma.user.create({ data: generateUser(Role.BUYER) }));
  }

  // Create projects
  const projects: any[] = [];
  for (const developer of users.developer) {
    for (let i = 0; i < config.projectsPerDeveloper; i++) {
      const project = await prisma.project.create({
        data: generateProject(developer.id),
      });
      projects.push(project);
    }
  }

  // Create properties inside projects
  let totalProperties = 0;
  for (const project of projects) {
    const propertiesInProject = faker.number.int({ min: 3, max: 8 });
    for (let i = 0; i < propertiesInProject; i++) {
      // Use random users with different roles as owners (OWNER, DEVELOPER, BROKER)
      const allPotentialOwners = [...users.owner, ...users.developer, ...users.broker];
      const randomOwner = allPotentialOwners[Math.floor(Math.random() * allPotentialOwners.length)];
      const randomBroker = users.broker[Math.floor(Math.random() * users.broker.length)];
      await prisma.property.create({
        data: generateProperty(randomOwner.id, randomBroker.id, project.id),
      });
      totalProperties++;
    }
  }

  // Create some standalone properties (not in projects)
  const standaloneProperties = 10;
  for (let i = 0; i < standaloneProperties; i++) {
    // Use random users with different roles as owners (OWNER, DEVELOPER, BROKER)
    const allPotentialOwners = [...users.owner, ...users.developer, ...users.broker];
    const randomOwner = allPotentialOwners[Math.floor(Math.random() * allPotentialOwners.length)];
    const randomBroker = users.broker[Math.floor(Math.random() * users.broker.length)];
    await prisma.property.create({
      data: generateProperty(randomOwner.id, randomBroker.id),
    });
    totalProperties++;
  }

  console.log('Database has been seeded. 🌱');
  console.log('Created:');
  console.log(`- ${users.admin.length} admin users`);
  console.log(`- ${users.owner.length} owner users`);
  console.log(`- ${users.broker.length} broker users`);
  console.log(`- ${users.developer.length} developer users`);
  console.log(`- ${users.buyer.length} buyer users`);
  console.log(`- ${totalProperties} properties`);
  console.log(`- ${users.developer.length * config.projectsPerDeveloper} projects`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 