
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  detectRuntime,
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.10.2
 * Query Engine version: 5a9203d0590c951969e85a7d07215503f4672eb9
 */
Prisma.prismaVersion = {
  client: "5.10.2",
  engine: "5a9203d0590c951969e85a7d07215503f4672eb9"
}

Prisma.PrismaClientKnownRequestError = () => {
  throw new Error(`PrismaClientKnownRequestError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  throw new Error(`PrismaClientUnknownRequestError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  throw new Error(`PrismaClientRustPanicError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  throw new Error(`PrismaClientInitializationError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  throw new Error(`PrismaClientValidationError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  throw new Error(`NotFoundError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  throw new Error(`sqltag is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  throw new Error(`empty is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  throw new Error(`join is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  throw new Error(`raw is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  throw new Error(`Extensions.getExtensionContext is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  throw new Error(`Extensions.defineExtension is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  Serializable: 'Serializable'
});

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  systemOwnerId: 'systemOwnerId',
  companyId: 'companyId',
  action: 'action',
  role: 'role',
  entity: 'entity',
  entityId: 'entityId',
  oldValue: 'oldValue',
  newValue: 'newValue',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  prevStatus: 'prevStatus',
  newStatus: 'newStatus',
  details: 'details',
  correlationId: 'correlationId',
  requestId: 'requestId',
  durationMs: 'durationMs',
  reason: 'reason',
  policyVersion: 'policyVersion',
  timestamp: 'timestamp'
};

exports.Prisma.BackupRecordScalarFieldEnum = {
  id: 'id',
  filename: 'filename',
  sizeBytes: 'sizeBytes',
  status: 'status',
  testStatus: 'testStatus',
  timestamp: 'timestamp',
  type: 'type',
  durationMs: 'durationMs',
  encrypted: 'encrypted',
  storage: 'storage',
  creator: 'creator',
  integrityHash: 'integrityHash'
};

exports.Prisma.BatchScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  quantity: 'quantity',
  actualMixData: 'actualMixData',
  createdAt: 'createdAt',
  companyId: 'companyId'
};

exports.Prisma.BehaviorLogScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  userId: 'userId',
  action: 'action',
  details: 'details',
  timestamp: 'timestamp'
};

exports.Prisma.BillingEventScalarFieldEnum = {
  id: 'id',
  subscriptionId: 'subscriptionId',
  eventType: 'eventType',
  status: 'status',
  timestamp: 'timestamp',
  details: 'details',
  reason: 'reason',
  decidedAt: 'decidedAt',
  decidedBy: 'decidedBy'
};

exports.Prisma.ChangeRequestScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  type: 'type',
  originalData: 'originalData',
  newData: 'newData',
  status: 'status',
  requesterId: 'requesterId',
  approverId: 'approverId',
  reason: 'reason',
  appliedAt: 'appliedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  creatorName: 'creatorName',
  approverName: 'approverName'
};

exports.Prisma.CompanyScalarFieldEnum = {
  id: 'id',
  slug: 'slug',
  name: 'name',
  status: 'status',
  address: 'address',
  phone: 'phone',
  latitude: 'latitude',
  longitude: 'longitude',
  currency: 'currency',
  timezone: 'timezone',
  language: 'language',
  units: 'units',
  taxRules: 'taxRules',
  invoiceSettings: 'invoiceSettings',
  numberingRules: 'numberingRules',
  featureFlags: 'featureFlags',
  isLocked: 'isLocked',
  deletedAt: 'deletedAt',
  createdAt: 'createdAt',
  suspensionLevel: 'suspensionLevel',
  gracePeriodEndsAt: 'gracePeriodEndsAt'
};

exports.Prisma.CompanyActivityLogScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  userId: 'userId',
  type: 'type',
  severity: 'severity',
  message: 'message',
  metadata: 'metadata',
  ipAddress: 'ipAddress',
  createdAt: 'createdAt'
};

exports.Prisma.CompanyBrandingScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  logoUrl: 'logoUrl',
  logoText: 'logoText',
  systemName: 'systemName',
  subtitle: 'subtitle',
  loginButton: 'loginButton',
  primaryColor: 'primaryColor',
  secondaryColor: 'secondaryColor',
  accentColor: 'accentColor',
  homeButtonShow: 'homeButtonShow',
  homeButtonTextAr: 'homeButtonTextAr',
  homeButtonTextEn: 'homeButtonTextEn',
  homeButtonSize: 'homeButtonSize',
  homeButtonWeight: 'homeButtonWeight',
  homeButtonTracking: 'homeButtonTracking',
  homeButtonColor: 'homeButtonColor',
  homeButtonAnimation: 'homeButtonAnimation',
  updatedAt: 'updatedAt'
};

