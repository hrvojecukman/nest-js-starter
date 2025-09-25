import { PrismaClient, Role, PropertyType, PropertyCategory, UnitStatus, FacingDirection, MediaType, InfrastructureItem, ProjectTimelineType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { S2CellId, S2LatLng } from "nodes2ts";

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

const getRandomSaudiCity = (): string => {
  const saudiCities = [
    'Jeddah',
    'Mecca',
    'Madina',
    'Abha',
    'Tabuk',
    'Qassim',
    'Taif',
    'Madinah',
    'Riyadh', 
    'Dammam', 
  ];
  return saudiCities[Math.floor(Math.random() * saudiCities.length)];
};

export function capForLevel(level: number): number {
  if (level >= 16) return 4000;  // Neighborhood level
  if (level >= 14) return 2500;  // District level
  if (level >= 12) return 1200;  // City level
  if (level >= 10) return 800;   // Region level
  if (level >= 8) return 500;    // Country level
  return 300; // World level
}

export function tokenAtLevel(lat: number, lng: number, level: number): string {
  const ll = S2LatLng.fromDegrees(lat, lng);
  const cellId = S2CellId.fromPoint(ll.toPoint());
  return cellId.parentL(level).toToken();
}

export function parentToken(token: string, level: number): string {
  return S2CellId.fromToken(token).parentL(level).toToken();
}

export function normalizeTilesForLevel(
  tiles: string[],
  level: number
): { column: "s2L6" | "s2L8" | "s2L10" | "s2L12" | "s2L16"; tokens: string[]; level: number } {
  if (level <= 6) {
    return { column: "s2L6", tokens: dedupe(tiles.map(t => parentToken(t, 6))), level };
  }
  
  if (level <= 8) {
    return { column: "s2L8", tokens: dedupe(tiles.map(t => parentToken(t, 8))), level };
  }
  
  if (level <= 10) {
    return { column: "s2L10", tokens: dedupe(tiles.map(t => parentToken(t, 10))), level };
  }

  if (level <= 12) {
    return { column: "s2L12", tokens: dedupe(tiles.map(t => parentToken(t, 12))), level };
  }

  return { column: "s2L16", tokens: dedupe(tiles.map(t => parentToken(t, 16))), level };
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

const getSaudiCoordinates = (city: string): { lat: number; lng: number } => {
  // Saudi Arabia coordinate bounds
  const saudiBounds = {
    lat: { min: 16.0, max: 32.0 },
    lng: { min: 34.0, max: 55.0 }
  };
  
  // Generate random coordinates within Saudi Arabia
  const lat = faker.number.float({ 
    min: saudiBounds.lat.min, 
    max: saudiBounds.lat.max,
    fractionDigits: 4 
  });
  const lng = faker.number.float({ 
    min: saudiBounds.lng.min, 
    max: saudiBounds.lng.max,
    fractionDigits: 4 
  });
  
  return { lat, lng };
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
            lastName: faker.person.lastName(),
            doesOwnProperty: faker.datatype.boolean(),
            propertyType: faker.helpers.arrayElement(Object.values(PropertyType)),
            doesOwnPropertyWithElectronicDeed: faker.datatype.boolean(),
            purposeOfRegistration: faker.number.int({ min: 1, max: 5 }),
            developerPartnership: faker.number.int({ min: 1, max: 3 }),
            lookingForDeveloperPartnership: faker.datatype.boolean(),
          },
        },
      };
    case Role.BROKER:
      return {
        ...baseUser,
        Broker: {
          create: {
            lastName: faker.person.lastName(),
            licenseNumber: faker.string.alphanumeric(8).toUpperCase(),
            description: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
            propertyType: faker.helpers.arrayElement(Object.values(PropertyType)),
            expectedNumberOfAdsPerMonth: faker.number.int({ min: 1, max: 20 }),
            hasExecutedSalesTransaction: faker.datatype.boolean(),
            useDigitalPromotion: faker.datatype.boolean(),
            wantsAdvertising: faker.datatype.boolean(),
          },
        },
      };
    case Role.DEVELOPER:
      return {
        ...baseUser,
        Developer: {
          create: {
            // Company info
            companyName: faker.company.name(),
            entityType: faker.helpers.arrayElement(['company', 'institution']),
            developerCity: getRandomSaudiCity(),
            propertyType: faker.helpers.arrayElement(Object.values(PropertyType)),
            annualProjectCount: faker.helpers.arrayElement(['from1To4', 'from5To9', 'moreThan10']),
            totalNumberOfUnits: faker.helpers.arrayElement(['from1To15', 'from16To30', 'moreThan30']),
            
            // Representative info
            representativeName: faker.person.fullName(),
            representativePhone: faker.phone.number(),
            representativePosition: faker.helpers.arrayElement(['CEO', 'Director', 'Manager', 'Owner']),
            representativeEmail: faker.internet.email(),
            
            // Social/Contact
            websiteUrl: faker.datatype.boolean() ? faker.internet.url() : null,
            xAccountUrl: faker.datatype.boolean() ? faker.internet.url() : null,
            snapchatAccountUrl: faker.datatype.boolean() ? faker.internet.url() : null,
            linkedinAccountUrl: faker.datatype.boolean() ? faker.internet.url() : null,
            
            // Existing fields (made optional)
            licenseNumber: faker.datatype.boolean() ? faker.string.alphanumeric(8).toUpperCase() : null,
            hasWafi: faker.datatype.boolean(),
            acceptsBanks: faker.datatype.boolean(),
            description: faker.lorem.paragraph(),
            location: getRandomSaudiCity(),
          },
        },
      };
    case Role.BUYER:
      return {
        ...baseUser,
        Buyer: {
          create: {
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

  const city = getRandomSaudiCity();
  const { lat: locationLat, lng: locationLng } = getSaudiCoordinates(city);
  
  return {
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: faker.number.int({ min: 100000, max: 5000000 }),
    currency: 'USD',
    downPaymentPercentage: faker.number.int({ min: 10, max: 30 }),
    cashBackPercentage: faker.number.int({ min: 0, max: 10 }),
    discountPercentage: faker.datatype.boolean() ? faker.number.int({ min: 5, max: 25 }) : null,
    city,
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
    locationLat,
    locationLng,
    s2L6: tokenAtLevel(locationLat, locationLng, 6),
    s2L8: tokenAtLevel(locationLat, locationLng, 8),
    s2L10: tokenAtLevel(locationLat, locationLng, 10),
    s2L12: tokenAtLevel(locationLat, locationLng, 12),
    s2L16: tokenAtLevel(locationLat, locationLng, 16),
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

  // Generate timeline data
  const timelineData = [
    {
      type: ProjectTimelineType.start,
      title: 'Project Planning & Permits',
      description: 'Initial planning phase including permits and approvals',
      startDate: faker.date.past({ years: 1 }),
      endDate: faker.date.recent({ days: 30 }),
      isInProgress: false,
      isCompleted: true,
      progress: 100,
      notes: 'All permits obtained successfully. Planning phase completed on schedule.'
    },
    {
      type: ProjectTimelineType.underConstruction,
      title: 'Foundation & Structure',
      description: 'Foundation work and main structure construction',
      startDate: faker.date.recent({ days: 30 }),
      endDate: faker.date.future({ years: 1 }),
      isInProgress: true,
      isCompleted: false,
      progress: faker.number.int({ min: 20, max: 80 }),
      notes: 'Foundation completed. Main structure construction in progress.'
    },
    {
      type: ProjectTimelineType.underConstruction,
      title: 'Interior & Finishing',
      description: 'Interior work and final finishing touches',
      startDate: faker.date.future({ years: 1 }),
      endDate: faker.date.future({ years: 2 }),
      isInProgress: false,
      isCompleted: false,
      progress: 0,
      notes: 'Scheduled to begin after structure completion.'
    },
    {
      type: ProjectTimelineType.completed,
      title: 'Project Completion',
      description: 'Final inspection and project handover',
      startDate: faker.date.future({ years: 2 }),
      endDate: faker.date.future({ years: 2 }),
      isInProgress: false,
      isCompleted: false,
      progress: 0,
      notes: 'Expected completion date. Final inspection and handover phase.'
    }
  ];

  const city = getRandomSaudiCity();
  const { lat: locationLat, lng: locationLng } = getSaudiCoordinates(city);
  
  return {
    name: faker.company.name(),
    description: faker.commerce.productDescription(),
    city,
    type: getRandomEnum(PropertyType),
    category: getRandomEnum(PropertyCategory),
    infrastructureItems: getRandomEnums(InfrastructureItem, faker.number.int({ min: 2, max: 6 })),
    locationLat,
    locationLng,
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
    timeline: {
      create: timelineData,
    },
  };
};


export async function seedDemo(prisma: PrismaClient): Promise<void> {

  const seedMode = process.env.SEED_MODE ?? 'baseline'; // 'baseline' | 'demo'

  if (seedMode !== 'demo') return;
  
  const config = {
    users: {
      owner: 10,
      broker: 20,
      developer: 10,
      buyer: 100,
    },
    propertiesPerOwner: 30,
    projectsPerDeveloper: 20,
  };

  const users: {
    owner: any[];
    broker: any[];
    developer: any[];
    buyer: any[];
  } = {
    owner: [],
    broker: [],
    developer: [],
    buyer: [],
  };

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
  for (const project of projects) {
    const propertiesInProject = faker.number.int({ min: 3, max: 8 });
    for (let i = 0; i < propertiesInProject; i++) {
      const allPotentialOwners = [...users.owner, ...users.developer, ...users.broker];
      const randomOwner = allPotentialOwners[Math.floor(Math.random() * allPotentialOwners.length)];
      const randomBroker = users.broker[Math.floor(Math.random() * users.broker.length)];
      await prisma.property.create({
        data: generateProperty(randomOwner.id, randomBroker.id, project.id),
      });
    }
  }

  // Create some standalone properties (not in projects)
  const standaloneProperties = 10;
  for (let i = 0; i < standaloneProperties; i++) {
    const allPotentialOwners = [...users.owner, ...users.developer, ...users.broker];
    const randomOwner = allPotentialOwners[Math.floor(Math.random() * allPotentialOwners.length)];
    const randomBroker = users.broker[Math.floor(Math.random() * users.broker.length)];
    await prisma.property.create({
      data: generateProperty(randomOwner.id, randomBroker.id),
    });
  }

  // Notifications (attach to all users)
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  const categories = ['project_update', 'property_alert', 'system', 'promotion'];
  const notificationsToCreate = 30;
  const notificationIds: string[] = [];
  for (let i = 0; i < notificationsToCreate; i++) {
    const title = faker.lorem.sentence();
    const body = faker.lorem.sentences({ min: 1, max: 2 });
    const category = faker.helpers.arrayElement(categories);
    const createdAt = faker.date.recent({ days: 30 });
    const notif = await prisma.notification.create({
      data: { title, body, category, data: { deepLink: `/notifications/${i + 1}` }, createdAt },
    });
    notificationIds.push(notif.id);
    const recipientCount = faker.number.int({ min: 5, max: 30 });
    const shuffled = faker.helpers.shuffle(allUsers);
    const recipients = shuffled.slice(0, Math.min(recipientCount, allUsers.length));
    await prisma.notificationRecipient.createMany({
      data: recipients.map((u) => ({
        notificationId: notif.id,
        userId: u.id,
        ...(faker.datatype.boolean() ? { readAt: faker.date.between({ from: createdAt, to: new Date() }) } : {}),
      })),
      skipDuplicates: true,
    });
  }

  // Ensure every user has some notifications: attach each user to 3 random notifications
  for (const u of allUsers) {
    const picks = faker.helpers.shuffle(notificationIds).slice(0, Math.min(3, notificationIds.length));
    await prisma.notificationRecipient.createMany({
      data: picks.map((nid) => ({
        notificationId: nid,
        userId: u.id,
        ...(faker.datatype.boolean() ? { readAt: faker.date.recent({ days: 10 }) } : {}),
        createdAt: faker.date.recent({ days: 30 }),
      })),
      skipDuplicates: true,
    });
  }

  // eslint-disable-next-line no-console
  console.log('Demo seed complete.');
  console.log('Created:');
  console.log(`- ${users.owner.length} owner users`);
  console.log(`- ${users.broker.length} broker users`);
  console.log(`- ${users.developer.length} developer users`);
  console.log(`- ${users.buyer.length} buyer users`);
  console.log(`- ${projects.length} projects`);
  console.log(`- ${standaloneProperties} standalone properties`);
  console.log(`- ${notificationsToCreate} notifications`);
}
