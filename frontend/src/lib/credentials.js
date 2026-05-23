// frontend/src/lib/credentials.js
import api from "./axios";

/* ─────────────────────────────────────────────
   Shape helpers
───────────────────────────────────────────── */
export const EMPTY_META = {
  start_date: "",
  renewal_history: [],
  nameservers: [],
  ip_address: "",
  server_details: "",
  dns_details: { nameservers: [], A: [], CNAME: [], MX: [], TXT: [] },
  domains: [],
  panel: { url: "", username: "", password: "" },
};

function metaFromDb(raw) {
  if (!raw) return { ...EMPTY_META };
  return {
    start_date: raw.start_date
      ? new Date(raw.start_date).toISOString().slice(0, 10)
      : "",
    renewal_history: (raw.renewal_history ?? []).map((r) => ({
      id: r._id,
      date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
      duration: r.duration ?? 1,
      cost: r.cost ?? "",
      notes: r.notes ?? "",
    })),
    nameservers: raw.nameservers ?? [],
    ip_address: raw.ip_address ?? "",
    server_details: raw.server_details ?? "",
    dns_details: {
      nameservers: raw.dns_details?.nameservers ?? [],
      A: raw.dns_details?.A ?? [],
      CNAME: raw.dns_details?.CNAME ?? [],
      MX: raw.dns_details?.MX ?? [],
      TXT: raw.dns_details?.TXT ?? [],
    },
    domains: (raw.domains ?? []).map((d) => ({
      id: d._id,
      domain: d.domain ?? "",
      type: d.type ?? "main",
      records: {
        A: d.records?.A ?? [],
        CNAME: d.records?.CNAME ?? [],
        MX: d.records?.MX ?? [],
        TXT: d.records?.TXT ?? [],
      },
    })),
    panel: {
      url: raw.panel?.url ?? "",
      username: raw.panel?.username ?? "",
      password: raw.panel?.password ?? "",
    },
  };
}

export function metaToDb(meta) {
  if (!meta) return {};
  return {
    start_date: meta.start_date ? new Date(meta.start_date) : null,
    nameservers: meta.nameservers ?? [],
    ip_address: meta.ip_address ?? "",
    server_details: meta.server_details ?? "",
    dns_details: {
      nameservers: meta.dns_details?.nameservers ?? [],
      A: meta.dns_details?.A ?? [],
      CNAME: meta.dns_details?.CNAME ?? [],
      MX: meta.dns_details?.MX ?? [],
      TXT: meta.dns_details?.TXT ?? [],
    },
    domains: (meta.domains ?? []).map((d) => ({
      domain: d.domain,
      type: d.type,
      records: {
        A: d.records?.A ?? [],
        CNAME: d.records?.CNAME ?? [],
        MX: d.records?.MX ?? [],
        TXT: d.records?.TXT ?? [],
      },
    })),
    panel: {
      url: meta.panel?.url ?? "",
      username: meta.panel?.username ?? "",
      password: meta.panel?.password ?? "",
    },
  };
}

/**
 * Normalise one raw API document into an array of UI service rows.
 *
 * NEW format:  { _id, client_name, customer_id, services: [{...}] }
 * OLD/legacy:  { _id, client_name, service_name, type, ..., services: [] }
 */
export function flattenClient(doc) {
  const hasNewServices = Array.isArray(doc.services) && doc.services.length > 0;

  if (hasNewServices) {
    return doc.services.map((svc) => ({
      clientId: doc._id,
      serviceId: svc._id,
      client_name: doc.client_name,
      // ── hard link to Customers page ──────────────
      customer_id: doc.customer_id ?? null,
      isLegacy: false,
      type: svc.type
        ? svc.type.charAt(0).toUpperCase() + svc.type.slice(1)
        : "Domain",
      service_name: svc.service_name ?? "",
      provider: svc.provider ?? "",
      portal_url: svc.portal_url ?? "",
      login: svc.login ?? "",
      password: svc.password ?? "",
      expiry: svc.expiry ? new Date(svc.expiry).toISOString().slice(0, 10) : "",
      notes: svc.notes ?? "",
      meta: metaFromDb(svc.meta),
      createdAt: svc.createdAt,
      updatedAt: svc.updatedAt,
    }));
  }

  // Legacy flat format
  const rawType = doc.type ?? "domain";
  return [
    {
      clientId: doc._id,
      serviceId: doc._id,
      client_name: doc.client_name,
      customer_id: doc.customer_id ?? null,
      isLegacy: true,
      type: rawType.charAt(0).toUpperCase() + rawType.slice(1),
      service_name: doc.service_name ?? "",
      provider: doc.provider ?? "",
      portal_url: doc.portal_url ?? "",
      login: doc.login ?? "",
      password: doc.password ?? "",
      expiry: doc.expiry ? new Date(doc.expiry).toISOString().slice(0, 10) : "",
      notes: doc.notes ?? "",
      meta: metaFromDb(null),
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    },
  ];
}