exports.Prisma.CompanyFeatureScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  key: 'key',
  enabled: 'enabled',
  tier: 'tier',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  featureId: 'featureId'
};

exports.Prisma.CompanySettingScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  key: 'key',
  value: 'value',
  locked: 'locked',
  lockType: 'lockType',
  updatedAt: 'updatedAt'
};

exports.Prisma.ComplianceViolationScalarFieldEnum = {
  id: 'id',
  type: 'type',
  severity: 'severity',
  details: 'details',
  userId: 'userId',
  timestamp: 'timestamp',
  status: 'status'
};

exports.Prisma.CubeTestScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  sampleDate: 'sampleDate',
  age: 'age',
  kn: 'kn',
  mpa: 'mpa',
  result: 'result',
  status: 'status',
  approvedById: 'approvedById',
  labStandardId: 'labStandardId',
  standardSnapshot: 'standardSnapshot',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  companyId: 'companyId',
  creatorName: 'creatorName',
  approverName: 'approverName'
};

exports.Prisma.CuringPondScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  cubeCount: 'cubeCount',
  updatedAt: 'updatedAt',
  companyId: 'companyId'
};

exports.Prisma.CustomerScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  email: 'email',
  phone: 'phone',
  address: 'address',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.DeliveryTicketScalarFieldEnum = {
  id: 'id',
  ticketNumber: 'ticketNumber',
  orderId: 'orderId',
  batchId: 'batchId',
  truckNumber: 'truckNumber',
  driverName: 'driverName',
  status: 'status',
  cubesCount: 'cubesCount',
  cumulativeQuantity: 'cumulativeQuantity',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  companyId: 'companyId',
  currentLat: 'currentLat',
  currentLng: 'currentLng',
  destinationLabel: 'destinationLabel',
  destinationLat: 'destinationLat',
  destinationLng: 'destinationLng',
  driverPhone: 'driverPhone',
  externalTrackingId: 'externalTrackingId',
  lastLocationAt: 'lastLocationAt',
  trackingToken: 'trackingToken',
  deliveryHash: 'deliveryHash',
  qrCode: 'qrCode'
};

exports.Prisma.DepartmentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  displayName: 'displayName',
  isSystem: 'isSystem',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DomainScalarFieldEnum = {
  id: 'id',
  domain: 'domain',
  companyId: 'companyId',
  status: 'status',
  verified: 'verified',
  verificationToken: 'verificationToken',
  verificationAttempts: 'verificationAttempts',
  lastVerificationAttempt: 'lastVerificationAttempt',
  forceHttps: 'forceHttps',
  ipRestriction: 'ipRestriction',
  geoRestriction: 'geoRestriction',
  deletedAt: 'deletedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmailLogScalarFieldEnum = {
  id: 'id',
  to: 'to',
  subject: 'subject',
  body: 'body',
  status: 'status',
  timestamp: 'timestamp'
};

exports.Prisma.FeatureScalarFieldEnum = {
  id: 'id',
  description: 'description',
  globalEnabled: 'globalEnabled',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.IdempotencyRecordScalarFieldEnum = {
  id: 'id',
  response: 'response',
  createdAt: 'createdAt',
  expiresAt: 'expiresAt'
};

exports.Prisma.ImpersonationSessionScalarFieldEnum = {
  id: 'id',
  systemOwnerId: 'systemOwnerId',
  targetUserId: 'targetUserId',
  startedAt: 'startedAt',
  endedAt: 'endedAt',
  reason: 'reason'
};

exports.Prisma.IncomingShipmentScalarFieldEnum = {
  id: 'id',
  materialType: 'materialType',
  quantity: 'quantity',
  source: 'source',
  recordedByUserId: 'recordedByUserId',
  creatorName: 'creatorName',
  recordedAt: 'recordedAt'
};

exports.Prisma.InventoryTransactionScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  materialId: 'materialId',
  type: 'type',
  quantity: 'quantity',
  reference: 'reference',
  timestamp: 'timestamp'
};

