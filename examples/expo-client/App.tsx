/**
 * Minimal Expo client for Phase 10 external API.
 * Flow: sign-in (PKCE) → /me → capabilities → inquiry → availability → book → refresh appointment.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Button, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:8000/api/v1';
const OAUTH_BASE = process.env.EXPO_PUBLIC_OAUTH_BASE || 'http://localhost:8000/api/o';
const CLIENT_ID = process.env.EXPO_PUBLIC_CLIENT_ID || '';
const WORKSPACE_ID = process.env.EXPO_PUBLIC_WORKSPACE_ID || '';
const REDIRECT = process.env.EXPO_PUBLIC_REDIRECT_URI || AuthSession.makeRedirectUri();

type Me = {
  identity_type?: string;
  user?: { email: string };
  memberships?: { workspace_id: string; role: string; profiles: string[] }[];
  clients?: { client_id: string; status: string; workspace_id: string; profiles: string[] }[];
};

export default function App() {
  const [token, setToken] = useState('');
  const [workspaceId, setWorkspaceId] = useState(WORKSPACE_ID);
  const [profile, setProfile] = useState<'client' | 'staff'>('client');
  const [log, setLog] = useState<string[]>([]);
  const [message, setMessage] = useState('Looking for a consult');
  const [calendarId, setCalendarId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00 AM');
  const [appointmentId, setAppointmentId] = useState('');

  const discovery = useMemo(
    () => ({
      authorizationEndpoint: `${OAUTH_BASE}/authorize/`,
      tokenEndpoint: `${OAUTH_BASE}/token/`,
    }),
    [],
  );

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri: REDIRECT,
      scopes: ['me', 'read:crm', 'write:crm', 'read:booking', 'write:booking'],
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery,
  );

  const push = (line: string) => setLog((prev) => [line, ...prev].slice(0, 50));

  const api = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = body.detail || body.code || res.statusText;
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
      }
      return body;
    },
    [token],
  );

  const wsPath = (suffix: string) => `/workspaces/${workspaceId}/${profile}${suffix}`;

  const signIn = async () => {
    const result = await promptAsync();
    if (result.type !== 'success' || !request?.codeVerifier) {
      push(`Auth cancelled: ${result.type}`);
      return;
    }
    const tokenRes = await AuthSession.exchangeCodeAsync(
      {
        clientId: CLIENT_ID,
        code: result.params.code,
        redirectUri: REDIRECT,
        extraParams: { code_verifier: request.codeVerifier },
      },
      discovery,
    );
    setToken(tokenRes.accessToken);
    push('Signed in');
  };

  const loadMe = async () => {
    const me = (await api('/me')) as Me;
    push(`me: ${me.identity_type} ${me.user?.email || ''}`);
    (me.memberships || []).forEach((m) =>
      push(`staff workspace ${m.workspace_id} role=${m.role} profiles=${m.profiles.join(',')}`),
    );
    (me.clients || []).forEach((c) =>
      push(`client ${c.client_id} status=${c.status} profiles=${(c.profiles || []).join(',')}`),
    );
    const activeClient = (me.clients || []).find((c) => c.status === 'active');
    if (activeClient && !workspaceId) {
      setWorkspaceId(activeClient.workspace_id);
      setProfile('client');
      push(`selected workspace ${activeClient.workspace_id} as client`);
    }
  };

  const loadCapabilities = async () => {
    const caps = await api(wsPath('/capabilities'));
    push(`capabilities profile=${caps.profile} entitlements=${(caps.entitlements || []).join(',')}`);
  };

  const submitInquiry = async () => {
    const row = await api(wsPath('/crm/inquiries'), {
      method: 'POST',
      headers: { 'Idempotency-Key': `inq-${Date.now()}` },
      body: JSON.stringify({ message }),
    });
    push(`inquiry #${row.id} status=${row.client_status}`);
  };

  const loadAvailability = async () => {
    const q = new URLSearchParams({ calendar_id: calendarId });
    if (date) q.set('date', date);
    const data = await api(`${wsPath('/availability')}?${q.toString()}`);
    if (data.slots) {
      push(`slots on ${date}: ${(data.slots || []).slice(0, 8).join(', ')}`);
    } else {
      push(`open dates: ${(data.dates || []).slice(0, 8).join(', ')}`);
    }
  };

  const book = async () => {
    const key = `book-${Date.now()}`;
    const appt = await api(wsPath('/appointments'), {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify({
        calendar_id: Number(calendarId),
        preferred_date: date,
        preferred_time: time,
      }),
    });
    setAppointmentId(appt.public_id);
    push(`booked ${appt.public_id} @ ${appt.display || `${appt.local_date} ${appt.local_time}`}`);
  };

  const refreshAppointments = async () => {
    const data = await api(wsPath('/appointments'));
    const rows = data.results || [];
    push(`appointments: ${rows.length}`);
    rows.forEach((r: { public_id: string; display?: string; local_date?: string; local_time?: string }) =>
      push(`  ${r.public_id} ${r.display || `${r.local_date} ${r.local_time}`}`),
    );
    if (appointmentId) {
      const match = rows.find((r: { public_id: string }) => r.public_id === appointmentId);
      push(
        match
          ? `tracked appointment now: ${match.display || `${match.local_date} ${match.local_time}`}`
          : 'tracked appointment not visible',
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <ScrollView>
        <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 12 }}>Enlighten-E client</Text>
        <Text style={{ marginBottom: 8 }}>API: {API_BASE}</Text>
        <Button title="1. Sign in (PKCE)" disabled={!request} onPress={signIn} />
        <View style={{ height: 8 }} />
        <Button title="2. GET /me" disabled={!token} onPress={() => loadMe().catch((e) => push(String(e)))} />
        <View style={{ height: 8 }} />
        <TextInput
          value={workspaceId}
          onChangeText={setWorkspaceId}
          placeholder="workspace public UUID"
          style={{ borderWidth: 1, padding: 8, marginBottom: 8 }}
        />
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <View style={{ flex: 1, marginRight: 4 }}>
            <Button title={profile === 'client' ? 'Profile: client ✓' : 'Use client'} onPress={() => setProfile('client')} />
          </View>
          <View style={{ flex: 1, marginLeft: 4 }}>
            <Button title={profile === 'staff' ? 'Profile: staff ✓' : 'Use staff'} onPress={() => setProfile('staff')} />
          </View>
        </View>
        <Button
          title="3. Load capabilities"
          disabled={!token || !workspaceId}
          onPress={() => loadCapabilities().catch((e) => push(String(e)))}
        />
        <View style={{ height: 8 }} />
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Inquiry message"
          style={{ borderWidth: 1, padding: 8, marginBottom: 8 }}
        />
        <Button
          title="4. Submit inquiry"
          disabled={!token || profile !== 'client'}
          onPress={() => submitInquiry().catch((e) => push(String(e)))}
        />
        <View style={{ height: 8 }} />
        <TextInput
          value={calendarId}
          onChangeText={setCalendarId}
          placeholder="calendar_id"
          style={{ borderWidth: 1, padding: 8, marginBottom: 8 }}
        />
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          style={{ borderWidth: 1, padding: 8, marginBottom: 8 }}
        />
        <TextInput
          value={time}
          onChangeText={setTime}
          placeholder="09:00 AM"
          style={{ borderWidth: 1, padding: 8, marginBottom: 8 }}
        />
        <Button
          title="5. Fetch availability"
          disabled={!token || profile !== 'client' || !calendarId}
          onPress={() => loadAvailability().catch((e) => push(String(e)))}
        />
        <View style={{ height: 8 }} />
        <Button
          title="6. Book appointment"
          disabled={!token || profile !== 'client'}
          onPress={() => book().catch((e) => push(String(e)))}
        />
        <View style={{ height: 8 }} />
        <Button
          title="7. Refresh appointments (after staff reschedule)"
          disabled={!token}
          onPress={() => refreshAppointments().catch((e) => push(String(e)))}
        />
        <View style={{ marginTop: 16 }}>
          {log.map((line, i) => (
            <Text key={`${i}-${line}`} style={{ fontFamily: 'Courier', marginBottom: 4 }}>
              {line}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
