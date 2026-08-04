import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { LoadingState } from '@/components/state-view';
import { Brand } from '@/constants/theme';
import { api } from '@/lib/api';
import { apiMessage, dateTime } from '@/lib/format';
import type { Message } from '@/lib/types';
import { useSession } from '@/providers/session-provider';

export default function ConversationScreen() {
  const { session } = useSession();
  const params = useLocalSearchParams<{ id: string; recipientId?: string; name?: string }>();
  const [items, setItems] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!params.id) return;
    try {
      const next = await api.get<Message[]>(`/messages/conversations/${encodeURIComponent(params.id)}`);
      setItems(next);
      await api.patch(`/messages/conversations/${encodeURIComponent(params.id)}/read`);
    } catch (reason) {
      Alert.alert('گفت‌وگو باز نشد', apiMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (session) load();
  }, [load, session]);

  if (!session) return <Redirect href="/sign-in" />;
  if (loading) return <LoadingState label="در حال بازکردن گفت‌وگو…" />;

  const recipientId =
    params.recipientId ||
    items.find((item) => item.senderId !== items[0]?.senderId)?.senderId ||
    '';

  async function send() {
    if (!body.trim() || !recipientId) return;
    setBusy(true);
    try {
      const created = await api.post<Message>('/messages', {
        recipientId,
        body: body.trim(),
      });
      setItems((current) => [...current, created]);
      setBody('');
    } catch (reason) {
      Alert.alert('پیام ارسال نشد', apiMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={styles.heading}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={Brand.emerald} />
          </View>
          <View style={styles.headingBody}>
            <Text style={styles.name}>{params.name ?? 'گفت‌وگوی باشگاه'}</Text>
            <Text style={styles.secure}>گفت‌وگوی امن داخل گُردیار</Text>
          </View>
        </View>
        <View style={styles.messages}>
          {items.map((item) => {
            const mine = item.senderId !== recipientId;
            return (
              <View key={item.id} style={[styles.messageRow, mine ? styles.mineRow : styles.otherRow]}>
                <Card style={[styles.bubble, mine ? styles.mine : styles.other]}>
                  <Text style={[styles.messageText, mine && styles.mineText]}>{item.body}</Text>
                  <Text style={[styles.messageDate, mine && styles.mineDate]}>{dateTime(item.createdAt)}</Text>
                </Card>
              </View>
            );
          })}
        </View>
        <View style={styles.composer}>
          <Button title="ارسال" icon="send" compact loading={busy} disabled={!body.trim()} onPress={send} />
          <View style={styles.composerField}>
            <Field value={body} onChangeText={setBody} placeholder="پیام خود را بنویسید…" multiline />
          </View>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heading: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: Brand.emeraldSoft, alignItems: 'center', justifyContent: 'center' },
  headingBody: { flex: 1, alignItems: 'flex-end' },
  name: { color: Brand.text, fontSize: 15, fontWeight: '900' },
  secure: { color: Brand.emerald, fontSize: 9, marginTop: 3 },
  messages: { gap: 8 },
  messageRow: { flexDirection: 'row' },
  mineRow: { justifyContent: 'flex-start' },
  otherRow: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '83%', padding: 11, borderRadius: 16, gap: 5 },
  mine: { backgroundColor: Brand.ink, borderColor: Brand.ink },
  other: { backgroundColor: Brand.card },
  messageText: { color: Brand.text, fontSize: 12, lineHeight: 19, textAlign: 'right' },
  mineText: { color: '#fff' },
  messageDate: { color: Brand.muted, fontSize: 8, textAlign: 'left' },
  mineDate: { color: '#AEBDB5' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  composerField: { flex: 1 },
});