exports.Prisma.InviteScalarFieldEnum = {
  id: 'id',
  email: 'email',
  token: 'token',
  roleId: 'roleId',
  companyId: 'companyId',
  status: 'status',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.InvoiceScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  subscriptionId: 'subscriptionId',
  ticketId: 'ticketId',
  orderId: 'orderId',
  type: 'type',
  stripeId: 'stripeId',
  amount: 'amount',
  currency: 'currency',
  status: 'status',
  pdfUrl: 'pdfUrl',
  hostedUrl: 'hostedUrl',
  paidAt: 'paidAt',
  creatorName: 'creatorName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LabApprovalScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  userId: 'userId',
  creatorName: 'creatorName',
  status: 'status',
  details: 'details',
  mixData: 'mixData',
  createdAt: 'createdAt',
  companyId: 'companyId'
};

exports.Prisma.LabReportConfigScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  companyNameAr: 'companyNameAr',
  companyNameEn: 'companyNameEn',
  logoUrl: 'logoUrl',
  phone: 'phone',
  email: 'email',
  address: 'address',
  website: 'website',
  reportTitleAr: 'reportTitleAr',
  reportTitleEn: 'reportTitleEn',
  footerText: 'footerText',
  showQrCode: 'showQrCode',
  showSignature: 'showSignature',
  signatureText: 'signatureText',
  themeColor: 'themeColor',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LabStandardScalarFieldEnum = {
  id: 'id',
  code: 'code',
  name: 'name',
  organization: 'organization',
  year: 'year',
  description: 'description',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  companyId: 'companyId'
};

exports.Prisma.LandingPageConfigScalarFieldEnum = {
  id: 'id',
  heroTitleAr: 'heroTitleAr',
  heroTitleEn: 'heroTitleEn',
  heroSubtitleAr: 'heroSubtitleAr',
  heroSubtitleEn: 'heroSubtitleEn',
  ctaTextAr: 'ctaTextAr',
  ctaTextEn: 'ctaTextEn',
  loginTextAr: 'loginTextAr',
  loginTextEn: 'loginTextEn',
  headerLogoTextAr: 'headerLogoTextAr',
  headerLogoTextEn: 'headerLogoTextEn',
  headerLogoInitial: 'headerLogoInitial',
  backgroundStyle: 'backgroundStyle',
  primaryColor: 'primaryColor',
  features: 'features',
  updatedAt: 'updatedAt'
};

exports.Prisma.LedgerEntryScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  type: 'type',
  amount: 'amount',
  description: 'description',
  date: 'date'
};

exports.Prisma.LicenseScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  type: 'type',
  maxUsers: 'maxUsers',
  modules: 'modules',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MaterialScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  code: 'code',
  unit: 'unit',
  stock: 'stock',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  sieveCategoryId: 'sieveCategoryId'
};

exports.Prisma.MaterialRejectionScalarFieldEnum = {
  id: 'id',
  materialId: 'materialId',
  labUserId: 'labUserId',
  comments: 'comments',
  status: 'status',
  managerUserId: 'managerUserId',
  creatorName: 'creatorName',
  managerName: 'managerName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  companyId: 'companyId'
};

exports.Prisma.MembershipScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  companyId: 'companyId',
  roleId: 'roleId',
  status: 'status',
  deletedAt: 'deletedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MixComponentScalarFieldEnum = {
  id: 'id',
  mixDesignId: 'mixDesignId',
  materialId: 'materialId',
  materialName: 'materialName',
  quantity: 'quantity',
  unit: 'unit',
  specificGravity: 'specificGravity',
  absorption: 'absorption',
  moistureContent: 'moistureContent',
  finenessModulus: 'finenessModulus',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  companyId: 'companyId'
};

exports.Prisma.MixDesignScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  code: 'code',
  grade: 'grade',
  strengthClass: 'strengthClass',
  status: 'status',
  details: 'details',
  version: 'version',
  isCurrent: 'isCurrent',
  isFrozen: 'isFrozen',
  parentMixId: 'parentMixId',
  changeNote: 'changeNote',
  method: 'method',
  exposureClass: 'exposureClass',
  maxAggregateSize: 'maxAggregateSize',
  targetWC: 'targetWC',
  targetSlump: 'targetSlump',
  targetAir: 'targetAir',
  targetDensity: 'targetDensity',
  calculations: 'calculations',
  trialInfo: 'trialInfo',
  labResults: 'labResults',
  moistureData: 'moistureData',
  strengthResults: 'strengthResults',
  trialVolumeData: 'trialVolumeData',
  approvedById: 'approvedById',
  approvedAt: 'approvedAt',
  creatorName: 'creatorName',
  approverName: 'approverName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt',
  concretePrice: 'concretePrice',
  laborPrice: 'laborPrice',
  pumpPrice: 'pumpPrice',
  priceComponents: 'priceComponents'
};

