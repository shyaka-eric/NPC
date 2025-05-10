import { Item, Request, Log, UserRole, ItemStatus, RequestType, RequestStatus } from '../types';

const itemCategories = ['Uniform', 'Electronics', 'Office Supplies', 'Tools', 'Vehicles', 'Communications'];
const itemNames = {
  'Uniform': ['Combat Uniform', 'Dress Uniform', 'Tactical Vest', 'Boots', 'Helmet', 'Gloves'],
  'Electronics': ['Radio', 'Laptop', 'Tablet', 'Phone', 'GPS', 'Night Vision'],
  'Office Supplies': ['Printer', 'Paper', 'Pens', 'Stapler', 'Clipboard', 'Calculator'],
  'Tools': ['Wrench Set', 'Screwdriver Set', 'Drill', 'Saw', 'Hammer', 'Pliers'],
  'Vehicles': ['Jeep', 'Truck', 'ATV', 'Motorcycle', 'Tank', 'Helicopter'],
  'Communications': ['Satellite Phone', 'Walkie Talkie', 'Field Phone', 'Antenna', 'Signal Booster']
};

const itemStatuses: ItemStatus[] = ['in-stock', 'in-use', 'under-repair', 'damaged'];
const requestTypes: RequestType[] = ['new', 'repair'];
const requestStatuses: RequestStatus[] = ['pending', 'approved', 'denied', 'issued', 'completed'];

const users = [
  { id: '1', name: 'John Doe', role: 'unit-leader' },
  { id: '2', name: 'Jane Smith', role: 'admin' },
  { id: '3', name: 'Mike Johnson', role: 'logistics-officer' },
  { id: '4', name: 'Sarah Williams', role: 'system-admin' }
];

const actionTypes = [
  'User Login',
  'Item Request',
  'Request Approval',
  'Request Denial',
  'Item Issuance',
  'Stock Update',
  'Repair Report',
  'User Management',
  'System Configuration'
];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateMockItems(count: number): Item[] {
  const items: Item[] = [];
  
  for (let i = 0; i < count; i++) {
    const category = getRandomItem(itemCategories);
    const name = getRandomItem(itemNames[category as keyof typeof itemNames]);
    const status = getRandomItem(itemStatuses);
    
    items.push({
      id: `item-${i+1}`,
      name,
      category,
      description: `${name} for ${category} department`,
      quantity: getRandomInt(1, 100),
      status,
      assignedTo: status === 'in-use' ? getRandomItem(users).id : undefined,
      expirationDate: Math.random() > 0.7 ? randomDate(new Date(), new Date(new Date().setFullYear(new Date().getFullYear() + 2))) : undefined,
      createdAt: randomDate(new Date(2022, 0, 1), new Date(2023, 0, 1)),
      updatedAt: randomDate(new Date(2023, 0, 1), new Date())
    });
  }
  
  return items;
}

export function generateMockRequests(count: number): Request[] {
  const requests: Request[] = [];
  
  for (let i = 0; i < count; i++) {
    const requestedBy = getRandomItem(users);
    const type = getRandomItem(requestTypes);
    const status = getRandomItem(requestStatuses);
    const category = getRandomItem(itemCategories);
    const itemName = getRandomItem(itemNames[category as keyof typeof itemNames]);
    
    const requestedAt = randomDate(new Date(2023, 0, 1), new Date());
    let approvedAt, approvedBy, issuedAt, issuedBy, deniedAt, deniedBy, reason;
    
    if (status !== 'pending') {
      const admin = users.find(u => u.role === 'admin');
      approvedBy = status === 'denied' ? undefined : admin?.id;
      approvedAt = status === 'denied' ? undefined : randomDate(requestedAt, new Date());
      
      if (status === 'denied') {
        deniedBy = admin?.id;
        deniedAt = randomDate(requestedAt, new Date());
        reason = 'Item not available or request not justified.';
      }
      
      if (status === 'issued' || status === 'completed') {
        const logisticsOfficer = users.find(u => u.role === 'logistics-officer');
        issuedBy = logisticsOfficer?.id;
        issuedAt = randomDate(approvedAt as Date, new Date());
      }
    }
    
    requests.push({
      id: `request-${i+1}`,
      type,
      itemId: `item-${getRandomInt(1, count)}`,
      itemName,
      quantity: getRandomInt(1, 10),
      requestedBy: requestedBy.id,
      requestedByName: requestedBy.name,
      requestedAt,
      status,
      approvedBy,
      approvedAt,
      issuedBy,
      issuedAt,
      deniedBy,
      deniedAt,
      reason,
      attachments: type === 'repair' ? ['photo-url-example.jpg'] : undefined
    });
  }
  
  return requests;
}

export function generateMockLogs(count: number): Log[] {
  const logs: Log[] = [];
  
  for (let i = 0; i < count; i++) {
    const user = getRandomItem(users);
    const action = getRandomItem(actionTypes);
    
    let details = '';
    switch (action) {
      case 'User Login':
        details = `${user.name} logged into the system`;
        break;
      case 'Item Request':
        details = `${user.name} requested item ${getRandomItem(itemNames.Electronics)}`;
        break;
      case 'Request Approval':
        details = `${user.name} approved request #REQ-${getRandomInt(1000, 9999)}`;
        break;
      case 'Request Denial':
        details = `${user.name} denied request #REQ-${getRandomInt(1000, 9999)}`;
        break;
      case 'Item Issuance':
        details = `${user.name} issued item ${getRandomItem(itemNames.Uniform)} to user ${getRandomItem(users).name}`;
        break;
      case 'Stock Update':
        details = `${user.name} updated stock for ${getRandomItem(itemNames.Tools)}`;
        break;
      case 'Repair Report':
        details = `${user.name} reported repair for ${getRandomItem(itemNames.Electronics)}`;
        break;
      case 'User Management':
        details = `${user.name} added new user account`;
        break;
      case 'System Configuration':
        details = `${user.name} updated system settings`;
        break;
    }
    
    logs.push({
      id: `log-${i+1}`,
      userId: user.id,
      userName: user.name,
      action,
      details,
      timestamp: randomDate(new Date(2023, 0, 1), new Date())
    });
  }
  
  // Sort logs by timestamp, newest first
  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}