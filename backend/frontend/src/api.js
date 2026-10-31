const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '/api');

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function fetchMeta() {
  return request('/meta/');
}

export function fetchLocalities() {
  return request('/localities/');
}

export function fetchProperties(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) return;
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, v));
      return;
    }
    if (value === true) {
      qs.set(key, 'true');
      return;
    }
    qs.set(key, String(value));
  });
  const query = qs.toString();
  return request(`/properties/${query ? `?${query}` : ''}`);
}

export function createLead({ phone, source = 'popup' }) {
  return request('/leads/', {
    method: 'POST',
    body: JSON.stringify({ phone, source }),
  });
}

export function fetchAdminStats() {
  return request('/admin/stats/');
}

export function fetchAdminLeads(params = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  const query = qs.toString();
  return request(`/admin/leads/${query ? `?${query}` : ''}`);
}

export function updateAdminLead(id, data) {
  return request(`/admin/leads/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function fetchAdminProperties() {
  return request('/admin/properties/');
}

export function createAdminProperty(data) {
  return request('/admin/properties/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