exports.Prisma.OperationalExpenseScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  category: 'category',
  amount: 'amount',
  details: 'details',
  reference: 'reference',
  timestamp: 'timestamp'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  orderNumber: 'orderNumber',
  companyId: 'companyId',
  customerId: 'customerId',
  projectId: 'projectId',
  mixDesignId: 'mixDesignId',
  labStandardId: 'labStandardId',
  status: 'status',
  volume: 'volume',
  date: 'date',
  actualQuantity: 'actualQuantity',
  deletedAt: 'deletedAt',
  createdById: 'createdById',
  approvedById: 'approvedById',
  creatorName: 'creatorName',
  approverName: 'approverName',
  labApprovedAt: 'labApprovedAt',
  productionStartedAt: 'productionStartedAt',
  dispatchedAt: 'dispatchedAt',
  accountingClosedAt: 'accountingClosedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  notes: 'notes'
};

exports.Prisma.PasswordResetTokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  amount: 'amount',
  currency: 'currency',
  status: 'status',
  provider: 'provider',
  transactionId: 'transactionId',
  period: 'period',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PayrollScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  userId: 'userId',
  amount: 'amount',
  month: 'month',
  status: 'status',
  paidAt: 'paidAt',
  creatorName: 'creatorName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PermissionScalarFieldEnum = {
  id: 'id',
  resource: 'resource',
  action: 'action',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PlanScalarFieldEnum = {
  id: 'id',
  key: 'key',
  name: 'name',
  description: 'description',
  maxUsers: 'maxUsers',
  maxStorage: 'maxStorage',
  maxOrders: 'maxOrders',
  maxProjects: 'maxProjects',
  features: 'features',
  price: 'price',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PlanFeatureScalarFieldEnum = {
  planId: 'planId',
  featureId: 'featureId',
  limit: 'limit'
};

exports.Prisma.ProjectScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  location: 'location',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  deletedAt: 'deletedAt'
};

exports.Prisma.QualityTestScalarFieldEnum = {
  id: 'id',
  orderId: 'orderId',
  materialId: 'materialId',
  methodId: 'methodId',
  testedById: 'testedById',
  testedAt: 'testedAt',
  value: 'value',
  readings: 'readings',
  result: 'result',
  notes: 'notes',
  approvedById: 'approvedById',
  creatorName: 'creatorName',
  approverName: 'approverName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  companyId: 'companyId'
};

exports.Prisma.RefreshTokenScalarFieldEnum = {
  id: 'id',
  token: 'token',
  userId: 'userId',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.RegisterPageConfigScalarFieldEnum = {
  id: 'id',
  titleAr: 'titleAr',
  titleEn: 'titleEn',
  subtitleAr: 'subtitleAr',
  subtitleEn: 'subtitleEn',
  companyNameAr: 'companyNameAr',
  companyNameEn: 'companyNameEn',
  subdomainAr: 'subdomainAr',
  subdomainEn: 'subdomainEn',
  nameAr: 'nameAr',
  nameEn: 'nameEn',
  emailAr: 'emailAr',
  emailEn: 'emailEn',
  passwordAr: 'passwordAr',
  passwordEn: 'passwordEn',
  phoneAr: 'phoneAr',
  phoneEn: 'phoneEn',
  submitTextAr: 'submitTextAr',
  submitTextEn: 'submitTextEn',
  loginLinkTextAr: 'loginLinkTextAr',
  loginLinkTextEn: 'loginLinkTextEn',
  brandingNameAr: 'brandingNameAr',
  brandingNameEn: 'brandingNameEn',
  backgroundStyle: 'backgroundStyle',
  primaryColor: 'primaryColor',
  updatedAt: 'updatedAt'
};

exports.Prisma.ResourceLockScalarFieldEnum = {
  resourceId: 'resourceId',
  lockedAt: 'lockedAt',
  expiresAt: 'expiresAt'
};

exports.Prisma.RoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  displayName: 'displayName',
  isSystem: 'isSystem',
  isSovereign: 'isSovereign',
  description: 'description',
  departmentId: 'departmentId',
  companyId: 'companyId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RolePermissionScalarFieldEnum = {
  roleId: 'roleId',
  permissionId: 'permissionId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  companyId: 'companyId',
  tokenHash: 'tokenHash',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  isRevoked: 'isRevoked',
  impersonatorSystemOwnerId: 'impersonatorSystemOwnerId'
};

