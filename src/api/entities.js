// Base44 dependency removed. This file now exposes lightweight stubs so the
// app can build without the SDK. Replace these implementations with your real
// data layer (REST/GraphQL/etc.).

const createEntityStub = () => ({
  list: async () => [],
  filter: async () => [],
  get: async () => ({}),
  create: async () => ({}),
  update: async () => ({}),
  delete: async () => {},
  deleteMany: async () => {},
  bulkCreate: async () => [],
  importEntities: async () => ({}),
});

export const School = createEntityStub();
export const Student = createEntityStub();
export const Gatekeeper = createEntityStub();
export const Attendance = createEntityStub();
export const RegistrationLink = createEntityStub();
export const Notification = createEntityStub();
export const Conversation = createEntityStub();
export const Message = createEntityStub();
export const BroadcastMessage = createEntityStub();
export const Batch = createEntityStub();
export const Holiday = createEntityStub();
export const CustomPlanRequest = createEntityStub();
export const LicenseKey = createEntityStub();

export const User = {
  me: async () => ({}),
  updateMe: async () => ({}),
  login: () => {},
  logout: async () => {},
  setToken: () => {},
  isAuthenticated: async () => false,
};