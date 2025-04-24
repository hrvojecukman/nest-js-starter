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

const generateProperty = (ownerId: string, brokerId: string) => ({
  title: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  price: faker.number.int({ min: 100000, max: 5000000 }),
  currency: 'USD',
  downPaymentPercentage: faker.number.int({ min: 10, max: 30 }),
  cashBackPercentage: faker.number.int({ min: 0, max: 10 }),
  cityDis: faker.location.city(),
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
  images: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.image.url()),
  mediaTypes: getRandomEnums(MediaType, faker.number.int({ min: 1, max: 3 })),
  infrastructureItems: getRandomEnums(InfrastructureItem, faker.number.int({ min: 2, max: 6 })),
  locationLat: faker.location.latitude(),
  locationLng: faker.location.longitude(),
  ownerId,
  brokerId,
});

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

  // Create properties
  for (const owner of users.owner) {
    for (let i = 0; i < config.propertiesPerOwner; i++) {
      const randomBroker = users.broker[Math.floor(Math.random() * users.broker.length)];
      await prisma.property.create({
        data: generateProperty(owner.id, randomBroker.id),
      });
    }
  }

  console.log('Database has been seeded. 🌱');
  console.log('Created:');
  console.log(`- ${users.admin.length} admin users`);
  console.log(`- ${users.owner.length} owner users`);
  console.log(`- ${users.broker.length} broker users`);
  console.log(`- ${users.developer.length} developer users`);
  console.log(`- ${users.buyer.length} buyer users`);
  console.log(`- ${users.owner.length * config.propertiesPerOwner} properties`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 