import apiClient from './api';

const PROPERTY_ENDPOINT = '/property/properties/';

export const propertyService = {
  getAll: (params = {}) => apiClient.get(PROPERTY_ENDPOINT, { params }),
  getById: (id) => apiClient.get(`${PROPERTY_ENDPOINT}${id}/`),
  create: (data) => apiClient.post(PROPERTY_ENDPOINT, data),
  update: (id, data) => apiClient.put(`${PROPERTY_ENDPOINT}${id}/`, data),
  delete: (id) => apiClient.delete(`${PROPERTY_ENDPOINT}${id}/`),
};

const UNIT_ENDPOINT = '/property/units/';

export const unitService = {
  getAll: (params = {}) => apiClient.get(UNIT_ENDPOINT, { params }),
  getById: (id) => apiClient.get(`${UNIT_ENDPOINT}${id}/`),
  create: (data) => apiClient.post(UNIT_ENDPOINT, data),
  update: (id, data) => apiClient.put(`${UNIT_ENDPOINT}${id}/`, data),
  delete: (id) => apiClient.delete(`${UNIT_ENDPOINT}${id}/`),
};

const TENANT_ENDPOINT = '/property/related-parties/';

export const tenantService = {
  getAll: (params = {}) => apiClient.get(TENANT_ENDPOINT, { params }),
  getById: (id) => apiClient.get(`${TENANT_ENDPOINT}${id}/`),
  create: (data) => apiClient.post(TENANT_ENDPOINT, data),
  update: (id, data) => apiClient.put(`${TENANT_ENDPOINT}${id}/`, data),
  delete: (id) => apiClient.delete(`${TENANT_ENDPOINT}${id}/`),
};

const LEASE_ENDPOINT = '/property/leases/';

export const leaseService = {
  getAll: (params = {}) => apiClient.get(LEASE_ENDPOINT, { params }),
  getById: (id) => apiClient.get(`${LEASE_ENDPOINT}${id}/`),
  create: (data) => apiClient.post(LEASE_ENDPOINT, data),
  update: (id, data) => apiClient.put(`${LEASE_ENDPOINT}${id}/`, data),
  delete: (id) => apiClient.delete(`${LEASE_ENDPOINT}${id}/`),
};

const MAINTENANCE_ENDPOINT = '/property/maintenance/';

export const maintenanceService = {
  getAll: (params = {}) => apiClient.get(MAINTENANCE_ENDPOINT, { params }),
  getById: (id) => apiClient.get(`${MAINTENANCE_ENDPOINT}${id}/`),
  create: (data) => apiClient.post(MAINTENANCE_ENDPOINT, data),
  update: (id, data) => apiClient.put(`${MAINTENANCE_ENDPOINT}${id}/`, data),
  delete: (id) => apiClient.delete(`${MAINTENANCE_ENDPOINT}${id}/`),
};

const EXPENSE_ENDPOINT = '/property/expenses/';

export const expenseService = {
  getAll: (params = {}) => apiClient.get(EXPENSE_ENDPOINT, { params }),
  getById: (id) => apiClient.get(`${EXPENSE_ENDPOINT}${id}/`),
  create: (data) => apiClient.post(EXPENSE_ENDPOINT, data),
  update: (id, data) => apiClient.put(`${EXPENSE_ENDPOINT}${id}/`, data),
  delete: (id) => apiClient.delete(`${EXPENSE_ENDPOINT}${id}/`),
};

const RENT_ENDPOINT = '/property/rent/';

export const rentService = {
  getAll: (params = {}) => apiClient.get(RENT_ENDPOINT, { params }),
  getById: (id) => apiClient.get(`${RENT_ENDPOINT}${id}/`),
  create: (data) => apiClient.post(RENT_ENDPOINT, data),
  update: (id, data) => apiClient.put(`${RENT_ENDPOINT}${id}/`, data),
  delete: (id) => apiClient.delete(`${RENT_ENDPOINT}${id}/`),
};