exports.Prisma.SieveAnalysisScalarFieldEnum = {
  id: 'id',
  materialId: 'materialId',
  testType: 'testType',
  readings: 'readings',
  totalWeight: 'totalWeight',
  moistureContent: 'moistureContent',
  clayContent: 'clayContent',
  dryWeight: 'dryWeight',
  washWeight: 'washWeight',
  source: 'source',
  location: 'location',
  supplier: 'supplier',
  fieldNo: 'fieldNo',
  projectName: 'projectName',
  inspectorName: 'inspectorName',
  labNo: 'labNo',
  results: 'results',
  finenessModulus: 'finenessModulus',
  zone: 'zone',
  status: 'status',
  approvedById: 'approvedById',
  appliedStandards: 'appliedStandards',
  sampleDate: 'sampleDate',
  testDate: 'testDate',
  reportDate: 'reportDate',
  creatorName: 'creatorName',
  approverName: 'approverName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  companyId: 'companyId'
};

exports.Prisma.SieveCategoryScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SieveDefinitionScalarFieldEnum = {
  id: 'id',
  categoryId: 'categoryId',
  size: 'size',
  minLimit: 'minLimit',
  maxLimit: 'maxLimit',
  order: 'order',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SubscriptionScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  planId: 'planId',
  stripeId: 'stripeId',
  status: 'status',
  currentPeriodStart: 'currentPeriodStart',
  currentPeriodEnd: 'currentPeriodEnd',
  cancelAtPeriodEnd: 'cancelAtPeriodEnd',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SystemAlertScalarFieldEnum = {
  id: 'id',
  severity: 'severity',
  message: 'message',
  correlationId: 'correlationId',
  timestamp: 'timestamp',
  resolved: 'resolved',
  isRiskFlag: 'isRiskFlag',
  category: 'category',
  companyId: 'companyId',
  metric: 'metric',
  metadata: 'metadata'
};

exports.Prisma.SystemMetricScalarFieldEnum = {
  id: 'id',
  metricName: 'metricName',
  value: 'value',
  details: 'details',
  timestamp: 'timestamp'
};

exports.Prisma.SystemOwnerScalarFieldEnum = {
  id: 'id',
  email: 'email',
  password: 'password',
  name: 'name',
  createdAt: 'createdAt'
};

exports.Prisma.SystemPolicyScalarFieldEnum = {
  id: 'id',
  key: 'key',
  version: 'version',
  value: 'value',
  active: 'active',
  category: 'category',
  isLocked: 'isLocked',
  updatedAt: 'updatedAt'
};

exports.Prisma.ModuleSealScalarFieldEnum = {
  moduleName: 'moduleName',
  isSealed: 'isSealed',
  reason: 'reason',
  sealedBy: 'sealedBy',
  sealedAt: 'sealedAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SystemSettingScalarFieldEnum = {
  key: 'key',
  value: 'value',
  locked: 'locked',
  lockType: 'lockType',
  updatedAt: 'updatedAt'
};

exports.Prisma.TunnelInvitationScalarFieldEnum = {
  id: 'id',
  token: 'token',
  label: 'label',
  expiresAt: 'expiresAt',
  tunnelUrl: 'tunnelUrl',
  viewCount: 'viewCount',
  createdAt: 'createdAt'
};

exports.Prisma.SystemLedgerScalarFieldEnum = {
  id: 'id',
  timestamp: 'timestamp',
  tableName: 'tableName',
  recordId: 'recordId',
  actionType: 'actionType',
  oldValues: 'oldValues',
  newValues: 'newValues',
  changedColumns: 'changedColumns',
  userId: 'userId',
  sessionId: 'sessionId',
  sourceType: 'sourceType',
  sourceMachine: 'sourceMachine',
  sourceIp: 'sourceIp',
  checksum: 'checksum',
  hashChain: 'hashChain',
  parentLedgerId: 'parentLedgerId'
};

exports.Prisma.TenantHealthScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  status: 'status',
  lastCheck: 'lastCheck',
  details: 'details'
};

