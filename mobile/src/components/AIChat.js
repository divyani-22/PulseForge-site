import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '../api';
import { useI18n } from '../context/I18nContext';
import { Bot, User, Send, X } from './Icons';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../constants/theme';

export default function AIChat({ patientId, vitals, onClose }) {
  const { lang, t } = useI18n();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: t('aiGreeting'),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);

  // Update initial message if language changes and only initial message exists
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role: 'assistant', content: t('aiGreeting') }];
      }
      return prev;
    });
  }, [lang, t]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const handleSend = async () => {
    const userText = input.trim();
    if (!userText || loading) return;

    const userMsg = { role: 'user', content: userText };
    const historySnapshot = [...messages];

    // Functional state update: cleanly append user message
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(patientId, userText, lang, historySnapshot, vitals);
      const replyContent = (res && res.reply) ? res.reply : t('aiError');
      // Functional state update: cleanly append bot response
      setMessages((prev) => [...prev, { role: 'assistant', content: replyContent }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: t('aiError'),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.botIconWrapper}>
            <Bot size={18} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t('aiAssistant')}</Text>
            <Text style={styles.headerSubtitle}>
              {patientId ? `Patient Context: ${patientId}` : 'Clinical AI Telemetry'}
            </Text>
          </View>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={18} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Message List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <View key={idx} style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}>
              {!isUser && (
                <View style={styles.avatarAssistant}>
                  <Bot size={14} color={COLORS.primary} />
                </View>
              )}
              <View style={[styles.msgBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleAssistant]}>
                <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextAssistant]}>
                  {msg.content}
                </Text>
              </View>
              {isUser && (
                <View style={styles.avatarUser}>
                  <User size={14} color={COLORS.indigo600} />
                </View>
              )}
            </View>
          );
        })}

        {loading && (
          <View style={styles.msgRow}>
            <View style={styles.avatarAssistant}>
              <Bot size={14} color={COLORS.primary} />
            </View>
            <View style={[styles.msgBubble, styles.msgBubbleAssistant, styles.typingBubble]}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.typingText}>{t('thinking')}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={t('typeMessage')}
          placeholderTextColor={COLORS.slate400}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
          activeOpacity={0.7}
        >
          <Send size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  botIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  messageList: {
    flex: 1,
    backgroundColor: COLORS.screenBg,
  },
  messageListContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowAssistant: {
    justifyContent: 'flex-start',
  },
  avatarAssistant: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary200,
  },
  avatarUser: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.indigo50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.indigo200,
  },
  msgBubble: {
    maxWidth: '78%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  msgBubbleUser: {
    backgroundColor: COLORS.indigo600,
    borderBottomRightRadius: 2,
  },
  msgBubbleAssistant: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 19,
  },
  msgTextUser: {
    color: COLORS.white,
  },
  msgTextAssistant: {
    color: COLORS.slate800,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.slate500,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 13,
    color: COLORS.slate900,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.slate300,
  },
});