function serviceToDb(row) {
  return {
    type: (row.type || "domain").toLowerCase(),
    service_name: row.service_name ?? "",
    provider: row.provider ?? "",
    portal_url: row.portal_url ?? "",
    login: row.login?.trim() || "admin",
    password: row.password ?? "",
    expiry: row.expiry ? new Date(row.expiry) : null,
    notes: row.notes ?? "",
    meta: metaToDb(row.meta),
  };
}

/* ─────────────────────────────────────────────
   API functions
───────────────────────────────────────────── */

export async function listCredentials() {
  const { data } = await api.get("/credentials");
  return data.flatMap(flattenClient);
}

export async function listClients() {
  const { data } = await api.get("/credentials");
  return data.map((doc) => ({
    id: doc._id,
    client_name: doc.client_name,
    customer_id: doc.customer_id ?? null,
    serviceCount: doc.services?.length || (doc.service_name ? 1 : 0),
  }));
}

/**
 * createCredential
 * payload.customer_id — optional Customers page id (hard link)
 */
export async function createCredential(payload) {
  const body = {
    client_name: payload.client_name,
    services: [serviceToDb(payload.service)],
  };
  // Only include customer_id when provided
  if (payload.customer_id) body.customer_id = payload.customer_id;

  const { data } = await api.post("/credentials", body);
  return flattenClient(data);
}

export async function addService(clientId, servicePayload) {
  const { data } = await api.post(`/credentials/${clientId}/services`, {
    services: [serviceToDb(servicePayload)],
  });
  return flattenClient(data);
}

/**
 * updateService
 * Legacy docs  → PATCH /credentials/:clientId
 * New docs     → PUT   /credentials/:clientId/services/:serviceId
 */
export async function updateService(clientId, serviceId, servicePayload) {
  if (servicePayload.isLegacy) {
    const { data } = await api.patch(`/credentials/${clientId}`, {
      service_name: servicePayload.service_name,
      type: (servicePayload.type || "domain").toLowerCase(),
      provider: servicePayload.provider,
      portal_url: servicePayload.portal_url,
      login: servicePayload.login?.trim() || "admin",
      password: servicePayload.password,
      expiry: servicePayload.expiry ? new Date(servicePayload.expiry) : null,
      notes: servicePayload.notes,
    });
    return flattenClient(data);
  }

  const { data } = await api.put(
    `/credentials/${clientId}/services/${serviceId}`,
    serviceToDb(servicePayload),
  );
  return flattenClient(data);
}

export async function deleteService(clientId, serviceId) {
  const { data } = await api.delete(
    `/credentials/${clientId}/services/${serviceId}`,
  );
  return data;
}

export async function bulkDeleteServices(clientId, serviceIds) {
  const { data } = await api.delete(`/credentials/${clientId}/services`, {
    data: { serviceIds },
  });
  return data;
}

export async function deleteClient(clientId) {
  await api.delete(`/credentials/${clientId}`);
  return true;
}

export async function listUpcomingRenewals(days = 30) {
  const { data } = await api.get(`/credentials/upcoming-renewals?days=${days}`);
  return data;
}

export async function exportCredentials() {
  const { data } = await api.get("/credentials/export");
  return data;
}

/* ── Renewal history ─────────────────────── */
export async function addRenewal(clientId, serviceId, renewal) {
  const { data } = await api.post(
    `/credentials/${clientId}/services/${serviceId}/renewals`,
    renewal,
  );
  return data;
}

export async function deleteRenewal(clientId, serviceId, renewalId) {
  const { data } = await api.delete(
    `/credentials/${clientId}/services/${serviceId}/renewals/${renewalId}`,
  );
  return data;
}