exports.Prisma.TestMethodScalarFieldEnum = {
  id: 'id',
  standardId: 'standardId',
  name: 'name',
  code: 'code',
  unit: 'unit',
  description: 'description',
  warningMin: 'warningMin',
  warningMax: 'warningMax',
  rejectMin: 'rejectMin',
  rejectMax: 'rejectMax',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TwoFactorSecretScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  secret: 'secret',
  backupCodes: 'backupCodes',
  enabled: 'enabled',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UsageCounterScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  metric: 'metric',
  period: 'period',
  value: 'value'
};

exports.Prisma.UsageEventScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  metric: 'metric',
  delta: 'delta',
  source: 'source',
  createdAt: 'createdAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  username: 'username',
  name: 'name',
  email: 'email',
  password: 'password',
  status: 'status',
  phone: 'phone',
  isGhost: 'isGhost',
  departmentId: 'departmentId',
  companyId: 'companyId',
  deletedAt: 'deletedAt',
  expiresAt: 'expiresAt',
  ipRestriction: 'ipRestriction',
  canRegisterMaterials: 'canRegisterMaterials',
  canCreateUsers: 'canCreateUsers',
  createdById: 'createdById',
  createdAt: 'createdAt'
};

exports.Prisma.UserDeviceScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  fingerprint: 'fingerprint',
  userAgent: 'userAgent',
  ipAddress: 'ipAddress',
  lastActive: 'lastActive',
  isTrusted: 'isTrusted',
  revoked: 'revoked'
};

exports.Prisma.UserPreferenceScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  theme: 'theme',
  mode: 'mode',
  language: 'language',
  sidebar: 'sidebar',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserRoleScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  roleId: 'roleId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserSettingScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  key: 'key',
  value: 'value',
  locked: 'locked',
  updatedAt: 'updatedAt'
};

exports.Prisma.VehicleScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  code: 'code',
  name: 'name',
  type: 'type',
  status: 'status',
  location: 'location',
  currentLat: 'currentLat',
  currentLng: 'currentLng',
  odometer: 'odometer',
  totalHours: 'totalHours',
  nextServiceHours: 'nextServiceHours',
  lastServiceDate: 'lastServiceDate',
  lastEntryAt: 'lastEntryAt',
  lastExitAt: 'lastExitAt',
  details: 'details',
  deletedAt: 'deletedAt'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  id: 'id',
  identifier: 'identifier',
  token: 'token',
  expires: 'expires',
  createdAt: 'createdAt'
};

exports.Prisma.WebhookEventScalarFieldEnum = {
  id: 'id',
  provider: 'provider',
  eventId: 'eventId',
  type: 'type',
  payload: 'payload',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.NetworkHubSettingScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  localAccessEnabled: 'localAccessEnabled',
  globalAccessEnabled: 'globalAccessEnabled',
  globalAccessUrl: 'globalAccessUrl',
  startHour: 'startHour',
  endHour: 'endHour',
  scheduleEnabled: 'scheduleEnabled',
  shiftSchedules: 'shiftSchedules',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ConnectedDeviceScalarFieldEnum = {
  deviceUuid: 'deviceUuid',
  companyId: 'companyId',
  name: 'name',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  connectionType: 'connectionType',
  deviceType: 'deviceType',
  userId: 'userId',
  isWhitelisted: 'isWhitelisted',
  isBlacklisted: 'isBlacklisted',
  isReadOnly: 'isReadOnly',
  lastActive: 'lastActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NetworkAccessLogScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  username: 'username',
  ipAddress: 'ipAddress',
  connectionType: 'connectionType',
  status: 'status',
  reason: 'reason',
  timestamp: 'timestamp'
};

exports.Prisma.GuestLinkScalarFieldEnum = {
  token: 'token',
  companyId: 'companyId',
  expiresAt: 'expiresAt',
  allowedOrderId: 'allowedOrderId',
  allowedMixId: 'allowedMixId',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.LocalFileShareScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  fileName: 'fileName',
  fileUrl: 'fileUrl',
  sizeBytes: 'sizeBytes',
  uploadedById: 'uploadedById',
  creatorName: 'creatorName',
  visibility: 'visibility',
  departmentId: 'departmentId',
  scope: 'scope',
  createdAt: 'createdAt'
};

exports.Prisma.PrinterConfigurationScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  ipAddress: 'ipAddress',
  port: 'port',
  department: 'department',
  isEnabled: 'isEnabled',
  isDefault: 'isDefault',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PhysicalWebhookScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  url: 'url',
  eventType: 'eventType',
  isEnabled: 'isEnabled',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RequestScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  type: 'type',
  details: 'details',
  requesterId: 'requesterId',
  creatorName: 'creatorName',
  status: 'status',
  managerNote: 'managerNote',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EquipmentScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  type: 'type',
  status: 'status',
  hoursRun: 'hoursRun',
  lastMaintenance: 'lastMaintenance',
  nextMaintenance: 'nextMaintenance',
  serialNumber: 'serialNumber',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MaintenanceLogScalarFieldEnum = {
  id: 'id',
  equipmentId: 'equipmentId',
  description: 'description',
  type: 'type',
  cost: 'cost',
  date: 'date',
  technician: 'technician',
  createdAt: 'createdAt'
};

exports.Prisma.FaultLogScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  equipmentId: 'equipmentId',
  title: 'title',
  description: 'description',
  severity: 'severity',
  reportedBy: 'reportedBy',
  reportedAt: 'reportedAt',
  status: 'status',
  resolvedAt: 'resolvedAt',
  solution: 'solution',
  cost: 'cost',
  createdAt: 'createdAt'
};

exports.Prisma.SparePartScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  code: 'code',
  quantity: 'quantity',
  reorderPoint: 'reorderPoint',
  unit: 'unit',
  price: 'price',
  supplier: 'supplier',
  supplierPhone: 'supplierPhone',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrackingDeviceScalarFieldEnum = {
  id: 'id',
  deviceId: 'deviceId',
  companyId: 'companyId',
  name: 'name',
  vehicleType: 'vehicleType',
  createdAt: 'createdAt'
};

exports.Prisma.TrackingSessionScalarFieldEnum = {
  id: 'id',
  deviceId: 'deviceId',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.LocationHistoryScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  lat: 'lat',
  lng: 'lng',
  speed: 'speed',
  heading: 'heading',
  accuracy: 'accuracy',
  createdAt: 'createdAt'
};

exports.Prisma.EquipmentMaintenanceScalarFieldEnum = {
  id: 'id',
  equipmentId: 'equipmentId',
  batchCount: 'batchCount',
  maintenanceThreshold: 'maintenanceThreshold',
  trackingUnit: 'trackingUnit',
  lastMaintenanceDate: 'lastMaintenanceDate',
  nextMaintenanceDate: 'nextMaintenanceDate',
  status: 'status'
};

exports.Prisma.PlcSettingScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  autoMode: 'autoMode',
  moistureOffset: 'moistureOffset',
  tolerancePercent: 'tolerancePercent',
  customButtons: 'customButtons',
  customSensors: 'customSensors',
  discoveredBrand: 'discoveredBrand',
  detectedIp: 'detectedIp',
  detectedPort: 'detectedPort',
  activeProtocol: 'activeProtocol',
  updatedAt: 'updatedAt'
};

exports.Prisma.FinancialPeriodScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  periodKey: 'periodKey',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status',
  closedAt: 'closedAt',
  closedById: 'closedById',
  closedByName: 'closedByName',
  reason: 'reason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FinancialAuditTrailScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  userId: 'userId',
  username: 'username',
  action: 'action',
  entityType: 'entityType',
  entityId: 'entityId',
  oldSnapshot: 'oldSnapshot',
  newSnapshot: 'newSnapshot',
  reason: 'reason',
  ipAddress: 'ipAddress',
  checksum: 'checksum',
  timestamp: 'timestamp'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  AuditLog: 'AuditLog',
  BackupRecord: 'BackupRecord',
  Batch: 'Batch',
  BehaviorLog: 'BehaviorLog',
  BillingEvent: 'BillingEvent',
  ChangeRequest: 'ChangeRequest',
  Company: 'Company',
  CompanyActivityLog: 'CompanyActivityLog',
  CompanyBranding: 'CompanyBranding',
  CompanyFeature: 'CompanyFeature',
  CompanySetting: 'CompanySetting',
  ComplianceViolation: 'ComplianceViolation',
  CubeTest: 'CubeTest',
  CuringPond: 'CuringPond',
  Customer: 'Customer',
  DeliveryTicket: 'DeliveryTicket',
  Department: 'Department',
  Domain: 'Domain',
  EmailLog: 'EmailLog',
  Feature: 'Feature',
  IdempotencyRecord: 'IdempotencyRecord',
  ImpersonationSession: 'ImpersonationSession',
  IncomingShipment: 'IncomingShipment',
  InventoryTransaction: 'InventoryTransaction',
  Invite: 'Invite',
  Invoice: 'Invoice',
  LabApproval: 'LabApproval',
  LabReportConfig: 'LabReportConfig',
  LabStandard: 'LabStandard',
  LandingPageConfig: 'LandingPageConfig',
  LedgerEntry: 'LedgerEntry',
  License: 'License',
  Material: 'Material',
  MaterialRejection: 'MaterialRejection',
  Membership: 'Membership',
  MixComponent: 'MixComponent',
  MixDesign: 'MixDesign',
  OperationalExpense: 'OperationalExpense',
  Order: 'Order',
  PasswordResetToken: 'PasswordResetToken',
  Payment: 'Payment',
  Payroll: 'Payroll',
  Permission: 'Permission',
  Plan: 'Plan',
  PlanFeature: 'PlanFeature',
  Project: 'Project',
  QualityTest: 'QualityTest',
  RefreshToken: 'RefreshToken',
  RegisterPageConfig: 'RegisterPageConfig',
  ResourceLock: 'ResourceLock',
  Role: 'Role',
  RolePermission: 'RolePermission',
  Session: 'Session',
  SieveAnalysis: 'SieveAnalysis',
  SieveCategory: 'SieveCategory',
  SieveDefinition: 'SieveDefinition',
  Subscription: 'Subscription',
  SystemAlert: 'SystemAlert',
  SystemMetric: 'SystemMetric',
  SystemOwner: 'SystemOwner',
  SystemPolicy: 'SystemPolicy',
  ModuleSeal: 'ModuleSeal',
  SystemSetting: 'SystemSetting',
  TunnelInvitation: 'TunnelInvitation',
  SystemLedger: 'SystemLedger',
  TenantHealth: 'TenantHealth',
  TestMethod: 'TestMethod',
  TwoFactorSecret: 'TwoFactorSecret',
  UsageCounter: 'UsageCounter',
  UsageEvent: 'UsageEvent',
  User: 'User',
  UserDevice: 'UserDevice',
  UserPreference: 'UserPreference',
  UserRole: 'UserRole',
  UserSetting: 'UserSetting',
  Vehicle: 'Vehicle',
  VerificationToken: 'VerificationToken',
  WebhookEvent: 'WebhookEvent',
  NetworkHubSetting: 'NetworkHubSetting',
  ConnectedDevice: 'ConnectedDevice',
  NetworkAccessLog: 'NetworkAccessLog',
  GuestLink: 'GuestLink',
  LocalFileShare: 'LocalFileShare',
  PrinterConfiguration: 'PrinterConfiguration',
  PhysicalWebhook: 'PhysicalWebhook',
  Request: 'Request',
  Equipment: 'Equipment',
  MaintenanceLog: 'MaintenanceLog',
  FaultLog: 'FaultLog',
  SparePart: 'SparePart',
  TrackingDevice: 'TrackingDevice',
  TrackingSession: 'TrackingSession',
  LocationHistory: 'LocationHistory',
  EquipmentMaintenance: 'EquipmentMaintenance',
  PlcSetting: 'PlcSetting',
  FinancialPeriod: 'FinancialPeriod',
  FinancialAuditTrail: 'FinancialAuditTrail'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        const runtime = detectRuntime()
        const edgeRuntimeName = {
          'workerd': 'Cloudflare Workers',
          'deno': 'Deno and Deno Deploy',
          'netlify': 'Netlify Edge Functions',
          'edge-light': 'Vercel Edge Functions or Edge Middleware',
        }[runtime]

        let message = 'PrismaClient is unable to run in '
        if (edgeRuntimeName !== undefined) {
          message += edgeRuntimeName + '. As an alternative, try Accelerate: https://pris.ly/d/accelerate.'
        } else {
          message += 'this browser environment, or has been bundled for the browser (running in `' + runtime + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
